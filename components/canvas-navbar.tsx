"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, User, X, Maximize2 } from "lucide-react"
import { useState, useRef, useEffect } from "react"

interface CanvasNavbarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  onZoomToFit?: () => void
}

export function CanvasNavbar({ searchQuery, onSearchChange, onZoomToFit }: CanvasNavbarProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [showCreditsPopup, setShowCreditsPopup] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowCreditsPopup(false)
      }
    }

    if (showCreditsPopup) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showCreditsPopup])

  return (
    <nav className="h-[72px] bg-[#1a1b1b] border-b border-white/10 flex items-center justify-between px-6 relative z-50">
      {/* Logo */}
      <div className="flex items-center gap-8">
        <div className="flex flex-col gap-0.5">
          <span className="text-[#20b8cd] font-bold text-3xl tracking-tight" style={{ fontFamily: "Georgia, serif" }}>
            Pathways
          </span>
          <span className="text-white text-[10px] font-light leading-tight">
            Infinite canvas chat - powered by Perplexity
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
        <div className="relative">
          <Button
            ref={buttonRef}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
            onClick={() => setShowCreditsPopup(!showCreditsPopup)}
          >
            <User className="h-5 w-5" />
          </Button>
          {showCreditsPopup && (
            <div
              ref={popupRef}
              className="absolute top-full right-0 mt-2 bg-[#1a1b1b] border border-white/20 rounded-lg px-3 py-2 shadow-lg z-50 min-w-[200px]"
            >
              <p className="text-white text-xs leading-relaxed">
                Built by{" "}
                <span className="font-semibold">Nidhi</span> at{" "}
                <span className="font-semibold">UC Berkeley</span>!
              </p>
              <a
                href="https://nidhig.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#20b8cd] hover:text-[#1a9db0] text-xs font-medium mt-1 inline-block transition-colors"
                onClick={() => setShowCreditsPopup(false)}
              >
                → nidhig.dev
              </a>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
