"use client"

import type { ChatNodeType } from "@/lib/types"

interface MinimapProps {
  nodes: ChatNodeType[]
  pan: { x: number; y: number }
  zoom: number
}

export function Minimap({ nodes, pan, zoom }: MinimapProps) {
  const scale = 0.1 // Minimap scale factor

  return (
    <div className="absolute bottom-6 right-6 w-48 h-36 bg-[#1a1b1b] border border-white/20 rounded-lg overflow-hidden">
      {/* Minimap background */}
      <div className="w-full h-full relative">
        {/* Viewport indicator */}
        <div
          className="absolute border-2 border-[#20b8cd] pointer-events-none"
          style={{
            left: `${-pan.x * scale}px`,
            top: `${-pan.y * scale}px`,
            width: `${(window.innerWidth / zoom) * scale}px`,
            height: `${(window.innerHeight / zoom) * scale}px`,
            opacity: 0.5,
          }}
        />

        {/* Nodes on minimap */}
        {nodes.map((node) => (
          <div
            key={node.id}
            className="absolute bg-[#20b8cd] rounded-sm"
            style={{
              left: `${node.position.x * scale}px`,
              top: `${node.position.y * scale}px`,
              width: `${40 * scale}px`,
              height: `${40 * scale}px`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
