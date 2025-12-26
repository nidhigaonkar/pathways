"use client"

import { Button } from "@/components/ui/button"
import { Search, User } from "lucide-react"

export function CanvasNavbar() {
  return (
    <nav className="h-[60px] bg-[#1a1b1b] border-b border-white/10 flex items-center justify-between px-6">
      {/* Logo */}
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#20b8cd] rounded-lg flex items-center justify-center">
            <span className="text-black font-bold text-lg">A</span>
          </div>
          <span className="text-white font-semibold text-lg">AI Canvas</span>
        </div>

        {/* Mode selector */}

        {/* Model selector */}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
          <Search className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
          <User className="h-5 w-5" />
        </Button>
      </div>
    </nav>
  )
}
