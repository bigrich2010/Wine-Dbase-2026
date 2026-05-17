export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.VITE_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('No API key configured')
    return res.status(500).json({ error: 'API key not configured' })
  }

  if (!req.body || !req.body.messages) {
    return res.status(400).json({ error: 'Missing messages in request body' })
  }

  try {
    const body = {
      max_tokens: 1000,
      ...req.body,
      model: 'claude-sonnet-4-6',
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Anthropic API error:', response.status, JSON.stringify(data).slice(0, 200))
    }

    return res.status(response.status).json(data)
  } catch (error) {
    console.error('Proxy error:', error.message)
    return res.status(500).json({ error: 'Proxy error', details: error.message })
  }
}
