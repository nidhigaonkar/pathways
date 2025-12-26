export interface ChatNodeType {
  id: string
  position: { x: number; y: number }
  size?: { width: number; height: number }
  userMessage: string
  aiResponse: string
  parentId: string | null
  connectionDirection?: "top" | "right" | "bottom" | "left" | null
  expanded: boolean
  isActive: boolean
  isLoading: boolean
  model?: string
  usageType?: string
  title?: string
}
