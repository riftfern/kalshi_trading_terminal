/**
 * GridLayout Component - Vanilla TypeScript
 * Port of GridLayout.tsx following CLAUDE.md architectural principles
 *
 * Features:
 * - Responsive grid layout for widgets
 * - Empty state display
 * - Widget rendering using factory pattern
 * - Subscribes to workspace store
 *
 * Note: Drag-and-drop and resize functionality will be added later
 * For now, uses simple CSS Grid layout
 */

import { BaseComponent } from './BaseComponent';
import { workspaceStore } from '../services/workspaceStore';
import { createWidget } from '../widgets/WidgetFactory';
import type { WidgetInstance } from '../types/widget';
import type { BaseWidget } from '../widgets/BaseWidget';

export class GridLayout extends BaseComponent<HTMLDivElement> {
  private widgets: WidgetInstance[] = [];
  private widgetComponents: Map<string, BaseWidget> = new Map();
  private gridContainer: HTMLDivElement | null = null;
  private storeUnsubscribe: (() => void) | null = null;

  constructor() {
    super('div');
    this.element.className = 'h-full w-full overflow-y-auto bg-slate-950 p-3';
    this.render();
  }

  protected render(): void {
    // Clear existing content
    this.element.innerHTML = '';

    // Create grid container
    this.gridContainer = document.createElement('div');
    this.gridContainer.className = [
      'grid gap-3',
      'grid-cols-1',
      'md:grid-cols-2',
      'lg:grid-cols-3',
      'xl:grid-cols-4',
      'auto-rows-fr',
    ].join(' ');

    // Render widgets using factory
    this.widgets.forEach((widget) => {
      const widgetComponent = this.getOrCreateWidgetComponent(widget);
      const widgetContainer = document.createElement('div');
      widgetContainer.className = 'min-h-[300px]';
      widgetContainer.id = `widget-${widget.id}`;

      widgetComponent.mount(widgetContainer);
      this.gridContainer!.appendChild(widgetContainer);
    });

    this.element.appendChild(this.gridContainer);
  }

  private getOrCreateWidgetComponent(widget: WidgetInstance): BaseWidget {
    // Check if we already have a component for this widget
    let component = this.widgetComponents.get(widget.id);

    if (!component) {
      // Create new widget component using factory
      component = createWidget(widget);
      this.widgetComponents.set(widget.id, component);
    }

    return component;
  }

  private cleanupRemovedWidgets(): void {
    // Remove components that are no longer in the widgets list
    const currentWidgetIds = new Set(this.widgets.map(w => w.id));

    for (const [id, component] of this.widgetComponents.entries()) {
      if (!currentWidgetIds.has(id)) {
        component.unmount();
        this.widgetComponents.delete(id);
      }
    }
  }

  protected onMount(): void {
    // Subscribe to workspace store for widget updates
    this.storeUnsubscribe = workspaceStore.subscribe((event) => {
      const { newState } = event.detail;
      if (JSON.stringify(newState.widgets) !== JSON.stringify(this.widgets)) {
        this.widgets = newState.widgets;
        this.cleanupRemovedWidgets();
        this.render();
      }
    });

    // Get initial state
    const state = workspaceStore.getState();
    this.widgets = state.widgets;
    this.render();
  }

  protected cleanup(): void {
    // Cleanup all widget components
    for (const component of this.widgetComponents.values()) {
      component.unmount();
    }
    this.widgetComponents.clear();

    if (this.storeUnsubscribe) {
      this.storeUnsubscribe();
      this.storeUnsubscribe = null;
    }
  }
}
