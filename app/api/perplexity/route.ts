import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { messages, model } = await request.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 })
    }

    const apiKey = process.env.PERPLEXITY_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    // Map our model names to Perplexity API model names
    const modelMap: Record<string, string> = {
      'sonar': 'sonar',
      'sonar-pro': 'sonar-pro',
      'sonar-reasoning-pro': 'sonar-reasoning-pro',
      'sonar-deep-research': 'sonar-deep-research',
    }

    const perplexityModel = modelMap[model] || 'sonar'

    // Convert messages to Perplexity API format
    const apiMessages = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role,
      content: msg.content,
    }))

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: perplexityModel,
        messages: apiMessages,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Perplexity API error:', errorData)
      return NextResponse.json(
        { error: `API request failed: ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    const aiResponse = data.choices?.[0]?.message?.content || 'No response generated'

    return NextResponse.json({ response: aiResponse })
  } catch (error) {
    console.error('Error calling Perplexity API:', error)
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    )
  }
}

