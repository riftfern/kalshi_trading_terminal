# Godel Terminal Project Guidelines for Claude (Managed by Gemini)

## Core Mission
To build a high-performance, lightweight, and framework-free financial terminal using Vanilla TypeScript. The final product should be a professional-grade portfolio piece with zero React dependencies, optimized for token usage in production (meaning a small, efficient codebase).

## Tech Stack
- Frontend: Vanilla TypeScript, HTML5, TailwindCSS
- Build Tool: Vite
- Backend: Express/Node.js
- API: Kalshi REST + WebSockets
- Testing: Vitest for unit and logic testing.

## Architecture Principles

1.  **NO Frameworks:** Do not use React, Vue, or other heavy UI libraries. The final build must not include them. This is critical for achieving the "lightweight" and "zero React dependencies" goals.
2.  **Component Model:** All UI widgets MUST extend the `BaseWidget.ts` class. This provides a consistent API for lifecycle (`onMount`, `cleanup`), rendering (`render`), and state management (`setLoading`, `setError`). `BaseWidget.ts` itself should extend `BaseComponent.ts`.
3.  **DOM Manipulation:** Use standard browser APIs (`document.createElement`, `element.append`, `element.classList`, etc.). Rendering logic should be efficient, updating only what's necessary rather than re-creating large DOM trees.
4.  **State Management:**
    *   Global state is managed by the `EventTarget`-based `workspaceStore` in `client/src/services/workspaceStore.ts`. Components should NOT modify state directly.
    *   Use the exported action functions (`addWidget`, `updateLayout`, `moveWidget`, etc.) to dispatch state changes.
    *   The legacy `client/src/store/` directory (Zustand-based) is deprecated and MUST be deleted once all components are migrated and the vanilla store is fully functional.
5.  **UI Reactivity (CRITICAL):**
    *   The `GridLayout.ts` component is the central hub for UI updates. It MUST subscribe to `workspaceStore` changes via `workspaceStore.subscribe()`.
    *   On a `'change'` event from the store, `GridLayout` will compare the new state with its current view and perform the following:
        1.  **Mount New Widgets:** Use `WidgetFactory.ts` to instantiate and mount any new widgets present in the state.
        2.  **Unmount Old Widgets:** Call `.unmount()` on widget instances that have been removed from the state to ensure their resources (e.g., fetch intervals, event listeners) are properly cleaned up.
        3.  **Update Layouts:** Apply `x, y, w, h` styles (e.g., `grid-column-start`, `grid-row-start`) to widget containers when the layout state changes for the current breakpoint.
6.  **Widget Creation:** Use `WidgetFactory.ts` (`client/src/widgets/WidgetFactory.ts`) to dynamically create widget instances based on their `type` string (e.g., `'order-book'`) from the store. This avoids a large `switch` statement in the grid.

## Build & Dependency Cleanup Plan

1.  **Dual Entry Points:** `vite.config.ts` must be configured to support two distinct entry points: the legacy `index.html` (for transition) and the primary `vanilla.html`.
2.  **Component Migration:** As a `.tsx` component is refactored into its vanilla `.ts` counterpart, the original `.tsx` file and its containing folder MUST be deleted to remove confusion and reduce project footprint.
3.  **Final Cleanup:** Once the vanilla application is fully functional and powering the entire UI, the absolute final step is to purge all legacy framework dependencies. Run the following command and commit the result:
    ```bash
    npm uninstall react react-dom @types/react @types/react-dom @vitejs/plugin-react react-grid-layout zustand lucide-react clsx tailwind-merge
    ```

## Kalshi Data Display Rules
- **Data Normalization:** Never display raw tickers in the UI. Create a utility that extracts the 'Strike' or 'Outcome' part of the market ticker.
- **Context Enrichment:** When fetching a market, always fetch its parent Event object. Use `event.title` as the primary heading and `market.subtitle` as the sub-heading.
- **Ticker Formatting:** If a user must see a ticker (for copy-pasting), format it in a secondary, monospace 'Bloomberg-style' tag (e.g., `[FED-24DEC]`).
- **Reciprocal Awareness:** For display purposes, remember that a 'Bid 40 NO' is the same as an 'Ask 60 YES'. Implement a display toggle that lets the user choose their 'Perspective' (YES-centric or NO-centric).

## Git & Testing
- All new features MUST be developed on a dedicated branch.
- Follow conventional commit messages.
- Use Vitest for TDD. Aim for 100% test coverage on all financial and data transformation logic (e.g., order book calculations, ticker formatting). Do not commit code that breaks tests.

## Debugging UI Issues (Immediate Priority)

