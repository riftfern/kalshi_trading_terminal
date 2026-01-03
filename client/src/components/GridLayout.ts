/**
 * GridLayout Component - Vanilla TypeScript
 * Port of GridLayout.tsx following CLAUDE.md architectural principles
 *
 * Features:
 * - 12-column CSS Grid layout with x, y, w, h positioning
 * - Responsive breakpoints (lg/md/sm)
 * - Widget rendering using factory pattern
 * - Subscribes to workspace store for reactivity
 *
 * Note: Drag-and-drop and resize functionality will be added later
 */

import '../styles/grid.css';
import { BaseComponent } from './BaseComponent';
import { workspaceStore, moveWidget } from '../services/workspaceStore';
import { createWidget } from '../widgets/WidgetFactory';
import type { WidgetInstance, LayoutItem, WorkspaceLayouts } from '../types/widget';
import type { BaseWidget } from '../widgets/BaseWidget';

export class GridLayout extends BaseComponent<HTMLDivElement> {
  private widgets: WidgetInstance[] = [];
  private layouts: WorkspaceLayouts = { lg: [], md: [], sm: [] };
  private currentBreakpoint: keyof WorkspaceLayouts = 'lg';
  private widgetComponents: Map<string, BaseWidget> = new Map();
  private gridContainer: HTMLDivElement | null = null;
  private storeUnsubscribe: (() => void) | null = null;
  private placeholder: HTMLDivElement | null = null;

  // Grid configuration
  private readonly GRID_COLS = 12;
  private readonly ROW_HEIGHT = 40;
  private readonly MARGIN = 6;
  private readonly PADDING = 12;

  constructor() {
    super('div');
    this.element.className = 'h-full w-full';
    this.setupBreakpointListener();
    this.render();
  }

  protected render(): void {
    // Clear existing content
    this.element.innerHTML = '';

    // Create grid container with CSS Grid layout
    this.gridContainer = document.createElement('div');
    this.gridContainer.className = 'grid-layout';

    // Add dragover and drop handlers to the grid container itself
    this.gridContainer.addEventListener('dragover', this.handleDragOver.bind(this));
    this.gridContainer.addEventListener('drop', this.handleDrop.bind(this));

    // Get current breakpoint's layout
    const currentLayout = this.layouts[this.currentBreakpoint];

    // Render widgets using factory with positioning
    this.widgets.forEach((widget) => {
      const widgetComponent = this.getOrCreateWidgetComponent(widget);
      const widgetContainer = this.createWidgetContainer(widget, currentLayout);

      // Mount widget component first
      widgetComponent.mount(widgetContainer);

      // Add resize handle AFTER mounting (so it's on top)
      const resizeHandle = this.createResizeHandle(widget.id);
      widgetContainer.appendChild(resizeHandle);

      this.gridContainer!.appendChild(widgetContainer);
    });

    this.element.appendChild(this.gridContainer);
  }

  /**
   * Create widget container with proper grid positioning
   */
  private createWidgetContainer(widget: WidgetInstance, layout: LayoutItem[]): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'widget-container';
    container.id = `widget-${widget.id}`;
    container.draggable = true;
    container.dataset.widgetId = widget.id;

    // Find layout for this widget
    const layoutItem = layout.find(l => l.i === widget.id);

    if (layoutItem) {
      // Apply CSS Grid positioning
      this.applyGridLayout(container, layoutItem);
    }

    // Add drag event listeners
    container.addEventListener('dragstart', this.handleDragStart.bind(this));
    container.addEventListener('dragend', this.handleDragEnd.bind(this));

