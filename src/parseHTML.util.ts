import type { JSDOM } from 'jsdom'

// Allows us to launch a browser to download the HTML
import { chromium } from 'playwright'

// Allows us to turn HTML into Markdown
import TurndownService from 'turndown'

// List of tags we don't want to keep in the final HTML
export const UNWANTED_TAGS = ['script', 'head', 'style', 'header', 'footer', 'iframe', 'img']

export async function downloadHTML(url: string): Promise<string> {
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto(url, { waitUntil: 'networkidle' })

  // Special case handling !
  // If we are on a Facebook Event Page, let's click the "see more link"
  // Warning: this will only work if the browser is in French!
  if (url.includes('facebook.com/events')) {
    try {
      // We wait for the page to be fully rendered
      await new Promise(r => setTimeout(r, 1000))

      // We close the cookie banner
      const cookieButtons = await page.getByRole('button', { name: 'Autoriser tous les cookies' }).all()
      if (cookieButtons.length > 0)
        await cookieButtons[0].click({ force: true })

      // We close the login dialog
      const loginButtons = await page.getByRole('button', { name: 'Fermer' }).all()
      if (loginButtons.length > 0)
        await loginButtons[0].click({ force: true })

      // We click to see more text (this handles only French and English)
      const seeMoreButtons = await page.getByText('En voir plus').all()
      if (seeMoreButtons.length > 0)
        await seeMoreButtons[0].click({ force: true })
      else console.warn('Could not find the "Voir plus" button')
    }
    catch (error) {
      console.error(`Error while trying to show more content on Facebook Event Page ${url}: `, error)
    }
  }

  const htmlContent = await page.content()
  await context.close()
  await browser.close()
  return htmlContent
}

/**
 * Mutates the provided DOM to remove all selected tags
 * @param dom
 */
export function removeTags(dom: JSDOM, unwantedTags: string[]) {
  const document = dom.window.document
  unwantedTags.forEach((tag) => {
    const elements = document.getElementsByTagName(tag)
    for (let i = elements.length - 1; i >= 0; i--) {
      const element = elements[i]
      element.parentNode!.removeChild(element)
    }
  })
}

/**
 * Mutates the provided DOM to remove all style attributes
 * @param dom
 */
export function removeAllStyle(dom: JSDOM) {
  const document = dom.window.document
  const elements = document.getElementsByTagName('*')
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i]
    element.removeAttribute('style')
  }
}

export function htmlToMarkdown(dom: JSDOM): string {
  const turndownService = new TurndownService()
  const markdown = turndownService.turndown(dom.serialize())
  return markdown
}
