import type { Model } from './index.js'
import type { NonStreamingChoice, OpenRouterResponse } from './openRouter.type.js'

export async function requestJSON(model: Model, prompt: string, temperature: number = 0.5): Promise<any> {
  // We need to use fetch instead of the openAI SDK because the SDK does not support the JSON response format + openRouter
  const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature,
      messages: [
        { role: 'user', content: prompt },
      ],
      provider: {
        require_parameters: true,
      },
      response_format: {
        type: 'json_object',
      },
    }),
  })

  const json = await resp.json() as OpenRouterResponse

  if (json.error != null)
    throw new Error(`OpenRouter error : ${json.error.code} \n ${json.error.message}`)

  if (json.choices.length === 0)
    throw new Error('No response from AI')

  const castedChoice = json.choices[0] as NonStreamingChoice

  if (castedChoice.error != null)
    throw castedChoice.error

  if (castedChoice.message.content == null)
    throw new Error(`Empty response from model`)

  return JSON.parse(castedChoice.message.content)
}
