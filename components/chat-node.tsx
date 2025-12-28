"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Mic, Send, Check, Plus, GitMerge } from "lucide-react"
import type { ChatNodeType, ChatMessage } from "@/lib/types"

interface ChatNodeProps {
  node: ChatNodeType
  isSelected: boolean
  onFork: (nodeId: string) => void
  onDelete: (nodeId: string) => void
  onUpdate: (nodeId: string, updates: Partial<ChatNodeType>) => void
  onToggleSelect: (nodeId: string) => void
  onCreateDirectional: (nodeId: string, direction: "top" | "right" | "bottom" | "left") => void
  onStartMerge: (nodeId: string) => void
  onRunNode?: (nodeId: string, userMessage: string) => Promise<void>
  isMergeMode: boolean
  mergeSourceId: string | null
  pan: { x: number; y: number }
  zoom: number
  isSearchMatch?: boolean // Added search match prop
  isSearching?: boolean // Added search active prop
}

export function ChatNode({
  node,
  isSelected,
  onFork,
  onDelete,
  onUpdate,
  onToggleSelect,
  onCreateDirectional,
  onStartMerge,
  onRunNode,
  isMergeMode,
  mergeSourceId,
  pan,
  zoom,
  isSearchMatch = true, // Default to true when not searching
  isSearching = false, // Default to false
}: ChatNodeProps) {
  const [input, setInput] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ mouseX: 0, mouseY: 0, nodeX: 0, nodeY: 0 })
  const [isResizing, setIsResizing] = useState(false)
  const [resizeStart, setResizeStart] = useState({ mouseX: 0, mouseY: 0, width: 0, height: 0, x: 0, y: 0 })
  const [resizeDirection, setResizeDirection] = useState<"nw" | "ne" | "sw" | "se" | null>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState(node.title || `Node ${node.id}`)
  const [isRecording, setIsRecording] = useState(false)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const nodeRef = useRef<HTMLDivElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)
  const baseTextRef = useRef<string>("")

  const nodeWidth = node.size?.width || 400
  const nodeHeight = node.size?.height || 500

  // Function to strip HTML/XML tags from text
  const stripTags = (text: string): string => {
    return text.replace(/<[^>]*>/g, '')
  }

  // Function to parse inline markdown (bold, italic, code)
  const parseInlineMarkdown = (text: string): React.ReactNode => {
    const parts: (string | React.ReactElement)[] = []
    let lastIndex = 0
    let keyCounter = 0
    
    // Match **bold** (must be double asterisks, not single)
    const markdownRegex = /(\*\*([^*]+)\*\*|\*([^*\n]+)\*|`([^`]+)`)/g
    let match
    
    while ((match = markdownRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        const beforeText = text.slice(lastIndex, match.index)
        if (beforeText) {
          parts.push(beforeText)
        }
      }
      
      // Add the formatted text
      if (match[1].startsWith('**')) {
        // Bold text
        parts.push(<strong key={`md-${keyCounter++}`}>{match[2]}</strong>)
      } else if (match[1].startsWith('*') && !match[1].startsWith('**')) {
        // Italic text (single asterisk, not double)
        parts.push(<em key={`md-${keyCounter++}`}>{match[3]}</em>)
      } else if (match[1].startsWith('`')) {
        // Code text
        parts.push(<code key={`md-${keyCounter++}`} className="bg-white/10 px-1 rounded text-xs font-mono">{match[4]}</code>)
      }
      
      lastIndex = match.index + match[0].length
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex)
      if (remainingText) {
        parts.push(remainingText)
      }
    }
    
    return parts.length > 0 ? <>{parts}</> : text
  }

  // Function to parse markdown and return JSX elements
  const parseMarkdown = (text: string): React.ReactNode => {
    // First strip HTML tags
    const cleanedText = stripTags(text)
    
    // Split by lines to handle headers
    const lines = cleanedText.split('\n')
    const elements: React.ReactNode[] = []
    let keyCounter = 0
    
    lines.forEach((line, lineIndex) => {
      // Check for headers (#, ##, ###, etc.)
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/)
      
      if (headerMatch) {
        const headerLevel = headerMatch[1].length
        const headerText = headerMatch[2]
        
        // Render header with appropriate size
        const headerSize = headerLevel === 1 ? 'text-xl' : headerLevel === 2 ? 'text-lg' : 'text-base'
        const headerWeight = 'font-semibold'
        
        elements.push(
          <div key={`header-${keyCounter++}`} className={`${headerSize} ${headerWeight} mt-4 mb-2 first:mt-0`}>
            {parseInlineMarkdown(headerText)}
          </div>
        )
      } else if (line.trim()) {
        // Regular line with inline markdown
        elements.push(
          <div key={`line-${keyCounter++}`} className={lineIndex > 0 ? 'mt-2' : ''}>
            {parseInlineMarkdown(line)}
          </div>
        )
      } else {
        // Empty line for spacing
        elements.push(<div key={`empty-${keyCounter++}`} className="h-2" />)
      }
    })
    
    return <>{elements}</>
  }

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [isEditingTitle])

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = "en-US"

        recognition.onresult = (event: any) => {
          let interimTranscript = ""
          let finalTranscript = ""

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript + " "
              // Update base text when we get final results
              baseTextRef.current = baseTextRef.current + finalTranscript
            } else {
              interimTranscript += transcript
            }
          }

          // Combine base text + final transcript + interim transcript
          const newText = baseTextRef.current + finalTranscript + (interimTranscript ? ` ${interimTranscript}` : "")
          setInput(newText)
        }

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error)
          setIsRecording(false)
          if (event.error === "no-speech") {
            // User stopped speaking, keep the text
          } else if (event.error === "not-allowed") {
            alert("Microphone permission denied. Please enable microphone access in your browser settings.")
          }
        }

        recognition.onend = () => {
          setIsRecording(false)
          // baseTextRef is already updated by onresult when final transcripts are received
        }

        recognitionRef.current = recognition
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          // Ignore errors when stopping
        }
      }
    }
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, textarea, input, select, .resize-handle")) return

    onUpdate(node.id, { isActive: true })

    setIsDragging(true)
    setDragStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      nodeX: node.position.x,
      nodeY: node.position.y,
    })
    e.stopPropagation()
  }

  const handleResizeMouseDown = (e: React.MouseEvent, direction: "nw" | "ne" | "sw" | "se") => {
    e.stopPropagation()
    setIsResizing(true)
    setResizeDirection(direction)
    setResizeStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      width: nodeWidth,
      height: nodeHeight,
      x: node.position.x,
      y: node.position.y,
    })
  }

  const handleSubmit = async () => {
    if (!input.trim()) return
    const userMessage = input.trim()
    setInput("")
    
    // If onRunNode is provided, use it (for batch operations)
    // Otherwise, handle locally
    if (onRunNode) {
      await onRunNode(node.id, userMessage)
      return
    }
    
    // Get current messages or initialize empty array
    const currentMessages = node.messages || []
    
    // Add user message to conversation
    const updatedMessages = [...currentMessages, { role: 'user' as const, content: userMessage }]
    
    onUpdate(node.id, {
      messages: updatedMessages,
      isLoading: true,
    })

    try {
      const selectedModel = node.model || 'sonar'
      console.log('Sending request with model:', selectedModel, 'for node:', node.id)
      
      const response = await fetch('/api/perplexity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages,
          model: selectedModel,
        }),
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`)
      }

      const data = await response.json()
      let aiResponse = data.response || 'No response generated'
      
      // Strip HTML/XML tags from the response
      aiResponse = stripTags(aiResponse)
      
      // Add AI response to conversation
      const finalMessages = [...updatedMessages, { role: 'assistant' as const, content: aiResponse }]
      
      onUpdate(node.id, {
        messages: finalMessages,
        isLoading: false,
        isActive: true, // Keep node active after response
      })
    } catch (error) {
      console.error('Error calling Perplexity API:', error)
      // Add error message to conversation
      const errorMessages = [...updatedMessages, { 
        role: 'assistant' as const, 
        content: 'Sorry, there was an error generating a response. Please try again.' 
      }]
      
      onUpdate(node.id, {
        messages: errorMessages,
        isLoading: false,
        isActive: true,
      })
    }
  }

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false)
    }, 100)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing && resizeDirection) {
        const deltaX = (e.clientX - resizeStart.mouseX) / zoom
        const deltaY = (e.clientY - resizeStart.mouseY) / zoom

        let newWidth = resizeStart.width
        let newHeight = resizeStart.height
        let newX = resizeStart.x
        let newY = resizeStart.y

        if (resizeDirection.includes("e")) {
          newWidth = Math.max(300, resizeStart.width + deltaX)
        }
        if (resizeDirection.includes("w")) {
          newWidth = Math.max(300, resizeStart.width - deltaX)
          newX = resizeStart.x + (resizeStart.width - newWidth)
        }
        if (resizeDirection.includes("s")) {
          newHeight = Math.max(400, resizeStart.height + deltaY)
        }
        if (resizeDirection.includes("n")) {
          newHeight = Math.max(400, resizeStart.height - deltaY)
          newY = resizeStart.y + (resizeStart.height - newHeight)
        }

        onUpdate(node.id, {
          size: { width: newWidth, height: newHeight },
          position: { x: newX, y: newY },
        })
        return
      }

      if (!isDragging) return
      const deltaX = (e.clientX - dragStart.mouseX) / zoom
      const deltaY = (e.clientY - dragStart.mouseY) / zoom

      onUpdate(node.id, {
        position: {
          x: dragStart.nodeX + deltaX,
          y: dragStart.nodeY + deltaY,
        },
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
      setResizeDirection(null)
    }

    if (isDragging || isResizing) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, isResizing, resizeDirection, resizeStart, dragStart, node.id, onUpdate, zoom])

  const handleTitleSave = () => {
    onUpdate(node.id, { title: titleInput })
    setIsEditingTitle(false)
  }

  return (
    <motion.div
      ref={nodeRef}
      className="chat-node absolute"
      style={{
        left: `${node.position.x}px`,
        top: `${node.position.y}px`,
        width: `${nodeWidth}px`,
        height: `${nodeHeight}px`,
        opacity: isSearching && !isSearchMatch ? 0.3 : 1, // Dim non-matching nodes during search
        transition: "opacity 0.2s ease-in-out", // Smooth transition for opacity changes
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: isSearching && !isSearchMatch ? 0.3 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {isHovered && (
        <>
          <button
            className="absolute -top-6 left-1/2 -translate-x-1/2 w-8 h-8 bg-[#20b8cd] hover:bg-[#1a9db0] rounded-full flex items-center justify-center text-black shadow-lg z-50"
            onClick={(e) => {
              e.stopPropagation()
              onCreateDirectional(node.id, "top")
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            className="absolute top-1/2 -translate-y-1/2 -right-6 w-8 h-8 bg-[#20b8cd] hover:bg-[#1a9db0] rounded-full flex items-center justify-center text-black shadow-lg z-50"
            onClick={(e) => {
              e.stopPropagation()
              onCreateDirectional(node.id, "right")
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-8 h-8 bg-[#20b8cd] hover:bg-[#1a9db0] rounded-full flex items-center justify-center text-black shadow-lg z-50"
            onClick={(e) => {
              e.stopPropagation()
              onCreateDirectional(node.id, "bottom")
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            className="absolute top-1/2 -translate-y-1/2 -left-6 w-8 h-8 bg-[#20b8cd] hover:bg-[#1a9db0] rounded-full flex items-center justify-center text-black shadow-lg z-50"
            onClick={(e) => {
              e.stopPropagation()
              onCreateDirectional(node.id, "left")
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <Plus className="h-4 w-4" />
          </button>
          <div
            className="resize-handle absolute -top-1 -left-1 w-3 h-3 bg-white/20 hover:bg-[#20b8cd] rounded-full cursor-nw-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, "nw")}
          />
          <div
            className="resize-handle absolute -top-1 -right-1 w-3 h-3 bg-white/20 hover:bg-[#20b8cd] rounded-full cursor-ne-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, "ne")}
          />
          <div
            className="resize-handle absolute -bottom-1 -left-1 w-3 h-3 bg-white/20 hover:bg-[#20b8cd] rounded-full cursor-sw-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, "sw")}
          />
          <div
            className="resize-handle absolute -bottom-1 -right-1 w-3 h-3 bg-white/20 hover:bg-[#20b8cd] rounded-full cursor-se-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, "se")}
          />
        </>
      )}

      <div
        className={`bg-[#1a1b1b] rounded-xl shadow-2xl overflow-hidden transition-all cursor-move h-full flex flex-col ${
          node.isActive ? "ring-2 ring-[#20b8cd] shadow-[0_0_20px_rgba(32,184,205,0.3)]" : ""
        } ${isSelected ? "ring-2 ring-[#20b8cd]/60" : ""} ${
          isMergeMode && mergeSourceId === node.id ? "ring-2 ring-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)]" : ""
        } ${isSearching && isSearchMatch ? "ring-2 ring-[#20b8cd] shadow-[0_0_20px_rgba(32,184,205,0.3)]" : ""}`}
      >
        <div className="flex items-center justify-between p-3 border-b border-white/10">
          <div className="flex items-center gap-2 flex-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleSelect(node.id)
              }}
              className="w-4 h-4 rounded border-2 border-white/40 flex items-center justify-center hover:border-[#20b8cd] transition-colors"
            >
              {isSelected && <Check className="h-3 w-3 text-[#20b8cd]" />}
            </button>
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTitleSave()
                  if (e.key === "Escape") {
                    setTitleInput(node.title || `Node ${node.id}`)
                    setIsEditingTitle(false)
                  }
                  e.stopPropagation()
                }}
                onClick={(e) => e.stopPropagation()}
                className="text-xs text-white bg-white/10 px-2 py-1 rounded border border-white/20 focus:outline-none focus:border-[#20b8cd] flex-1"
              />
            ) : (
              <span
                className="text-xs text-white/80 cursor-text hover:text-white transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsEditingTitle(true)
                }}
              >
                {node.title || `Node ${node.id}`}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/60 hover:text-yellow-400 hover:bg-white/5"
              onClick={(e) => {
                e.stopPropagation()
                onStartMerge(node.id)
              }}
              title="Merge with another node"
            >
              <GitMerge className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/60 hover:text-red-400 hover:bg-white/5"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(node.id)
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="px-3 py-2 border-b border-white/10">
          <Select value={node.model || "sonar"} onValueChange={(value) => onUpdate(node.id, { model: value })}>
            <SelectTrigger className="h-8 text-xs bg-white/5 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sonar">Sonar</SelectItem>
              <SelectItem value="sonar-pro">Sonar Pro</SelectItem>
              <SelectItem value="sonar-reasoning-pro">Sonar Reasoning Pro</SelectItem>
              <SelectItem value="sonar-deep-research">Sonar Deep Research</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div 
          className="p-4 space-y-4 flex-1 overflow-y-auto"
          onWheel={(e) => {
            // Stop scroll events from propagating to canvas zoom
            e.stopPropagation()
          }}
        >
          {/* Display conversation history */}
          {(node.messages || []).map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`px-4 py-2 rounded-xl max-w-[80%] text-sm break-words whitespace-pre-wrap leading-relaxed ${
                  message.role === 'user'
                    ? 'bg-[#20b8cd] text-black'
                    : 'bg-white/5 text-white'
                }`}
              >
                {message.role === 'assistant' ? parseMarkdown(message.content) : message.content}
              </div>
            </div>
          ))}

          {/* Show loading indicator when waiting for response */}
          {node.isLoading && (
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-[#20b8cd] rounded-full animate-bounce [animation-delay:0ms]" />
                <div className="w-2 h-2 bg-[#20b8cd] rounded-full animate-bounce [animation-delay:150ms]" />
                <div className="w-2 h-2 bg-[#20b8cd] rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
              <span>Thinking...</span>
            </div>
          )}

          {/* Backward compatibility: show old userMessage/aiResponse if messages array doesn't exist */}
          {(!node.messages || node.messages.length === 0) && node.userMessage && (
            <div className="flex justify-end">
              <div className="bg-[#20b8cd] text-black px-4 py-2 rounded-xl max-w-[80%] text-sm break-words whitespace-pre-wrap leading-relaxed">
                {node.userMessage}
              </div>
            </div>
          )}
          {(!node.messages || node.messages.length === 0) && node.aiResponse && !node.isLoading && (
            <div className="bg-white/5 text-white px-4 py-3 rounded-xl text-sm leading-relaxed break-words whitespace-pre-wrap">
              {parseMarkdown(node.aiResponse)}
            </div>
          )}
        </div>

        <div className="p-3 border-t border-white/10">
          <div className="bg-white/5 rounded-lg p-2 flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              className="bg-transparent border-none text-white placeholder:text-white/40 resize-none min-h-[40px] max-h-[120px] focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${
                  isRecording
                    ? "text-red-400 hover:text-red-300 bg-red-500/20 hover:bg-red-500/30 animate-pulse"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
                onClick={(e) => {
                  e.stopPropagation()
                  if (!recognitionRef.current) {
                    alert("Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.")
                    return
                  }

                  if (isRecording) {
                    // Stop recording
                    try {
                      recognitionRef.current.stop()
                      setIsRecording(false)
                    } catch (error) {
                      console.error("Error stopping recognition:", error)
                      setIsRecording(false)
                    }
                  } else {
                    // Start recording
                    try {
                      // Store current input as base text before starting
                      baseTextRef.current = input
                      recognitionRef.current.start()
                      setIsRecording(true)
                    } catch (error) {
                      console.error("Error starting recognition:", error)
                      setIsRecording(false)
                    }
                  }
                }}
                title={isRecording ? "Stop recording" : "Start voice input"}
              >
                <Mic className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                className="h-8 w-8 bg-[#20b8cd] hover:bg-[#1a9db0] text-black"
                onClick={(e) => {
                  e.stopPropagation()
                  handleSubmit()
                }}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
