# Godel Terminal Project Guidelines (Vanilla TS Refactor)

## Core Mission
To build a high-performance, lightweight, and framework-free financial terminal using Vanilla TypeScript. The final product should be a professional-grade portfolio piece with zero React dependencies.

## Tech Stack
- Frontend: Vanilla TypeScript, HTML5, TailwindCSS
- Build Tool: Vite
- Backend: Express/Node.js
- API: Kalshi REST + WebSockets
- Testing: Vitest for unit and logic testing.

## Architecture Principles

1.  **NO Frameworks:** Do not use React, Vue, or other heavy UI libraries. The final build must not include them.
2.  **Component Model:** All UI widgets MUST extend the `BaseWidget.ts` class. This provides a consistent API for lifecycle (`onMount`, `cleanup`), rendering (`render`), and state (`setLoading`, `setError`).
3.  **DOM Manipulation:** Use standard browser APIs (`document.createElement`, `element.append`, `element.classList`, etc.). Rendering logic should be efficient, updating only what's necessary rather than re-creating large DOM trees.
4.  **State Management:**
    *   Global state is managed by the `EventTarget`-based `workspaceStore` in `/services`. Components should NOT modify state directly.
    *   Use the exported action functions (`addWidget`, `updateLayout`, etc.) to dispatch state changes.
    *   The legacy `/store` directory (Zustand) is deprecated and MUST be removed once all components are migrated.
5.  **UI Reactivity (CRITICAL):**
    *   The `GridLayout.ts` component is the central hub for UI updates. It MUST subscribe to `workspaceStore`.
    *   On a `'change'` event, `GridLayout` will compare the new state with its current view and perform the following:
        1.  **Mount New Widgets:** Use `WidgetFactory.ts` to instantiate and mount any new widgets present in the state.
        2.  **Unmount Old Widgets:** Call `.unmount()` on widget instances that have been removed from the state to ensure their resources (e.g., fetch intervals) are cleaned up.
        3.  **Update Layouts:** Apply `x, y, w, h` styles to widget containers when the layout state changes.
6.  **Widget Creation:** Use `WidgetFactory.ts` to dynamically create widget instances from the `type` string in the state (e.g., `'order-book'`). This avoids a large `switch` statement in the grid.

## Build & Dependency Cleanup Plan

1.  **Dual Entry Points:** `vite.config.ts` must be configured to support two builds: the legacy `index.html` (for transition) and the primary `vanilla.html`.
2.  **Component Migration:** As a `.tsx` component is refactored into its vanilla `.ts` counterpart, the original `.tsx` file and its folder MUST be deleted.
3.  **Final Cleanup:** Once all components are migrated and the `GridLayout` is fully reactive, the final step is to purge framework dependencies. Run the following command and commit the result:
    ```bash
    npm uninstall react react-dom @types/react @types/react-dom @vitejs/plugin-react react-grid-layout zustand lucide-react clsx tailwind-merge
    ```

## Kalshi Data Display Rules
- **Data Normalization:** Never display raw tickers in the UI. Create a utility that extracts the 'Strike' or 'Outcome' part of the market ticker.
- **Context Enrichment:** When fetching a market, always fetch its parent Event object. Use `event.title` as the primary heading and `market.subtitle` as the sub-heading.
- **Ticker Formatting:** Format tickers in a secondary, monospace 'Bloomberg-style' tag (e.g., `[FED-24DEC]`).
- **Reciprocal Awareness:** For display purposes, a 'Bid 40 NO' is the same as an 'Ask 60 YES'. Implement a display toggle that lets the user choose their 'Perspective' (YES-centric or NO-centric).

## Git & Testing
- Develop all new features on a dedicated branch.
- Follow conventional commit messages.
- Use Vitest for TDD. Aim for 100% test coverage on all financial and data transformation logic (e.g., order book calculations, ticker formatting). Do not commit code that breaks tests.