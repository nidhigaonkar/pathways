"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ChatNode } from "@/components/chat-node"
import { CanvasNavbar } from "@/components/canvas-navbar"
import { Minimap } from "@/components/minimap"
import { Sparkles } from "lucide-react"
import type { ChatNodeType } from "@/lib/types"

export default function InfiniteCanvasPage() {
  const [nodes, setNodes] = useState<ChatNodeType[]>([
    {
      id: "1",
      position: { x: 600, y: 300 },
      userMessage: "What is the future of AI?",
      aiResponse:
        "The future of AI is incredibly exciting and transformative. We're moving towards more sophisticated systems that can understand context, reason across domains, and collaborate with humans in meaningful ways. Key trends include multimodal AI, improved reasoning capabilities, and more efficient models.",
      parentId: null,
      expanded: true,
      isActive: false,
      isLoading: false,
      model: "gpt4",
      usageType: "focus",
    },
  ])
  const [selectedNodes, setSelectedNodes] = useState<string[]>([])
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)

  // Handle canvas panning
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest(".chat-node")) return
      setIsDragging(true)
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    },
    [pan],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    },
    [isDragging, dragStart],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Handle zoom with scroll
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY * -0.001
      const newZoom = Math.min(Math.max(0.5, zoom + delta), 2)
      setZoom(newZoom)
    },
    [zoom],
  )

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.ctrlKey || e.metaKey) {
        const rect = canvasRef.current?.getBoundingClientRect()
        if (!rect) return

        const x = (e.clientX - rect.left - pan.x) / zoom
        const y = (e.clientY - rect.top - pan.y) / zoom

        const newNode: ChatNodeType = {
          id: Date.now().toString(),
          position: { x, y },
          userMessage: "",
          aiResponse: "",
          parentId: null,
          expanded: true,
          isActive: true,
          isLoading: false,
          model: "gpt4",
          usageType: "focus",
        }
        setNodes([...nodes, newNode])
      }
    },
    [nodes, pan, zoom],
  )

  const handleCreateDirectional = useCallback(
    (parentId: string, direction: "top" | "right" | "bottom" | "left") => {
      const parent = nodes.find((n) => n.id === parentId)
      if (!parent) return

      const offsets = {
        top: { x: 0, y: -300 },
        right: { x: 500, y: 0 },
        bottom: { x: 0, y: 300 },
        left: { x: -500, y: 0 },
      }

      const offset = offsets[direction]
      const newNode: ChatNodeType = {
        id: Date.now().toString(),
        position: { x: parent.position.x + offset.x, y: parent.position.y + offset.y },
        userMessage: "",
        aiResponse: "",
        parentId,
        expanded: true,
        isActive: true,
        isLoading: false,
        model: parent.model || "gpt4",
        usageType: parent.usageType || "focus",
      }
      console.log("[v0] Creating node with parent", parentId, "in direction", direction)
      setNodes([...nodes, newNode])
    },
    [nodes],
  )

  // Fork node (create child)
  const handleForkNode = useCallback(
    (parentId: string) => {
      const parent = nodes.find((n) => n.id === parentId)
      if (!parent) return

      const newNode: ChatNodeType = {
        id: Date.now().toString(),
        position: { x: parent.position.x + 500, y: parent.position.y + 200 },
        userMessage: "",
        aiResponse: "",
        parentId,
        expanded: true,
        isActive: true,
        isLoading: false,
        model: parent.model || "gpt4",
        usageType: parent.usageType || "focus",
      }
      setNodes([...nodes, newNode])
    },
    [nodes],
  )

  // Delete node
  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      setNodes(nodes.filter((n) => n.id !== nodeId))
      setSelectedNodes(selectedNodes.filter((id) => id !== nodeId))
    },
    [nodes, selectedNodes],
  )

  // Update node
  const handleUpdateNode = useCallback(
    (nodeId: string, updates: Partial<ChatNodeType>) => {
      setNodes(nodes.map((n) => (n.id === nodeId ? { ...n, ...updates } : n)))
    },
    [nodes],
  )

  // Toggle node selection
  const handleToggleSelect = useCallback((nodeId: string) => {
    setSelectedNodes((prev) => (prev.includes(nodeId) ? prev.filter((id) => id !== nodeId) : [...prev, nodeId]))
  }, [])

  const renderConnections = () => {
    const NODE_WIDTH = 400
    const NODE_HEIGHT = 200

    return nodes
      .filter((node) => node.parentId)
      .map((node) => {
        const parent = nodes.find((n) => n.id === node.parentId)
        if (!parent) return null

        const startX = parent.position.x + NODE_WIDTH / 2
        const startY = parent.position.y + NODE_HEIGHT / 2
        const endX = node.position.x + NODE_WIDTH / 2
        const endY = node.position.y + NODE_HEIGHT / 2

        const dx = endX - startX
        const dy = endY - startY
        const distance = Math.sqrt(dx * dx + dy * dy)
        const curvature = Math.min(distance * 0.3, 100)

        const controlX1 = startX + dx * 0.5
        const controlY1 = startY - curvature
        const controlX2 = startX + dx * 0.5
        const controlY2 = endY + curvature

        console.log("[v0] Drawing connection from", parent.id, "to", node.id, { startX, startY, endX, endY })

        return (
          <g key={node.id}>
            <path
              d={`M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`}
              stroke="#20b8cd"
              strokeWidth="2"
              fill="none"
              opacity="0.6"
            />
            <circle cx={endX} cy={endY} r="4" fill="#20b8cd" />
          </g>
        )
      })
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#202222] flex flex-col">
      <CanvasNavbar />

      <div
        ref={canvasRef}
        className="flex-1 relative cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleCanvasClick}
      >
        {/* Canvas grid background */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: `${40 * zoom}px ${40 * zoom}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`,
          }}
        />

        {/* SVG for connection lines */}
        <svg
          className="absolute inset-0 pointer-events-none w-full h-full"
          style={{
            width: "100%",
            height: "100%",
          }}
        >
          <g
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
            }}
          >
            {renderConnections()}
          </g>
        </svg>

        {/* Chat nodes */}
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
          }}
        >
          <AnimatePresence>
            {nodes.map((node) => (
              <ChatNode
                key={node.id}
                node={node}
                isSelected={selectedNodes.includes(node.id)}
                onFork={handleForkNode}
                onDelete={handleDeleteNode}
                onUpdate={handleUpdateNode}
                onToggleSelect={handleToggleSelect}
                onCreateDirectional={handleCreateDirectional}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Instructions overlay */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#20b8cd]" />
            <span>Ctrl+Click to create node • Drag to pan • Scroll to zoom</span>
          </div>
        </div>

        {/* Merge button when multiple nodes selected */}
        {selectedNodes.length >= 2 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
            <Button
              className="bg-[#20b8cd] hover:bg-[#1a9db0] text-black font-medium shadow-lg"
              onClick={() => {
                console.log("Merging nodes:", selectedNodes)
              }}
            >
              Merge {selectedNodes.length} Nodes
            </Button>
          </div>
        )}
      </div>

      {/* Minimap */}
      <Minimap nodes={nodes} pan={pan} zoom={zoom} />
    </div>
  )
}
