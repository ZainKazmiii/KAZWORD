# Kazword

Kazword is a web puzzle game that combines Wordle-style letter feedback with crossword-style clues and grids. It was built as a personal project to explore puzzle state, input handling, responsive layouts, and repeated user-flow testing.

## Highlights

- Crossword-style puzzle grids with clue-driven word entry
- Word-guessing feedback and keyboard interaction
- Responsive game interface built as a Next.js application
- Server routes for short-lived reward tokens backed by Upstash Redis
- A standalone shape-making utility in `tools/shape-maker.html` used to design and test puzzle layouts

## Stack

- Next.js 16 and React 19
- JavaScript and CSS
- Upstash Redis
- Vercel Analytics
- Lucide icons

## Local Setup

```bash
npm ci
copy .env.example .env.local
npm run dev
```

Open `http://localhost:3000` after the development server starts.

The reward-token routes need an Upstash Redis database. The puzzle interface can still be reviewed without configuring the reward flow.

## Environment Variables

```text
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

No production credentials are included in this repository.
