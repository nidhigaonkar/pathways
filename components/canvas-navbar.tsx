"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, User, X, Maximize2 } from "lucide-react"
import { useState } from "react"

interface CanvasNavbarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  onZoomToFit?: () => void
}

export function CanvasNavbar({ searchQuery, onSearchChange, onZoomToFit }: CanvasNavbarProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  return (
    <nav className="h-[60px] bg-[#1a1b1b] border-b border-white/10 flex items-center justify-between px-6 relative z-50">
      {/* Logo */}
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <span className="text-[#20b8cd] font-bold text-2xl tracking-tight" style={{ fontFamily: "Georgia, serif" }}>
            Pathways
          </span>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {isSearchOpen ? (
          <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 min-w-[300px]">
            <Search className="h-4 w-4 text-[#20b8cd]" />
            <Input
              type="text"
              placeholder="Search nodes..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="bg-transparent border-none text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:ring-offset-0 h-6 px-0"
              autoFocus
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white/60 hover:text-white hover:bg-white/10"
              onClick={() => {
                setIsSearchOpen(false)
                onSearchChange("")
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
            onClick={() => setIsSearchOpen(true)}
          >
            <Search className="h-5 w-5" />
          </Button>
        )}
        {onZoomToFit && (
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
            onClick={onZoomToFit}
            title="Zoom to fit all nodes"
          >
            <Maximize2 className="h-5 w-5" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
          <User className="h-5 w-5" />
        </Button>
      </div>
    </nav>
  )
}
