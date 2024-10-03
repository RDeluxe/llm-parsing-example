import * as dotenv from 'dotenv'
import { JSDOM } from 'jsdom'
import OpenAI from 'openai'
import ora from 'ora'
import { requestJSON } from './openRouter.js'
import { downloadHTML, htmlToMarkdown, removeAllStyle, removeTags, UNWANTED_TAGS } from './parseHTML.util.js'

// Loading .env file
dotenv.config()

// Setting some available models on OpenRouter
export type Model = 'openai/gpt-4'
  | 'mistralai/mixtral-8x7b'
  | 'google/gemini-pro'
  | 'meta-llama/llama-2-70b-chat'
  | 'mistralai/mistral-7b-instruct:free'
  | 'mistralai/mistral-tiny'
  | 'mistralai/mistral-small'
  | 'mistralai/mixtral-8x7b-instruct'
  | 'meta-llama/llama-3.1-8b-instruct:free'

const format = `{  
         title: string | null // extract the title fromt the source, in French, null if you can't find any
         description: string | null // extract the full event description from the source, in French. Paraphrase as much as possible, keep tone and style. null if you can't find any
         date: Date | null // Start date of the event in ISO format. null if you can't find any
         place: string | null // the place name. null if you can't find any
         address: string | null // the address as precise as possible including if possible street, city, code and country but without the place name. null if you can't find any information
       } \n`

const openRouterInstance = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
})

// Let's define some const
const model: Model = 'meta-llama/llama-3.1-8b-instruct:free'
const eventUrl = 'https://www.facebook.com/events/385966024501401'

// Step 1: downloading the page as HTML using Playwright
const spinner = ora('Downloading HTML').start()
const html = await downloadHTML(eventUrl)
const dom = new JSDOM(html)
spinner.stopAndPersist({ symbol: '✅', text: 'HTML downloaded' })

// Step 2: removing unwanted tags and style
spinner.start('Removing unwanted tags and style')
removeTags(dom, UNWANTED_TAGS)
removeAllStyle(dom)
spinner.stopAndPersist({ symbol: '✅', text: 'HTML cleaned' })

// Step 3: transforming the HTML into Markdown (easier to digest)
spinner.start('Transforming HTML into Markdown')
const markdown = htmlToMarkdown(dom)
spinner.stopAndPersist({ symbol: '✅', text: 'HTML converted to markdown' })

// Step 4: asking our LLM to extract the information
// First we isolate the data concerning the event (this can be a costly call in term of token)
const isolationPrompt = `Isolate all the relevant information about the cultural event in the following content. \n
   Relevant information include the event description, date, place, organizer information, performers, and details about the performers (biography, style) \n
   Answer in French, paraphrase as much as possible, keep tone and style. \n`

spinner.start('Using LLM to isolate relevant data on page')
const isolatedContent = await openRouterInstance.chat.completions.create({
  model,
  messages: [
    { role: 'user', content: isolationPrompt + markdown },
  ],
})
spinner.stopAndPersist({ symbol: '✅', text: 'Data isolated' })

spinner.start('Using LLM to extract JSON data')
// Then we ask for a structured response.
const extractionPrompt = `Considering the given event, return a structured response like such \n ${format}`

// Asking for a JSON response is a bit more convoluted with OpenRouter
const resp = await requestJSON(model, extractionPrompt + isolatedContent.choices[0].message.content, 0)

spinner.succeed('Done !')

// eslint-disable-next-line no-console
console.log(resp)
