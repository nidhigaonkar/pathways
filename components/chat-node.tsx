"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Mic, Send, Check, Plus } from "lucide-react"
import type { ChatNodeType } from "@/lib/types"

interface ChatNodeProps {
  node: ChatNodeType
  isSelected: boolean
  onFork: (nodeId: string) => void
  onDelete: (nodeId: string) => void
  onUpdate: (nodeId: string, updates: Partial<ChatNodeType>) => void
  onToggleSelect: (nodeId: string) => void
  onCreateDirectional: (nodeId: string, direction: "top" | "right" | "bottom" | "left") => void
}

export function ChatNode({
  node,
  isSelected,
  onFork,
  onDelete,
  onUpdate,
  onToggleSelect,
  onCreateDirectional,
}: ChatNodeProps) {
  const [input, setInput] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const nodeRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, textarea, input, select")) return
    setIsDragging(true)
    const rect = nodeRef.current?.getBoundingClientRect()
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }
    e.stopPropagation()
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
        isActive: false,
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
      if (!isDragging) return
      onUpdate(node.id, {
        position: {
          x: (e.clientX - dragOffset.x) / 1,
          y: (e.clientY - dragOffset.y) / 1,
        },
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, dragOffset, node.id, onUpdate])

  return (
    <motion.div
      ref={nodeRef}
      className="chat-node absolute"
      style={{
        left: node.position.x,
        top: node.position.y,
        width: 400,
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
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
        </>
      )}

      <div
        className={`bg-[#1a1b1b] rounded-xl shadow-2xl overflow-hidden transition-all cursor-move ${
          node.isActive ? "ring-2 ring-[#20b8cd] shadow-[0_0_20px_rgba(32,184,205,0.3)]" : ""
        } ${isSelected ? "ring-2 ring-[#20b8cd]/60" : ""}`}
      >
        {/* Node header */}
        <div className="flex items-center justify-between p-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleSelect(node.id)
              }}
              className="w-4 h-4 rounded border-2 border-white/40 flex items-center justify-center hover:border-[#20b8cd] transition-colors"
            >
              {isSelected && <Check className="h-3 w-3 text-[#20b8cd]" />}
            </button>
            <span className="text-xs text-white/60">Node {node.id}</span>
          </div>
          <div className="flex items-center gap-1">
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

        <div className="px-3 py-2 border-b border-white/10 flex gap-2">
          <Select value={node.usageType || "focus"} onValueChange={(value) => onUpdate(node.id, { usageType: value })}>
            <SelectTrigger className="h-8 text-xs bg-white/5 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="focus">Focus</SelectItem>
              <SelectItem value="research">Research</SelectItem>
              <SelectItem value="learn">Learn</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
              <SelectItem value="code">Code</SelectItem>
              <SelectItem value="video">Video</SelectItem>
            </SelectContent>
          </Select>

          <Select value={node.model || "gpt4"} onValueChange={(value) => onUpdate(node.id, { model: value })}>
            <SelectTrigger className="h-8 text-xs bg-white/5 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt4">GPT-4</SelectItem>
              <SelectItem value="claude">Claude</SelectItem>
              <SelectItem value="gemini">Gemini</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Messages */}
        <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
          {node.userMessage && (
            <div className="flex justify-end">
              <div className="bg-[#20b8cd] text-black px-4 py-2 rounded-xl max-w-[80%] text-sm">{node.userMessage}</div>
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
            <div className="bg-white/5 text-white px-4 py-3 rounded-xl text-sm leading-relaxed">{node.aiResponse}</div>
          )}
        </div>

        {/* Input area */}
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
