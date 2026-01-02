# Refactoring Plan: React to Vanilla TypeScript

This document outlines a plan to refactor the Kalshi Trading Terminal from a React-based application to a Vanilla TypeScript application. The goal is to remove framework-specific abstractions, reduce dependencies, and rely on native browser APIs where possible.

## Phase 1: Project Setup & Dependency Removal

The first step is to remove React and its ecosystem from the project.

### 1.1 Dependency Changes

The following dependencies will be **removed** from `client/package.json`:

- `react`
- `react-dom`
- `@types/react`
- `@types/react-dom`
- `@vitejs/plugin-react`
- `react-grid-layout`
- `zustand`
- `lucide-react` (Icons will need to be replaced with SVGs or another library)
- `clsx` & `tailwind-merge` (These are less critical but are often used in React projects; `cn` utility will be simplified).

### 1.2 Build Configuration

In `vite.config.ts`, remove the `plugin-react()` from the `plugins` array. Your `index.html` will now be the direct entry point for the browser.

### 1.3 New Project Structure

The `client/src` directory will be reorganized to remove React-specific patterns:

-   `main.ts`: The new application entry point.
-   `components/`: Directory for UI components (e.g., `Header.ts`, `BaseWidget.ts`). These will be classes or functions that create and manage DOM elements.
-   `services/`: For logic that is not directly related to a component, like the global state stores.
-   `styles/`: A new directory for CSS files, including the new grid system.

## Phase 2: UI and Component Refactoring

React components will be rewritten as TypeScript classes or functions that manage their own lifecycle and DOM elements.

### 2.1 Base Component Class

A simple base class can be created to standardize component structure:

```typescript
// src/components/BaseComponent.ts
export abstract class BaseComponent<T extends HTMLElement = HTMLElement> {
  protected element: T;
  
  constructor(tag: keyof HTMLElementTagNameMap = 'div') {
    this.element = document.createElement(tag) as T;
  }
  
  public getDOMNode(): T {
    return this.element;
  }
  
  public mount(parent: HTMLElement) {
    parent.appendChild(this.element);
  }
  
  public unmount() {
    this.element.remove();
  }
  
  protected abstract render(): void;
}
```

### 2.2 Component Conversion Example

Here is how `Header.tsx` could be converted:

**Before (React):**
```tsx
// src/components/Header.tsx (simplified)
export function Header() {
  return (
    <header className="flex ...">
      <div className="text-lg ...">Kalshi Terminal</div>
      {/* ... more elements */}
    </header>
  );
}
```

**After (Vanilla TS):**
```typescript
// src/components/Header.ts
import { BaseComponent } from './BaseComponent';

export class Header extends BaseComponent<HTMLElement> {
  constructor() {
    super('header');
    this.element.className = 'flex ...'; // Add classes
    this.render();
  }
  
  protected render(): void {
    this.element.innerHTML = `
      <div class="text-lg ...">Kalshi Terminal</div>
      <!-- ... more elements as a string -->
    `;
  }
}
```

The application's entry point `main.ts` would then instantiate and mount this component.

## Phase 3: Grid Layout Replacement

`react-grid-layout` will be replaced with a custom CSS Grid implementation.

### 3.1 CSS Grid Setup

A new CSS file (`src/styles/grid.css`) will define the grid container:

```css
.grid-layout {
  display: grid;
  grid-template-columns: repeat(12, 1fr); /* 12 columns like the lg breakpoint */
  grid-auto-rows: 40px; /* Equivalent to ROW_HEIGHT */
  gap: 6px; /* Equivalent to MARGIN */
  padding: 12px; /* Equivalent to CONTAINER_PADDING */
}
```

### 3.2 Widget Placement

Each widget's container will be positioned on the grid using inline styles. The `LayoutItem` data from the store (`{ x, y, w, h }`) will be translated to CSS Grid properties.

```typescript
// In the new GridLayout component
function applyGridLayout(widgetElement: HTMLElement, layout: LayoutItem) {
  widgetElement.style.gridColumnStart = `${layout.x + 1}`;
  widgetElement.style.gridColumnEnd = `span ${layout.w}`;
  widgetElement.style.gridRowStart = `${layout.y + 1}`;
  widgetElement.style.gridRowEnd = `span ${layout.h}`;
}
```

