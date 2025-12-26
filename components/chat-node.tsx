"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { X, GitFork, Paperclip, Mic, Send, Check } from "lucide-react"
import type { ChatNodeType } from "@/lib/types"

interface ChatNodeProps {
  node: ChatNodeType
  isSelected: boolean
  onFork: (nodeId: string) => void
  onDelete: (nodeId: string) => void
  onUpdate: (nodeId: string, updates: Partial<ChatNodeType>) => void
  onToggleSelect: (nodeId: string) => void
}

export function ChatNode({ node, isSelected, onFork, onDelete, onUpdate, onToggleSelect }: ChatNodeProps) {
  const [input, setInput] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const nodeRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, textarea, input")) return
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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      onUpdate(node.id, {
        position: {
          x: (e.clientX - dragOffset.x) / 1, // Adjust for zoom if needed
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
    >
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
              className="h-7 w-7 text-white/60 hover:text-[#20b8cd] hover:bg-white/5"
              onClick={(e) => {
                e.stopPropagation()
                onFork(node.id)
              }}
            >
              <GitFork className="h-4 w-4" />
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
                <Paperclip className="h-4 w-4" />
              </Button>
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
