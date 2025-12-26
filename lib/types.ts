export interface ChatNodeType {
  id: string
  position: { x: number; y: number }
  userMessage: string
  aiResponse: string
  parentId: string | null
  expanded: boolean
  isActive: boolean
  isLoading: boolean
  model?: string
  usageType?: string
}
