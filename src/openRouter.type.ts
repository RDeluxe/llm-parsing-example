// Definitions of subtypes are below

export interface OpenRouterResponse {
  id: string
  // Depending on whether you set "stream" to "true" and
  // whether you passed in "messages" or a "prompt", you
  // will get a different output shape
  choices: (NonStreamingChoice | StreamingChoice | NonChatChoice)[]
  created: number // Unix timestamp
  model: string
  object: 'chat.completion' | 'chat.completion.chunk'

  system_fingerprint?: string // Only present if the provider supports it

  // Usage data is always returned for non-streaming.
  // When streaming, you will get one usage object at
  // the end accompanied by an empty choices array.
  usage?: ResponseUsage

  error?: {
    code: number
    message: string
  }
}

// If the provider returns usage, we pass it down
// as-is. Otherwise, we count using the GPT-4 tokenizer.

export interface ResponseUsage {
  /** Including images and tools if any */
  prompt_tokens: number
  /** The tokens generated */
  completion_tokens: number
  /** Sum of the above two fields */
  total_tokens: number
}

// Subtypes:
export interface NonChatChoice {
  finish_reason: string | null
  text: string
  error?: Error
}

export interface NonStreamingChoice {
  finish_reason: string | null // Depends on the model. Ex: 'stop' | 'length' | 'content_filter' | 'tool_calls' | 'function_call'
  message: {
    content: string | null
    role: string
    tool_calls?: ToolCall[]
    // Deprecated, replaced by tool_calls
    function_call?: FunctionCall
  }
  error?: Error
}

export interface StreamingChoice {
  finish_reason: string | null
  delta: {
    content: string | null
    role?: string
    tool_calls?: ToolCall[]
    // Deprecated, replaced by tool_calls
    function_call?: FunctionCall
  }
  error?: Error
}

interface Error {
  code: number // See "Error Handling" section
  message: string
}

interface FunctionCall {
  name: string
  arguments: string // JSON format arguments
}

interface ToolCall {
  id: string
  type: 'function'
  function: FunctionCall
}
