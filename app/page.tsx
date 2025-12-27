"use client"

import type React from "react"
import type JSX from "jsx" // Declare the JSX variable before using it

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
      parentIds: null, // Updated to handle multiple parents
      connectionDirection: null,
      expanded: true,
      isActive: false,
      isLoading: false,
      model: "sonar",
      usageType: "focus",
      size: { width: 400, height: 500 },
      title: "AI Future Discussion",
    },
  ])
  const [selectedNodes, setSelectedNodes] = useState<string[]>([])
  const [isMergeMode, setIsMergeMode] = useState(false)
  const [mergeSourceId, setMergeSourceId] = useState<string | null>(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)
  const [searchQuery, setSearchQuery] = useState("") // Added search state

  // Handle canvas panning
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest(".chat-node")) return

      // Deactivate all nodes when clicking canvas
      setNodes((prev) => prev.map((n) => ({ ...n, isActive: false })))

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

  const handleCanvasDoubleClick = useCallback(
    (e: React.MouseEvent) => {
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
        parentIds: null,
        connectionDirection: null,
        expanded: true,
        isActive: true,
        isLoading: false,
        model: "sonar",
        usageType: "focus",
        size: { width: 400, height: 500 },
      }
      setNodes([...nodes, newNode])
    },
    [nodes, pan, zoom],
  )

  const handleCreateDirectional = useCallback(
    (parentId: string, direction: "top" | "right" | "bottom" | "left") => {
      const parent = nodes.find((n) => n.id === parentId)
      if (!parent) return

      const parentWidth = parent.size?.width || 400
      const parentHeight = parent.size?.height || 500
      const nodeWidth = parent.size?.width || 400
      const nodeHeight = parent.size?.height || 500
      const gap = 120 // extra gap so arrowheads stay visible

      const offsets = {
        top: { x: -nodeWidth / 2 + parentWidth / 2, y: -(nodeHeight + gap) },
        right: { x: parentWidth + gap, y: -nodeHeight / 2 + parentHeight / 2 },
        bottom: { x: -nodeWidth / 2 + parentWidth / 2, y: parentHeight + gap },
        left: { x: -(nodeWidth + gap), y: -nodeHeight / 2 + parentHeight / 2 },
      }

      const offset = offsets[direction]
      const newNode: ChatNodeType = {
        id: Date.now().toString(),
        position: {
          x: parent.position.x + offset.x,
          y: parent.position.y + offset.y,
        },
        userMessage: "",
        aiResponse: "",
        parentId,
        parentIds: null, // Updated to handle multiple parents
        connectionDirection: direction,
        expanded: true,
        isActive: false, // Don't auto-activate new nodes
        isLoading: false,
        model: parent.model || "sonar",
        usageType: parent.usageType || "focus",
        size: { width: 400, height: 500 },
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
        position: {
          x: parent.position.x + (parent.size?.width || 400) + 160, // gap so arrowhead is visible
          y: parent.position.y + (parent.size?.height || 500) / 2 - 250,
        },
        userMessage: "",
        aiResponse: "",
        parentId,
        parentIds: null, // Updated to handle multiple parents
        connectionDirection: "right",
        expanded: true,
        isActive: false, // Don't auto-activate new nodes
        isLoading: false,
        model: parent.model || "sonar",
        usageType: parent.usageType || "focus",
        size: { width: 400, height: 500 }, // Added size property
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
      setNodes(
        nodes.map((n) => {
          if (n.id === nodeId && updates.isActive === true) {
            return { ...n, ...updates }
          } else if (n.id !== nodeId && updates.isActive === true) {
            return { ...n, isActive: false }
          }
          return n.id === nodeId ? { ...n, ...updates } : n
        }),
      )
    },
    [nodes],
  )

  const handleToggleSelect = useCallback((nodeId: string) => {
    setSelectedNodes((prev) => (prev.includes(nodeId) ? prev.filter((id) => id !== nodeId) : [...prev, nodeId]))
  }, [])

  const renderConnections = () => {
    const connections: JSX.Element[] = []

    nodes.forEach((node) => {
      const parentIds = node.parentIds || (node.parentId ? [node.parentId] : [])

      if (parentIds.length === 0) return

      const nodeWidth = node.size?.width || 400
      const nodeHeight = node.size?.height || 500
      const nodeCenterX = node.position.x + nodeWidth / 2
      const nodeCenterY = node.position.y + nodeHeight / 2

      const arrowHeadOffset = 50

      if (parentIds.length === 1) {
        const parent = nodes.find((n) => n.id === parentIds[0])
        if (!parent) return

        const parentWidth = parent.size?.width || 400
        const parentHeight = parent.size?.height || 500
        const parentCenterX = parent.position.x + parentWidth / 2
        const parentCenterY = parent.position.y + parentHeight / 2

        const padding = 50

        // Calculate the difference between centers
        const dx = nodeCenterX - parentCenterX
        const dy = nodeCenterY - parentCenterY

        // Determine which edges to connect based on relative positions
        let startX, startY, endX, endY

        // Calculate if nodes overlap in x or y axis
        const parentLeft = parent.position.x
        const parentRight = parent.position.x + parentWidth
        const parentTop = parent.position.y
        const parentBottom = parent.position.y + parentHeight
        
        const nodeLeft = node.position.x
        const nodeRight = node.position.x + nodeWidth
        const nodeTop = node.position.y
        const nodeBottom = node.position.y + nodeHeight

        // Check horizontal and vertical alignment
        const horizontalOverlap = !(nodeRight < parentLeft || nodeLeft > parentRight)
        const verticalOverlap = !(nodeBottom < parentTop || nodeTop > parentBottom)

        if (Math.abs(dy) > Math.abs(dx) || horizontalOverlap) {
          // Primarily vertical connection
          if (dy > 0) {
            // Child is below parent - connect parent bottom to child top
            startX = parentCenterX
            startY = parentBottom
            endX = nodeCenterX
            endY = nodeTop + padding
          } else {
            // Child is above parent - connect parent top to child bottom
            startX = parentCenterX
            startY = parentTop
            endX = nodeCenterX
            endY = nodeBottom - padding
          }
        } else {
          // Primarily horizontal connection
          if (dx > 0) {
            // Child is to the right of parent - connect parent right to child left
            startX = parentRight
            startY = parentCenterY
            endX = nodeLeft + padding
            endY = nodeCenterY
          } else {
            // Child is to the left of parent - connect parent left to child right
            startX = parentLeft
            startY = parentCenterY
            endX = nodeRight - padding
            endY = nodeCenterY
          }
        }

        // Pull the end point back slightly so the arrowhead tip is visible
        const endDx = endX - startX
        const endDy = endY - startY
        const endDist = Math.sqrt(endDx * endDx + endDy * endDy) || 1
        endX -= (endDx / endDist) * arrowHeadOffset
        endY -= (endDy / endDist) * arrowHeadOffset

        // Create smooth bezier curve
        const distance = Math.sqrt(dx * dx + dy * dy)
        const curvature = Math.min(distance * 0.3, 100)

        let controlX1, controlY1, controlX2, controlY2

        if (Math.abs(dy) > Math.abs(dx) || horizontalOverlap) {
          // Vertical curve
          controlX1 = startX
          controlY1 = startY + (endY - startY) * 0.5
          controlX2 = endX
          controlY2 = endY - (endY - startY) * 0.5
        } else {
          // Horizontal curve
          controlX1 = startX + (endX - startX) * 0.5
          controlY1 = startY
          controlX2 = endX - (endX - startX) * 0.5
          controlY2 = endY
        }

        connections.push(
          <g key={`${node.id}-${parentIds[0]}`}>
            <path
              d={`M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`}
              stroke="#20b8cd"
              strokeWidth="2"
              fill="none"
              opacity="0.6"
              markerEnd="url(#arrowhead)"
            />
          </g>,
        )
      } else {
        // Calculate the meeting point at the top edge of the merged node
        const meetingX = nodeCenterX
        const meetingY = node.position.y + 50 // Top edge with padding

        parentIds.forEach((parentId) => {
          const parent = nodes.find((n) => n.id === parentId)
          if (!parent) return

          const parentWidth = parent.size?.width || 400
          const parentHeight = parent.size?.height || 500
          const startX = parent.position.x + parentWidth / 2
          const startY = parent.position.y + parentHeight

          // Create smooth bezier curve from parent bottom directly to meeting point
          let endX = meetingX
          let endY = meetingY

          // Pull the end point back slightly so the arrowhead tip is visible
          const dx = endX - startX
          const dy = endY - startY
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          endX -= (dx / dist) * arrowHeadOffset
          endY -= (dy / dist) * arrowHeadOffset

          // Control points for smooth S-curve that converges at the meeting point
          const controlY1 = startY + dy * 0.5
          const controlY2 = meetingY - 40 // Pull control point up slightly for smooth convergence

          connections.push(
            <path
              key={`${node.id}-${parentId}`}
              d={`M ${startX} ${startY} C ${startX} ${controlY1}, ${endX} ${controlY2}, ${endX} ${endY}`}
              stroke="#20b8cd"
              strokeWidth="2"
              fill="none"
              opacity="0.6"
              markerEnd="url(#arrowhead)"
            />,
          )
        })
      }
    })

    return connections
  }

  const handleStartMerge = useCallback(
    (nodeId: string) => {
      if (!isMergeMode) {
        setIsMergeMode(true)
        setMergeSourceId(nodeId)
      } else if (mergeSourceId && mergeSourceId !== nodeId) {
        // Merge the two nodes
        const sourceNode = nodes.find((n) => n.id === mergeSourceId)
        const targetNode = nodes.find((n) => n.id === nodeId)

        if (sourceNode && targetNode) {
          const centerX = (sourceNode.position.x + targetNode.position.x) / 2
          const maxY = Math.max(
            sourceNode.position.y + (sourceNode.size?.height || 500),
            targetNode.position.y + (targetNode.size?.height || 500),
          )
          const mergedNode: ChatNodeType = {
            id: Date.now().toString(),
            position: {
              x: centerX,
              y: maxY + 220, // Extra spacing so arrowheads stay visible
            },
            userMessage: `${sourceNode.userMessage}\n\n${targetNode.userMessage}`,
            aiResponse: `Merged content:\n\n${sourceNode.aiResponse}\n\n${targetNode.aiResponse}`,
            parentId: null,
            parentIds: [sourceNode.id, targetNode.id], // Track both parents
            connectionDirection: null,
            expanded: true,
            isActive: false, // Don't auto-activate merged nodes
            isLoading: false,
            model: sourceNode.model || "sonar",
            usageType: sourceNode.usageType || "focus",
            size: { width: 400, height: 500 },
            title: `${sourceNode.title || "Node " + sourceNode.id} + ${targetNode.title || "Node " + targetNode.id}`,
          }

          setNodes([...nodes, mergedNode])
        }

        setIsMergeMode(false)
        setMergeSourceId(null)
      } else {
        // Cancel merge
        setIsMergeMode(false)
        setMergeSourceId(null)
      }
    },
    [isMergeMode, mergeSourceId, nodes],
  )

  const handleZoomToFit = useCallback(() => {
    if (nodes.length === 0) return

    // Calculate bounding box of all nodes
    let minX = Number.POSITIVE_INFINITY
    let minY = Number.POSITIVE_INFINITY
    let maxX = Number.NEGATIVE_INFINITY
    let maxY = Number.NEGATIVE_INFINITY

    nodes.forEach((node) => {
      const nodeWidth = node.size?.width || 400
      const nodeHeight = node.size?.height || 500

      minX = Math.min(minX, node.position.x)
      minY = Math.min(minY, node.position.y)
      maxX = Math.max(maxX, node.position.x + nodeWidth)
      maxY = Math.max(maxY, node.position.y + nodeHeight)
    })

    // Add padding around the content
    const padding = 100
    const contentWidth = maxX - minX + padding * 2
    const contentHeight = maxY - minY + padding * 2

    // Get viewport dimensions
    const viewportWidth = canvasRef.current?.clientWidth || window.innerWidth
    const viewportHeight = (canvasRef.current?.clientHeight || window.innerHeight) - 60 // Account for navbar

    // Calculate zoom to fit
    const zoomX = viewportWidth / contentWidth
    const zoomY = viewportHeight / contentHeight
    const newZoom = Math.min(Math.max(zoomX, zoomY) * 0.9, 1) // 0.9 for some breathing room, max 1x

    // Calculate pan to center the content
    const contentCenterX = (minX + maxX) / 2
    const contentCenterY = (minY + maxY) / 2
    const viewportCenterX = viewportWidth / 2
    const viewportCenterY = viewportHeight / 2

    const newPan = {
      x: viewportCenterX - contentCenterX * newZoom,
      y: viewportCenterY - contentCenterY * newZoom,
    }

    setZoom(newZoom)
    setPan(newPan)
  }, [nodes])

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#202222] flex flex-col">
      <CanvasNavbar searchQuery={searchQuery} onSearchChange={setSearchQuery} onZoomToFit={handleZoomToFit} />
      <div
        ref={canvasRef}
        className="flex-1 relative cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onDoubleClick={handleCanvasDoubleClick}
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
          className="absolute inset-0 pointer-events-none w-full h-full z-20"
          style={{
            width: "100%",
            height: "100%",
          }}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <polygon points="0 0, 10 3, 0 6" fill="#20b8cd" />
            </marker>
          </defs>
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
          className="absolute inset-0 z-10"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
          }}
        >
          <AnimatePresence>
            {nodes.map((node) => {
              const matchesSearch =
                !searchQuery ||
                (node.title?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
                node.userMessage.toLowerCase().includes(searchQuery.toLowerCase())

              return (
                <ChatNode
                  key={node.id}
                  node={node}
                  isSelected={selectedNodes.includes(node.id)}
                  onFork={handleForkNode}
                  onDelete={handleDeleteNode}
                  onUpdate={handleUpdateNode}
                  onToggleSelect={handleToggleSelect}
                  onCreateDirectional={handleCreateDirectional}
                  onStartMerge={handleStartMerge}
                  isMergeMode={isMergeMode}
                  mergeSourceId={mergeSourceId}
                  pan={pan}
                  zoom={zoom}
                  isSearchMatch={matchesSearch}
                  isSearching={!!searchQuery}
                />
              )
            })}
          </AnimatePresence>
        </div>

        {/* Instructions overlay */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#20b8cd]" />
            <span>
              {isMergeMode
                ? "Click another node to merge"
                : "Double-click to create • Drag to pan • Scroll to zoom • Click title to rename"}
            </span>
          </div>
        </div>

        {isMergeMode && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
            <Button
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium shadow-lg"
              onClick={() => {
                setIsMergeMode(false)
                setMergeSourceId(null)
              }}
            >
              Cancel Merge
            </Button>
          </div>
        )}

        {selectedNodes.length >= 2 && !isMergeMode && (
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
