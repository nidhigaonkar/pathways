"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Mic, Send, Check, Plus, GitMerge } from "lucide-react"
import type { ChatNodeType } from "@/lib/types"

interface ChatNodeProps {
  node: ChatNodeType
  isSelected: boolean
  onFork: (nodeId: string) => void
  onDelete: (nodeId: string) => void
  onUpdate: (nodeId: string, updates: Partial<ChatNodeType>) => void
  onToggleSelect: (nodeId: string) => void
  onCreateDirectional: (nodeId: string, direction: "top" | "right" | "bottom" | "left") => void
  onStartMerge: (nodeId: string) => void
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
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const nodeRef = useRef<HTMLDivElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)

  const nodeWidth = node.size?.width || 400
  const nodeHeight = node.size?.height || 500

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [isEditingTitle])

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

  const handleSubmit = () => {
    if (!input.trim()) return
    onUpdate(node.id, {
      userMessage: input,
      isLoading: true,
    })
    setInput("")

    // Simulate AI response
    setTimeout(() => {
      onUpdate(node.id, {
        aiResponse:
          "This is a simulated AI response. In a real implementation, this would connect to an AI service to generate contextual responses based on your query.",
        isLoading: false,
        isActive: true, // Keep node active after response
      })
    }, 1500)
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

        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          {node.userMessage && (
            <div className="flex justify-end">
              <div className="bg-[#20b8cd] text-black px-4 py-2 rounded-xl max-w-[80%] text-sm break-words">
                {node.userMessage}
              </div>
            </div>
          )}

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

          {node.aiResponse && !node.isLoading && (
            <div className="bg-white/5 text-white px-4 py-3 rounded-xl text-sm leading-relaxed break-words">
              {node.aiResponse}
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
                className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
                onClick={(e) => e.stopPropagation()}
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
