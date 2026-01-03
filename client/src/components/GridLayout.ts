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

    if (this.widgets.length === 0) {
      // Show empty state
      const emptyState = this.createEmptyState();
      this.element.appendChild(emptyState);
    } else {
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
  }

  private createEmptyState(): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'flex items-center justify-center h-full text-slate-500';

    const content = document.createElement('div');
    content.className = 'text-center max-w-md';

    const title = document.createElement('h2');
    title.className = 'text-lg text-slate-300 mb-2';
    title.innerHTML = `Welcome to <span class="line-through text-slate-500">Godel</span> Kalshi Trading Terminal`;
    content.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.className = 'text-sm mb-6';
    subtitle.textContent = 'Get started by adding widgets to your workspace';
    content.appendChild(subtitle);

    // Command palette hint
    const hint = document.createElement('div');
    hint.className = 'flex items-center justify-center gap-2 text-sm';

    const hintText = document.createElement('span');
    hintText.textContent = 'Press';
    hint.appendChild(hintText);

    const kbd = document.createElement('kbd');
    kbd.className = 'px-2 py-1 bg-slate-800 border border-slate-600 rounded font-mono text-cyan-400';
    kbd.textContent = '`';
    hint.appendChild(kbd);

    const orText = document.createElement('span');
    orText.textContent = 'or';
    hint.appendChild(orText);

    const kbdCtrl = document.createElement('kbd');
    kbdCtrl.className = 'px-2 py-1 bg-slate-800 border border-slate-600 rounded font-mono text-cyan-400';
    kbdCtrl.textContent = 'Ctrl+K';
    hint.appendChild(kbdCtrl);

    const toOpenText = document.createElement('span');
    toOpenText.textContent = 'to open command palette';
    hint.appendChild(toOpenText);

    content.appendChild(hint);

    // Quick start buttons
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'mt-8 flex flex-col gap-2';

    const presets = [
      { label: 'Trading Layout', description: 'Orderbook + Chart + Quote' },
      { label: 'Research Layout', description: 'Market Selector + Charts' },
      { label: 'Minimal Layout', description: 'Single Orderbook' },
    ];

    presets.forEach((preset) => {
      const button = document.createElement('button');
      button.className = [
        'px-4 py-2 rounded',
        'bg-slate-800 hover:bg-slate-700',
        'border border-slate-600',
        'text-left transition-colors',
      ].join(' ');

      const labelEl = document.createElement('div');
      labelEl.className = 'text-sm text-slate-200';
      labelEl.textContent = preset.label;
      button.appendChild(labelEl);

      const descEl = document.createElement('div');
      descEl.className = 'text-xs text-slate-500';
      descEl.textContent = preset.description;
      button.appendChild(descEl);

      // TODO: Wire up preset loading
      button.addEventListener('click', () => {
        console.log(`Load preset: ${preset.label}`);
        // workspaceStore.loadPreset(preset.label.toLowerCase())
      });

      buttonsContainer.appendChild(button);
    });

    content.appendChild(buttonsContainer);
    container.appendChild(content);

    return container;
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
