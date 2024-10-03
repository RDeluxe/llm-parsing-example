WARNING: For Facebook event pages, this script will only work if Facebook localize you in France (French text).
For other languages, set the correct text in the `downloadHTML` function.

1. Install deps with `pnpm install`
2. Create a `.env` file with your OpenRouter API key
3. Setup playwright with `pnpm exec playwright install chromium`
4. Change the url in index.ts
5. Run the script with `pnpm dev`

You should see a nice JSON response in the console.