### 3.3 Drag-and-Drop and Resizing

This is the most complex part of the replacement. A lightweight implementation would involve:
- **Drag-and-Drop:** Use the native HTML Drag and Drop API. The `.widget-drag-handle` will have `draggable="true"`. Event listeners for `dragstart`, `dragover`, and `drop` will be added to the grid container to update the widget's `x` and `y` position in the store.
- **Resizing:** Use `ResizeObserver` on each widget. When a resize is detected, calculate the new `w` and `h` based on the element's size and the grid's row height and column width, then update the layout in the store. The resize handles from `react-resizable` will need to be recreated with CSS and event listeners for `mousedown`, `mousemove`, and `mouseup`.

## Phase 4: State Management Refactoring

Zustand will be replaced with a native solution using `EventTarget` for global state.

### 4.1 `EventTarget`-based Store

A generic `Store` class can be created:
```typescript
// src/services/createStore.ts
export class Store<T> extends EventTarget {
  private state: T;
  
  constructor(initialState: T) {
    super();
    this.state = initialState;
  }
  
  public getState(): T {
    return this.state;
  }
  
  public setState(updater: Partial<T> | ((prevState: T) => Partial<T>)) {
    const oldState = { ...this.state };
    const newState = typeof updater === 'function' ? updater(this.state) : updater;
    this.state = { ...this.state, ...newState };
    
    this.dispatchEvent(new CustomEvent('change', {
      detail: { oldState, newState: this.state }
    }));
  }
}
```

### 4.2 Converting a Store

The `workspaceStore` would be refactored as follows:

**Before (Zustand):**
```typescript
// src/store/workspaceStore.ts
export const useWorkspaceStore = create<WorkspaceState>()(/* ... */);
```

**After (Vanilla TS):**
```typescript
// src/services/workspaceStore.ts
import { Store } from './createStore';

// ... (interface WorkspaceState and helper functions)

const initialState: WorkspaceState = {
  widgets: [],
  layouts: { lg: [], md: [], sm: [] },
  // ...
};

export const workspaceStore = new Store(initialState);

// Actions can be exported as functions that call workspaceStore.setState()
export function addWidget(type: WidgetType) {
  const currentState = workspaceStore.getState();
  // ... logic to create new widget and layout
  workspaceStore.setState({
    widgets: [...currentState.widgets, newWidget],
    layouts: newLayouts,
  });
}
```

Components would then subscribe to the `'change'` event on the store instance to re-render when state changes.

## Phase 5: Reciprocal Order Book Logic

The logic for handling the reciprocal order book is already well-isolated and can be reused.

### Analysis
The file `client/src/utils/kalshiOrderbook.ts` contains several pure functions. The most important one is:

```typescript
export function normalizeOrderbook(raw: RawOrderbook): NormalizedOrderbook {
  // ...
}
```
This function takes the raw order book data from the API and transforms it into a standardized format with bids and asks.

### Refactoring Plan
**No refactoring is needed here.** This file can be moved to a new `src/utils` or `src/services` directory and used as is. It has no dependencies on React or any other framework, which makes it a perfect example of a pure utility module.

## Phase 6: Final Integration and Cleanup

The final step is to wire everything together in the new entry point.

### `main.ts`
```typescript
// src/main.ts
import { Header } from './components/Header';
import { GridLayout } from './components/GridLayout'; // The new grid layout component
import { workspaceStore } from './services/workspaceStore';

// Get the root element from index.html
const root = document.getElementById('root')!;

// Instantiate and mount components
const header = new Header();
header.mount(root);

const grid = new GridLayout();
grid.mount(root);

// Example of subscribing to store changes
workspaceStore.addEventListener('change', (event) => {
  const { newState } = (event as CustomEvent).detail;
  // The grid component can listen for this and re-render its widgets
  grid.updateWidgets(newState.widgets, newState.layouts);
});

// Initial render
grid.updateWidgets(workspaceStore.getState().widgets, workspaceStore.getState().layouts);
```

This plan provides a high-level roadmap for the refactor. Each step, especially the implementation of drag-and-drop and resizing for the grid, will require significant detailed work.