    return container;
  }

  /**
   * Create resize handle for widget
   */
  private createResizeHandle(widgetId: string): HTMLDivElement {
    const handle = document.createElement('div');
    handle.className = 'widget-resize-handle';
    handle.dataset.widgetId = widgetId;

    // Prevent drag from starting on resize handle
    handle.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      this.handleResizeStart(e, widgetId);
    });

    return handle;
  }

  /**
   * Apply CSS Grid positioning based on layout item
   * Following REFACTOR.md Phase 3.2 specification
   */
  private applyGridLayout(element: HTMLElement, layout: LayoutItem): void {
    element.style.gridColumnStart = `${layout.x + 1}`;
    element.style.gridColumnEnd = `span ${layout.w}`;
    element.style.gridRowStart = `${layout.y + 1}`;
    element.style.gridRowEnd = `span ${layout.h}`;
  }

  /**
   * Setup responsive breakpoint listener
   */
  private setupBreakpointListener(): void {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      let newBreakpoint: keyof WorkspaceLayouts;

      if (width >= 1024) {
        newBreakpoint = 'lg';
      } else if (width >= 768) {
        newBreakpoint = 'md';
      } else {
        newBreakpoint = 'sm';
      }

      if (newBreakpoint !== this.currentBreakpoint) {
        this.currentBreakpoint = newBreakpoint;
        this.render();
      }
    };

    window.addEventListener('resize', updateBreakpoint);
    updateBreakpoint(); // Initial check
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

  /**
   * Drag and Drop Event Handlers
   */
  private handleDragStart(e: DragEvent): void {
    const target = e.currentTarget as HTMLDivElement;
    this.draggedWidgetId = target.dataset.widgetId || null;

    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', this.draggedWidgetId || '');

      // Create a semi-transparent drag image
      const dragImage = target.cloneNode(true) as HTMLElement;
      dragImage.style.opacity = '0.5';
      document.body.appendChild(dragImage);
      e.dataTransfer.setDragImage(dragImage, 0, 0);
      setTimeout(() => document.body.removeChild(dragImage), 0);
    }

    target.classList.add('dragging');
    console.log('Drag started:', this.draggedWidgetId);
  }

  private handleDragEnd(e: DragEvent): void {
    const target = e.currentTarget as HTMLDivElement;
    target.classList.remove('dragging');

    // Clear drag over state from all containers
    const containers = this.gridContainer?.querySelectorAll('.widget-container');
    containers?.forEach(container => {
      container.classList.remove('drag-over');
    });

    console.log('Drag ended:', this.draggedWidgetId);
    this.draggedWidgetId = null;
    this.dragOverWidgetId = null;
  }

  private handleDragOver(e: DragEvent): void {
    e.preventDefault();

    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }

    if (!this.draggedWidgetId) return;

    // Calculate grid position from mouse coordinates
    const gridPos = this.calculateGridPosition(e.clientX, e.clientY);

    // Get the dragged widget's dimensions
    const currentLayout = this.layouts[this.currentBreakpoint];
    const draggedLayout = currentLayout.find(l => l.i === this.draggedWidgetId);

    if (draggedLayout) {
      // Show placeholder at the calculated position
      this.showPlaceholder(gridPos.x, gridPos.y, draggedLayout.w, draggedLayout.h);
    }
  }

  private handleDragLeave(e: DragEvent): void {
    // Only hide placeholder if leaving the grid container
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget || !this.gridContainer?.contains(relatedTarget)) {
      this.hidePlaceholder();
    }
  }

  private handleDrop(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();

    this.hidePlaceholder();

    if (!this.draggedWidgetId) {
      console.log('Drop cancelled - no dragged widget');
      return;
    }

    // Calculate grid position from drop coordinates
    const gridPos = this.calculateGridPosition(e.clientX, e.clientY);

    console.log('Drop:', this.draggedWidgetId, 'at grid position', gridPos);

    // Move widget to the new position
    this.moveWidgetToPosition(this.draggedWidgetId, gridPos.x, gridPos.y);
  }

  /**
   * Calculate grid position from pixel coordinates
   */
  private calculateGridPosition(clientX: number, clientY: number): { x: number; y: number } {
    if (!this.gridContainer) {
      return { x: 0, y: 0 };
    }

    const containerRect = this.gridContainer.getBoundingClientRect();
    const containerStyles = window.getComputedStyle(this.gridContainer);
    const paddingLeft = parseFloat(containerStyles.paddingLeft);
    const paddingTop = parseFloat(containerStyles.paddingTop);

    // Calculate relative position within grid
    const relativeX = clientX - containerRect.left - paddingLeft;
    const relativeY = clientY - containerRect.top - paddingTop;

    // Calculate column width
    const availableWidth = containerRect.width - paddingLeft - parseFloat(containerStyles.paddingRight);
    const totalMarginWidth = this.MARGIN * (this.GRID_COLS - 1);
    const columnWidth = (availableWidth - totalMarginWidth) / this.GRID_COLS;

    // Calculate grid coordinates
    const x = Math.max(0, Math.min(
      this.GRID_COLS - 1,
      Math.floor(relativeX / (columnWidth + this.MARGIN))
    ));

    const y = Math.max(0, Math.floor(relativeY / (this.ROW_HEIGHT + this.MARGIN)));

    return { x, y };
  }

  /**
   * Check if a layout item collides with any existing items
   */
  private hasCollision(item: LayoutItem, excludeId?: string): boolean {
    const currentLayout = this.layouts[this.currentBreakpoint];

    return currentLayout.some(layoutItem => {
      if (layoutItem.i === excludeId) return false;

      // Check for overlap
      const horizontalOverlap =
        item.x < layoutItem.x + layoutItem.w &&
        item.x + item.w > layoutItem.x;

      const verticalOverlap =
        item.y < layoutItem.y + layoutItem.h &&
        item.y + item.h > layoutItem.y;

      return horizontalOverlap && verticalOverlap;
    });
  }

  /**
   * Move widget to a specific grid position
   */
  private moveWidgetToPosition(widgetId: string, x: number, y: number): void {
    const currentLayout = [...this.layouts[this.currentBreakpoint]];
    const widgetLayout = currentLayout.find(l => l.i === widgetId);

    if (!widgetLayout) {
      console.warn('Could not find layout item for widget:', widgetId);
      return;
    }

    // Ensure widget stays within grid bounds
    const maxX = Math.max(0, this.GRID_COLS - widgetLayout.w);
    const newX = Math.max(0, Math.min(maxX, x));
    const newY = Math.max(0, y);

    // Create temporary layout item to check collision
    const tempItem: LayoutItem = {
      ...widgetLayout,
      x: newX,
      y: newY,
    };

    // Check for collision
    if (this.hasCollision(tempItem, widgetId)) {
      console.log('Collision detected, position not allowed');
      return;
    }

    // Update position
    widgetLayout.x = newX;
    widgetLayout.y = newY;

    // Update the layout in the store
    updateLayout(this.currentBreakpoint, currentLayout);

    console.log(`Moved ${widgetId} to x=${newX}, y=${newY}`);
  }

  /**
   * Create or update placeholder element showing drop position
   */
  private showPlaceholder(x: number, y: number, w: number, h: number): void {
    if (!this.gridContainer) return;

    if (!this.placeholder) {
      this.placeholder = document.createElement('div');
      this.placeholder.className = 'grid-placeholder';
      this.gridContainer.appendChild(this.placeholder);
    }

    this.applyGridLayout(this.placeholder, { i: 'placeholder', x, y, w, h });
    this.placeholder.style.display = 'block';
  }

  /**
   * Hide placeholder element
   */
  private hidePlaceholder(): void {
    if (this.placeholder) {
      this.placeholder.style.display = 'none';
    }
  }

  /**
   * Resize Event Handlers
   */
  private handleResizeStart(e: MouseEvent, widgetId: string): void {
    e.preventDefault();

    this.resizingWidgetId = widgetId;
    this.resizeStartPos = { x: e.clientX, y: e.clientY };

    // Get current widget size
    const currentLayout = this.layouts[this.currentBreakpoint];
    const widgetLayout = currentLayout.find(l => l.i === widgetId);

    if (widgetLayout) {
      this.resizeStartSize = { w: widgetLayout.w, h: widgetLayout.h };
    }

    // Add global mouse event listeners
    document.addEventListener('mousemove', this.handleResizeMove);
    document.addEventListener('mouseup', this.handleResizeEnd);

    // Add visual feedback
    const container = document.getElementById(`widget-${widgetId}`);
    if (container) {
      container.classList.add('resizing');
    }

    console.log('Resize started:', widgetId);
  }

  private handleResizeMove = (e: MouseEvent): void => {
    if (!this.resizingWidgetId || !this.gridContainer) return;

    const deltaX = e.clientX - this.resizeStartPos.x;
    const deltaY = e.clientY - this.resizeStartPos.y;

    // Calculate column width and row height
    const containerRect = this.gridContainer.getBoundingClientRect();
    const containerStyles = window.getComputedStyle(this.gridContainer);
    const paddingLeft = parseFloat(containerStyles.paddingLeft);
    const availableWidth = containerRect.width - paddingLeft - parseFloat(containerStyles.paddingRight);
    const totalMarginWidth = this.MARGIN * (this.GRID_COLS - 1);
    const columnWidth = (availableWidth - totalMarginWidth) / this.GRID_COLS;

    // Calculate new size in grid units
    const deltaW = Math.round(deltaX / (columnWidth + this.MARGIN));
    const deltaH = Math.round(deltaY / (this.ROW_HEIGHT + this.MARGIN));

    const newW = Math.max(2, Math.min(this.GRID_COLS, this.resizeStartSize.w + deltaW));
    const newH = Math.max(2, this.resizeStartSize.h + deltaH);

    // Update placeholder to show new size
    const currentLayout = this.layouts[this.currentBreakpoint];
    const widgetLayout = currentLayout.find(l => l.i === this.resizingWidgetId);

    if (widgetLayout) {
      this.showPlaceholder(widgetLayout.x, widgetLayout.y, newW, newH);
    }
  };

  private handleResizeEnd = (): void => {
    if (!this.resizingWidgetId) return;

    // Remove global listeners
    document.removeEventListener('mousemove', this.handleResizeMove);
    document.removeEventListener('mouseup', this.handleResizeEnd);

    // Remove visual feedback
    const container = document.getElementById(`widget-${this.resizingWidgetId}`);
    if (container) {
      container.classList.remove('resizing');
    }

    this.hidePlaceholder();

    // Get the final size from placeholder if it was shown
    if (this.placeholder && this.placeholder.style.display !== 'none') {
      const w = parseInt(this.placeholder.style.gridColumnEnd?.replace('span ', '') || '0');
      const h = parseInt(this.placeholder.style.gridRowEnd?.replace('span ', '') || '0');

      if (w > 0 && h > 0) {
        this.resizeWidget(this.resizingWidgetId, w, h);
      }
    }

    console.log('Resize ended:', this.resizingWidgetId);
    this.resizingWidgetId = null;
  };

  /**
   * Resize widget to specific dimensions
   */
  private resizeWidget(widgetId: string, w: number, h: number): void {
    const currentLayout = [...this.layouts[this.currentBreakpoint]];
    const widgetLayout = currentLayout.find(l => l.i === widgetId);

    if (!widgetLayout) {
      console.warn('Could not find layout item for widget:', widgetId);
      return;
    }

    // Ensure widget stays within grid bounds
    const maxW = Math.max(2, this.GRID_COLS - widgetLayout.x);
    const newW = Math.max(2, Math.min(maxW, w));
    const newH = Math.max(2, h);

    // Create temporary layout item to check collision
    const tempItem: LayoutItem = {
      ...widgetLayout,
      w: newW,
      h: newH,
    };

    // Check for collision
    if (this.hasCollision(tempItem, widgetId)) {
      console.log('Collision detected, resize not allowed');
      return;
    }

    // Update size
    widgetLayout.w = newW;
    widgetLayout.h = newH;

    // Update the layout in the store
    updateLayout(this.currentBreakpoint, currentLayout);

    console.log(`Resized ${widgetId} to w=${newW}, h=${newH}`);
  }

  protected onMount(): void {
    // Subscribe to workspace store for widget and layout updates
    this.storeUnsubscribe = workspaceStore.subscribe((event) => {
      const { newState } = event.detail;

      const widgetsChanged = JSON.stringify(newState.widgets) !== JSON.stringify(this.widgets);
      const layoutsChanged = JSON.stringify(newState.layouts) !== JSON.stringify(this.layouts);

      if (widgetsChanged || layoutsChanged) {
        this.widgets = newState.widgets;
        this.layouts = newState.layouts;

        if (widgetsChanged) {
          this.cleanupRemovedWidgets();
        }

        this.render();
      }
    });

    // Get initial state
    const state = workspaceStore.getState();
    this.widgets = state.widgets;
    this.layouts = state.layouts;
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
