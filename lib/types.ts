export interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export interface ChatNodeType {
  id: string
  position: { x: number; y: number }
  size?: { width: number; height: number }
  messages: ChatMessage[] // Conversation history
  userMessage: string // Deprecated, kept for backward compatibility
  aiResponse: string // Deprecated, kept for backward compatibility
  parentId: string | null
  parentIds?: string[] // For merged nodes with multiple parents
  connectionDirection?: "top" | "right" | "bottom" | "left" | null
  expanded: boolean
  isActive: boolean
  isLoading: boolean
  model?: string
  usageType?: string
  title?: string
}
