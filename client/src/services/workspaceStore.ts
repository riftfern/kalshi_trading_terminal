/**
 * Workspace Store - Vanilla TypeScript Implementation
 * Follows REFACTOR.md Phase 4.2 - Convert from Zustand to EventTarget-based Store
 *
 * Manages widget instances and their grid layouts
 */

import { Store } from './createStore';
import type {
  WidgetType,
  WidgetInstance,
  LayoutItem,
  WorkspaceLayouts,
  WidgetConfig,
} from '../types/widget';
import { DEFAULT_WIDGET_SIZES } from '../types/widget';

export interface WorkspaceState {
  widgets: WidgetInstance[];
  layouts: WorkspaceLayouts;
  currentTicker: string | null;
  activeWidgetId: string | null;
}

// Initial state
const initialState: WorkspaceState = {
  widgets: [],
  layouts: {
    lg: [],
    md: [],
    sm: [],
  },
  currentTicker: null,
  activeWidgetId: null,
};

// Create the global workspace store instance
export const workspaceStore = new Store<WorkspaceState>(initialState);

// ============================================================================
// Action Functions - These mutate the store and trigger change events
// ============================================================================

/**
 * Add a new widget to the workspace
 */
export function addWidget(
  type: WidgetType,
  ticker?: string,
  config: WidgetConfig = {}
): void {
  const currentState = workspaceStore.getState();
  const newId = `${type}-${Date.now()}`;

  // Create widget instance
  const newWidget: WidgetInstance = {
    id: newId,
    type,
    ticker,
    title: getWidgetTitle(type, ticker),
    config,
  };

  // Find position for new widget
  const position = findAvailablePosition(currentState.layouts.lg);
  const size = DEFAULT_WIDGET_SIZES[type];

  // Create layout item
  const newLayoutItem: LayoutItem = {
    i: newId,
    x: position.x,
    y: position.y,
    w: size.w,
    h: size.h,
    minW: size.minW,
    minH: size.minH,
  };

  // Update state
  workspaceStore.setState({
    widgets: [...currentState.widgets, newWidget],
    layouts: {
      lg: [...currentState.layouts.lg, newLayoutItem],
      md: [...currentState.layouts.md, newLayoutItem],
      sm: [...currentState.layouts.sm, newLayoutItem],
    },
  });
}

/**
 * Remove a widget from the workspace
 */
export function removeWidget(widgetId: string): void {
  const currentState = workspaceStore.getState();

  workspaceStore.setState({
    widgets: currentState.widgets.filter((w) => w.id !== widgetId),
    layouts: {
      lg: currentState.layouts.lg.filter((l) => l.i !== widgetId),
      md: currentState.layouts.md.filter((l) => l.i !== widgetId),
      sm: currentState.layouts.sm.filter((l) => l.i !== widgetId),
    },
    activeWidgetId:
      currentState.activeWidgetId === widgetId
        ? null
        : currentState.activeWidgetId,
  });
}

/**
 * Update a widget's configuration
 */
export function updateWidget(
  widgetId: string,
  updates: Partial<Omit<WidgetInstance, 'id'>>
): void {
  const currentState = workspaceStore.getState();

  workspaceStore.setState({
    widgets: currentState.widgets.map((w) =>
      w.id === widgetId ? { ...w, ...updates } : w
    ),
  });
}

/**
 * Update the grid layout for a specific breakpoint
 */
export function updateLayout(
  breakpoint: keyof WorkspaceLayouts,
  layout: LayoutItem[]
): void {
  const currentState = workspaceStore.getState();

  workspaceStore.setState({
    layouts: {
      ...currentState.layouts,
      [breakpoint]: layout,
    },
  });
}

/**
 * Set the current active ticker (for market-specific widgets)
 */
export function setCurrentTicker(ticker: string | null): void {
  workspaceStore.setState({ currentTicker: ticker });
}

/**
 * Set the active widget ID
 */
export function setActiveWidget(widgetId: string | null): void {
  workspaceStore.setState({ activeWidgetId: widgetId });
}

/**
 * Clear all widgets from the workspace
 */
export function clearWorkspace(): void {
  workspaceStore.setState({
    widgets: [],
    layouts: {
      lg: [],
      md: [],
      sm: [],
    },
    activeWidgetId: null,
  });
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a display title for a widget
 */
function getWidgetTitle(type: WidgetType, ticker?: string): string {
  const baseTitle = type
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return ticker ? `${baseTitle} - ${ticker}` : baseTitle;
}

/**
 * Find an available position in the grid for a new widget
 * Simple algorithm: Place in the first available spot, or at the bottom
 */
function findAvailablePosition(
  layout: LayoutItem[]
): { x: number; y: number } {
  if (layout.length === 0) {
    return { x: 0, y: 0 };
  }

  // Find the bottom-most widget
  const maxY = Math.max(...layout.map((l) => l.y + l.h));

  // Start new widgets at the bottom left
  return { x: 0, y: maxY };
}