The user reports the grid layout is "not working" despite previous claims of completion and passing tests. This means there is a critical discrepancy between the expected behavior and the actual runtime behavior. Claude MUST prioritize debugging this issue using the following steps before proceeding with new features.

1.  **Launch the Application and Initial Check:**
    *   Ensure you are in the `client/` directory: `cd client`.
    *   Start the development server: `npm run dev`.
    *   Open `http://localhost:XXXX/vanilla.html` (replace XXXX with the actual port).
    *   **Report:** What is the full URL? What do you see on screen? Any console errors/warnings?

2.  **Inspect `GridLayout` Root Element:**
    *   In browser Dev Tools (Elements tab), locate the root element where `GridLayout` is mounted.
    *   **Report:** HTML structure and computed `width`/`height`.

3.  **Inspect `grid-layout` Container:**
    *   Find the `div` with `class="grid-layout"`.
    *   **Report:** Computed `display`, `grid-template-columns`, `grid-auto-rows`, `gap`, `padding`. Does it contain `widget-container` children? Any layout warnings?

4.  **Inspect a `widget-container` (if present):**
    *   Inspect a `div` with `class="widget-container"`.
    *   **Report:** Computed `grid-column-start/end`, `grid-row-start/end`. Does it contain widget content?

5.  **Inspect `workspaceStore` State at Runtime:**
    *   In browser Dev Tools (Console tab), run `window.__workspaceStore.getState()`.
    *   **Report:** Content of `widgets` and `layouts` arrays. Are they as expected?

6.  **Identify the Discrepancy:**
    *   Based on observations, clearly state where actual runtime behavior deviates from expected behavior (e.g., "Widgets are in state, but not mounted to DOM," or "Grid styles are missing").

## Implementing Movable Widgets (Drag & Drop)

Once the grid layout is confirmed to be working visually and structurally, implement drag-and-drop functionality using the native HTML Drag and Drop API to allow users to rearrange widgets.

1.  **Make Widget Headers Draggable (`BaseWidget.ts`):**
    *   Ensure the `widget-header` element (or a dedicated drag handle within it) has the attribute `draggable="true"`.
    *   Add a `dragstart` event listener to this draggable element. In the event handler:
        *   Store the `widget.id` into the `dataTransfer` object: `event.dataTransfer.setData('text/plain', this.id);`.
        *   Optionally, add a CSS class to the dragging element for visual feedback (e.g., `is-dragging`).
        *   Set `event.dataTransfer.effectAllowed = 'move';`.

2.  **Handle Drag Over the Grid (`GridLayout.ts`):**
    *   Add `dragover` and `dragenter` event listeners to the `this.gridContainer` element (the `div` with `class="grid-layout"`).
    *   In the `dragover` handler:
        *   Call `event.preventDefault()` to allow a drop to occur.
        *   Set `event.dataTransfer.dropEffect = 'move';`.
        *   **Implement visual feedback:** Calculate the grid cell (new `x`, `y` coordinates) where the widget would be dropped based on `event.clientX` and `event.clientY` and the grid's cell dimensions. Display a visual indicator (e.g., a semi-transparent placeholder or outline) for the potential drop target.

3.  **Handle Drop on the Grid (`GridLayout.ts`):**
    *   Add a `drop` event listener to the `this.gridContainer` element.
    *   In the `drop` handler:
        *   Call `event.preventDefault()`.
        *   Retrieve the `widgetId`: `const widgetId = event.dataTransfer.getData('text/plain');`.
        *   Calculate the `newX`, `newY` grid coordinates where the widget was dropped based on `event.clientX` and `event.clientY` relative to the `grid-layout` container and its cell size.
        *   Call a new `moveWidget` action on the `workspaceStore`: `workspaceStore.moveWidget(widgetId, newX, newY);`.
        *   Remove any dragging visual feedback.

4.  **Update `workspaceStore` (`workspaceStore.ts`):**
    *   Add a new action function: `export function moveWidget(widgetId: string, newX: number, newY: number): void { ... }`.
    *   Inside `moveWidget`:
        *   Get the current state.
        *   For each breakpoint (`lg`, `md`, `sm`), find the `LayoutItem` corresponding to `widgetId`.
        *   Update `layoutItem.x = newX;` and `layoutItem.y = newY;`.
        *   Call `workspaceStore.setState()` with the updated `layouts` object.

5.  **Cleanup Dragging State:**
    *   Add a `dragend` event listener to the draggable element (in `BaseWidget.ts`) to remove any `is-dragging` classes or other temporary visual states when the drag operation finishes (whether successful or cancelled).

This `GEMINI.md` is now the single source of truth for all tasks and guidelines for Claude. It is crucial to address the debugging priority first.
