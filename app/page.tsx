"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import { AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ChatNode } from "@/components/chat-node"
import { CanvasNavbar } from "@/components/canvas-navbar"
import { Minimap } from "@/components/minimap"
import { Sparkles, GitMerge } from "lucide-react"
import type { ChatNodeType } from "@/lib/types"

export default function InfiniteCanvasPage() {
  const [nodes, setNodes] = useState<ChatNodeType[]>([
    {
      id: "1",
      position: { x: 600, y: 300 },
      messages: [
        {
          role: "user",
          content: "What is the future of AI?",
        },
        {
          role: "assistant",
          content:
            "The future of AI is incredibly exciting and transformative. We're moving towards more sophisticated systems that can understand context, reason across domains, and collaborate with humans in meaningful ways. Key trends include multimodal AI, improved reasoning capabilities, and more efficient models.",
        },
      ],
      userMessage: "EX: What is the future of AI?", // Backward compatibility
      aiResponse:
        "The future of AI is incredibly exciting and transformative. We're moving towards more sophisticated systems that can understand context, reason across domains, and collaborate with humans in meaningful ways. Key trends include multimodal AI, improved reasoning capabilities, and more efficient models.",
      parentId: null,
      parentIds: undefined, // Updated to handle multiple parents
      connectionDirection: null,
      expanded: true,
      isActive: false,
      isLoading: false,
      model: "sonar",
      usageType: "focus",
      size: { width: 400, height: 500 },
      title: "EX: AI Future Discussion",
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
  const [batchQuery, setBatchQuery] = useState("") // Query for running multiple nodes
  const [showBatchInput, setShowBatchInput] = useState(false) // Show batch input UI

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
        messages: [],
        userMessage: "",
        aiResponse: "",
        parentId: null,
        parentIds: undefined,
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
        messages: [],
        userMessage: "",
        aiResponse: "",
        parentId,
        parentIds: undefined, // Updated to handle multiple parents
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
        messages: [],
        userMessage: "",
        aiResponse: "",
        parentId,
        parentIds: undefined, // Updated to handle multiple parents
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

  // Handler to run a node's query
  const handleRunNode = useCallback(
    async (nodeId: string, userMessage: string) => {
      const node = nodes.find((n) => n.id === nodeId)
      if (!node) return

      // Get current messages or initialize empty array
      const currentMessages = node.messages || []

      // Add user message to conversation
      const updatedMessages = [...currentMessages, { role: "user" as const, content: userMessage }]

      setNodes((prevNodes) =>
        prevNodes.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                messages: updatedMessages,
                isLoading: true,
              }
            : n,
        ),
      )

      try {
        const selectedModel = node.model || "sonar"
        console.log("Sending request with model:", selectedModel, "for node:", node.id)

        const response = await fetch("/api/perplexity", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
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
        const aiResponse = data.response || "No response generated"

        // Add AI response to conversation
        const finalMessages = [...updatedMessages, { role: "assistant" as const, content: aiResponse }]

        setNodes((prevNodes) =>
          prevNodes.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  messages: finalMessages,
                  isLoading: false,
                }
              : n,
          ),
        )
      } catch (error) {
        console.error("Error calling Perplexity API:", error)
        // Add error message to conversation
        const errorMessages = [
          ...updatedMessages,
          {
            role: "assistant" as const,
            content: "Sorry, there was an error generating a response. Please try again.",
          },
        ]

        setNodes((prevNodes) =>
          prevNodes.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  messages: errorMessages,
                  isLoading: false,
                }
              : n,
          ),
        )
      }
    },
    [nodes],
  )

  // Handler to run multiple selected nodes in parallel
  const handleRunSelectedNodes = useCallback(
    async (query: string) => {
      if (!query.trim() || selectedNodes.length === 0) return

      // Run all selected nodes in parallel
      const runPromises = selectedNodes.map((nodeId) => handleRunNode(nodeId, query.trim()))

      await Promise.all(runPromises)
      console.log(`Executed ${selectedNodes.length} nodes in parallel`)
    },
    [selectedNodes, handleRunNode],
  )

  const renderConnections = () => {
    const connections: React.JSX.Element[] = []

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

        // Arrowhead size - the marker has refX="9" with markerUnits="strokeWidth" and strokeWidth="2"
        // So the tip is 9 * 2 = 18 pixels from the path end
        const borderOffset = 0 // Arrow should touch the border exactly
        const arrowheadTipSize = 18 // Size of arrowhead tip from marker (refX="9" * strokeWidth="2")

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
            endY = nodeTop + borderOffset
          } else {
            // Child is above parent - connect parent top to child bottom
            startX = parentCenterX
            startY = parentTop
            endX = nodeCenterX
            endY = nodeBottom - borderOffset
          }
        } else {
          // Primarily horizontal connection
          if (dx > 0) {
            // Child is to the right of parent - connect parent right to child left
            startX = parentRight
            startY = parentCenterY
            endX = nodeLeft + borderOffset
            endY = nodeCenterY
          } else {
            // Child is to the left of parent - connect parent left to child right
            startX = parentLeft
            startY = parentCenterY
            endX = nodeRight - borderOffset
            endY = nodeCenterY
          }
        }

        // Adjust endpoint so arrowhead tip touches the border (not the base)
        // The arrowhead marker has refX="9", so we need to pull back by arrowhead tip size
        const endDx = endX - startX
        const endDy = endY - startY
        const endDist = Math.sqrt(endDx * endDx + endDy * endDy) || 1
        // Pull back by arrowhead tip size so the tip touches the border
        endX -= (endDx / endDist) * arrowheadTipSize
        endY -= (endDy / endDist) * arrowheadTipSize

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
        const meetingY = node.position.y // Top edge - no padding, arrow will touch border
        const arrowheadTipSize = 18 // Size of arrowhead tip from marker (refX="9" * strokeWidth="2")
        const convergenceOffset = 60 // How far above the node the lines should converge

        const convergenceX = meetingX
        const convergenceY = meetingY - convergenceOffset

        parentIds.forEach((parentId) => {
          const parent = nodes.find((n) => n.id === parentId)
          if (!parent) return

          const parentWidth = parent.size?.width || 400
          const parentHeight = parent.size?.height || 500
          const startX = parent.position.x + parentWidth / 2
          const startY = parent.position.y + parentHeight

          // Create smooth curve from parent bottom to convergence point
          // We use control points to ensure it starts vertically from parent and ends vertically at convergence point
          const controlY1 = startY + (convergenceY - startY) * 0.5
          const controlY2 = convergenceY - 20

          connections.push(
            <path
              key={`${node.id}-${parentId}-blend`}
              d={`M ${startX} ${startY} C ${startX} ${controlY1}, ${convergenceX} ${controlY2}, ${convergenceX} ${convergenceY}`}
              stroke="#20b8cd"
              strokeWidth="2"
              fill="none"
              opacity="0.6"
            />,
          )
        })

        // Draw the final single stem from convergence point to the node
        const endY = meetingY - arrowheadTipSize
        connections.push(
          <path
            key={`${node.id}-final-stem`}
            d={`M ${convergenceX} ${convergenceY} L ${convergenceX} ${endY}`}
            stroke="#20b8cd"
            strokeWidth="2"
            fill="none"
            opacity="0.6"
            markerEnd="url(#arrowhead)"
          />,
        )
      }
    })

    return connections
  }

  const handleStartMerge = useCallback(
    async (nodeId: string) => {
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

          // Create a temporary merged node that shows loading state
          const tempNodeId = Date.now().toString()
          const tempMergedNode: ChatNodeType = {
            id: tempNodeId,
            position: {
              x: centerX,
              y: maxY + 220, // Extra spacing so arrowheads stay visible
            },
            messages: [],
            userMessage: "",
            aiResponse: "",
            parentId: null,
            parentIds: [sourceNode.id, targetNode.id], // Track both parents
            connectionDirection: null,
            expanded: true,
            isActive: false,
            isLoading: true, // Show loading state
            model: sourceNode.model || "sonar",
            usageType: sourceNode.usageType || "focus",
            size: { width: 400, height: 500 },
            title: `${sourceNode.title || "Node " + sourceNode.id} + ${targetNode.title || "Node " + targetNode.id}`,
          }

          setNodes([...nodes, tempMergedNode])
          setIsMergeMode(false)
          setMergeSourceId(null)

          // Generate summary of both chat histories
          try {
            // Format the chat histories for summarization
            const sourceHistory =
              sourceNode.messages.length > 0
                ? sourceNode.messages.map((m) => `${m.role}: ${m.content}`).join("\n")
                : `User: ${sourceNode.userMessage}\nAssistant: ${sourceNode.aiResponse}`

            const targetHistory =
              targetNode.messages.length > 0
                ? targetNode.messages.map((m) => `${m.role}: ${m.content}`).join("\n")
                : `User: ${targetNode.userMessage}\nAssistant: ${targetNode.aiResponse}`

            // Create a prompt to summarize both conversations
            const summaryPrompt = `I have two separate conversation threads that I want to merge. Please provide a comprehensive summary of both conversations, highlighting key topics, insights, and any connections between them.

**Conversation 1 (from ${sourceNode.title || "Node " + sourceNode.id}):**
${sourceHistory}

**Conversation 2 (from ${targetNode.title || "Node " + targetNode.id}):**
${targetHistory}

IMPORTANT: Your summary must be exactly 75 words or less. Provide a clear, concise summary that captures the essence of both conversations and can serve as context for continuing this merged discussion.`

            // Call the API to generate summary
            const response = await fetch("/api/perplexity", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                messages: [
                  {
                    role: "user",
                    content: summaryPrompt,
                  },
                ],
                model: sourceNode.model || "sonar",
              }),
            })

            if (!response.ok) {
              throw new Error("Failed to generate summary")
            }

            const data = await response.json()
            const summary = data.response

            // Create the final merged node with summary as context
            const mergedMessages = [
              {
                role: "assistant" as const,
                content: `**Summary of Merged Conversations:**\n\n${summary}`,
              },
            ]

            // Update the node with the summary
            setNodes((prevNodes) =>
              prevNodes.map((n) =>
                n.id === tempNodeId
                  ? {
                      ...n,
                      messages: mergedMessages,
                      userMessage: "", // Clear temporary values
                      aiResponse: summary,
                      isLoading: false,
                    }
                  : n,
              ),
            )
          } catch (error) {
            console.error("Error generating merge summary:", error)
            // Update node with error state
            setNodes((prevNodes) =>
              prevNodes.map((n) =>
                n.id === tempNodeId
                  ? {
                      ...n,
                      messages: [
                        {
                          role: "assistant" as const,
                          content: "Failed to generate summary. Please try again.",
                        },
                      ],
                      aiResponse: "Failed to generate summary.",
                      isLoading: false,
                    }
                  : n,
              ),
            )
          }
        }
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
                  onRunNode={handleRunNode}
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

        {selectedNodes.length >= 1 && !isMergeMode && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
            {showBatchInput ? (
              <div className="bg-black/80 backdrop-blur-sm rounded-lg p-4 shadow-2xl border border-white/10 min-w-[400px]">
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-2">
                    <input
                      type="text"
                      value={batchQuery}
                      onChange={(e) => setBatchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          handleRunSelectedNodes(batchQuery)
                          setBatchQuery("")
                          setShowBatchInput(false)
                        }
                        if (e.key === "Escape") {
                          setShowBatchInput(false)
                          setBatchQuery("")
                        }
                      }}
                      placeholder="Enter query to run on all selected nodes..."
                      className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#20b8cd]"
                      autoFocus
                    />
                    <Button
                      className="bg-[#20b8cd] hover:bg-[#1a9db0] text-black font-medium"
                      onClick={() => {
                        handleRunSelectedNodes(batchQuery)
                        setBatchQuery("")
                        setShowBatchInput(false)
                      }}
                      disabled={!batchQuery.trim()}
                    >
                      Run
                    </Button>
                    <Button
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                      onClick={() => {
                        setShowBatchInput(false)
                        setBatchQuery("")
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                  <div className="text-xs text-white/60">
                    This query will be sent to {selectedNodes.length} node{selectedNodes.length > 1 ? "s" : ""} in
                    parallel
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  className="bg-[#20b8cd] hover:bg-[#1a9db0] text-black font-medium shadow-lg"
                  onClick={() => setShowBatchInput(true)}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Run {selectedNodes.length} Node{selectedNodes.length > 1 ? "s" : ""}
                </Button>
                {selectedNodes.length >= 2 && (
                  <Button
                    className="bg-purple-500 hover:bg-purple-600 text-white font-medium shadow-lg"
                    onClick={() => {
                      console.log("Merging nodes:", selectedNodes)
                    }}
                  >
                    <GitMerge className="h-4 w-4 mr-2" />
                    Merge {selectedNodes.length} Nodes
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      {/* Minimap */}
      <Minimap nodes={nodes} pan={pan} zoom={zoom} />
    </div>
  )
}
