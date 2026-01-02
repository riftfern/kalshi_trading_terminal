# Godel Terminal Project Guidelines (Vanilla TS Refactor)

## Tech Stack
- Frontend: Vanilla TypeScript, HTML5, CSS3 (Tailwind for utility classes)
- Backend: Express/Node.js (from existing /server directory)
- API: Kalshi REST + WebSockets

## Architecture Principles
- NO Frameworks: Do not use React, Vue, or heavy UI libraries.
- State Management: Use a native `EventTarget` or simple Pub/Sub for global state.
- Component Logic: Every widget should be a class or function that manages its own DOM fragment.
- DOM Manipulation: Use standard `document.createElement` and `Element.querySelector`.

## Trading Logic Specifics
- Reciprocal Order Book: Only YES Bids are provided. 
  - YES Ask = 100 - Best NO Bid
  - NO Ask = 100 - Best YES Bid
- Command Palette: Use a Cmd+K listener to trigger a modal.

## Git Workflow
- All new features MUST be developed on a dedicated branch.
- Follow conventional commit messages.