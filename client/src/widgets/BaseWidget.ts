/**
 * BaseWidget - Vanilla TypeScript
 * Foundation for all widget components
 *
 * Features:
 * - Widget header with drag handle
 * - Title and ticker display
 * - Action buttons (refresh, close)
 * - Loading and error states
 * - Content area for widget-specific content
 */

import { BaseComponent } from '../components/BaseComponent';

export interface BaseWidgetConfig {
  id: string;
  title: string;
  ticker?: string;
  onRemove: () => void;
  onRefresh?: () => void;
  headerActions?: () => HTMLElement;
}

export abstract class BaseWidget extends BaseComponent<HTMLDivElement> {
  protected config: BaseWidgetConfig;
  protected headerElement: HTMLDivElement;
  protected contentElement: HTMLDivElement;
  protected loadingElement: HTMLDivElement;
  protected errorElement: HTMLDivElement;
  protected isLoading: boolean = false;
  protected error: string | null = null;

  constructor(config: BaseWidgetConfig) {
    super('div');
    this.config = config;

    this.element.className = [
      'flex flex-col h-full',
      'bg-slate-900 border border-slate-700 rounded',
      'overflow-hidden',
    ].join(' ');

    // Create header
    this.headerElement = this.createHeader();
    this.element.appendChild(this.headerElement);

    // Create content container
    const contentContainer = document.createElement('div');
    contentContainer.className = 'flex-1 overflow-auto p-2 relative';

    // Create loading state
    this.loadingElement = this.createLoadingState();
    this.loadingElement.style.display = 'none';
    contentContainer.appendChild(this.loadingElement);

    // Create error state
    this.errorElement = this.createErrorState();
    this.errorElement.style.display = 'none';
    contentContainer.appendChild(this.errorElement);

    // Create content element
    this.contentElement = document.createElement('div');
    this.contentElement.className = 'h-full';
    contentContainer.appendChild(this.contentElement);

    this.element.appendChild(contentContainer);
  }

  private createHeader(): HTMLDivElement {
    const header = document.createElement('div');
    header.className = [
      'flex items-center justify-between px-3 py-2',
      'bg-slate-800 border-b border-slate-700',
      'widget-drag-handle cursor-move',
    ].join(' ');

    // Left side: title and ticker
    const leftSide = document.createElement('div');
    leftSide.className = 'flex items-center gap-2 min-w-0';

    const title = document.createElement('span');
    title.className = 'text-xs font-mono text-slate-400 truncate';
    title.textContent = this.config.title;
    leftSide.appendChild(title);

    if (this.config.ticker) {
      const ticker = document.createElement('span');
      ticker.className = 'text-xs font-bold text-cyan-400 shrink-0';
      ticker.textContent = this.config.ticker;
      leftSide.appendChild(ticker);
    }

    header.appendChild(leftSide);

    // Right side: action buttons
    const rightSide = document.createElement('div');
    rightSide.className = 'flex items-center gap-1 shrink-0';

    // Custom header actions
    if (this.config.headerActions) {
      const customActions = this.config.headerActions();
      rightSide.appendChild(customActions);
    }

    // Refresh button
    if (this.config.onRefresh) {
      const refreshBtn = this.createRefreshButton();
      rightSide.appendChild(refreshBtn);
    }

    // Close button
    const closeBtn = this.createCloseButton();
    rightSide.appendChild(closeBtn);

    header.appendChild(rightSide);

    return header;
  }

  private createRefreshButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = 'p-1 hover:bg-slate-700 rounded transition-colors';
    button.title = 'Refresh';

    const icon = this.createRefreshIcon();
    button.appendChild(icon);

    button.addEventListener('click', () => {
      if (this.config.onRefresh) {
        this.config.onRefresh();
      }
    });

    return button;
  }

  private createRefreshIcon(): SVGSVGElement {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'w-3 h-3 text-slate-400');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');

    svg.innerHTML = `<polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>`;

    return svg;
  }

  private createCloseButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = 'p-1 hover:bg-red-900/50 rounded transition-colors';
    button.title = 'Close';

    const icon = this.createCloseIcon();
    button.appendChild(icon);

    button.addEventListener('click', () => {
      this.config.onRemove();
    });

    return button;
  }

  private createCloseIcon(): SVGSVGElement {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'w-3 h-3 text-slate-400 hover:text-red-400');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');

    svg.innerHTML = `<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>`;

    return svg;
  }

  private createLoadingState(): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'absolute inset-0 flex items-center justify-center bg-slate-900/95 z-10';

    const content = document.createElement('div');
    content.className = 'flex items-center gap-2 text-slate-500';

    const spinner = this.createRefreshIcon();
    spinner.setAttribute('class', 'w-4 h-4 text-slate-500 animate-spin');
    content.appendChild(spinner);

    const text = document.createElement('span');
    text.className = 'text-xs';
    text.textContent = 'Loading...';
    content.appendChild(text);

    container.appendChild(content);

    return container;
  }

  private createErrorState(): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'absolute inset-0 flex items-center justify-center bg-slate-900/95 z-10';

    const text = document.createElement('div');
    text.className = 'text-red-400 text-sm text-center px-4';
    container.appendChild(text);

    return container;
  }

  protected setLoading(loading: boolean): void {
    this.isLoading = loading;
    this.updateDisplay();

    // Add/remove spin animation to refresh button
    const refreshIcon = this.headerElement.querySelector('svg');
    if (refreshIcon) {
      if (loading) {
        refreshIcon.classList.add('animate-spin');
      } else {
        refreshIcon.classList.remove('animate-spin');
      }
    }
  }

  protected setError(error: string | null): void {
    this.error = error;
    if (error) {
      const errorText = this.errorElement.querySelector('div');
      if (errorText) {
        errorText.textContent = error;
      }
    }
    this.updateDisplay();
  }

  private updateDisplay(): void {
    if (this.isLoading && !this.error) {
      this.loadingElement.style.display = 'flex';
      this.errorElement.style.display = 'none';
      this.contentElement.style.display = 'none';
    } else if (this.error) {
      this.loadingElement.style.display = 'none';
      this.errorElement.style.display = 'flex';
      this.contentElement.style.display = 'none';
    } else {
      this.loadingElement.style.display = 'none';
      this.errorElement.style.display = 'none';
      this.contentElement.style.display = 'block';
    }
  }

  protected renderContent(content: HTMLElement | string): void {
    this.contentElement.innerHTML = '';
    if (typeof content === 'string') {
      this.contentElement.innerHTML = content;
    } else {
      this.contentElement.appendChild(content);
    }
  }

  protected abstract render(): void;
}
