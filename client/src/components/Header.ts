/**
 * Header Component - Vanilla TypeScript
 * Port of Header.tsx following CLAUDE.md architectural principles
 *
 * Features:
 * - Logo and app title
 * - Active ticker display
 * - Command palette trigger button
 * - Connection status indicators
 * - Live clock
 */

import { BaseComponent } from './BaseComponent';
import { workspaceStore } from '../services/workspaceStore';

export class Header extends BaseComponent<HTMLElement> {
  private activeTicker: string | null = null;
  private tickerElement: HTMLDivElement | null = null;
  private timeElement: HTMLSpanElement | null = null;
  private timeInterval: number | null = null;
  private storeUnsubscribe: (() => void) | null = null;

  constructor() {
    super('header');
    this.element.className = [
      'flex items-center justify-between px-4 py-2',
      'bg-gradient-to-b from-slate-800 to-slate-900',
      'border-b border-cyan-500/30',
    ].join(' ');

    this.render();
  }

  protected render(): void {
    // Clear existing content
    this.element.innerHTML = '';

    // Left section: Logo and title
    const leftSection = this.createLeftSection();
    this.element.appendChild(leftSection);

    // Center section: Command palette trigger
    const centerSection = this.createCommandTrigger();
    this.element.appendChild(centerSection);

    // Right section: Status and time
    const rightSection = this.createRightSection();
    this.element.appendChild(rightSection);
  }

  private createLeftSection(): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'flex items-center gap-3';

    // Logo and title
    const logoContainer = document.createElement('div');
    logoContainer.className = 'flex items-center gap-2';

    // Activity icon (simple SVG)
    const icon = this.createActivityIcon();
    logoContainer.appendChild(icon);

    // Title
    const title = document.createElement('span');
    title.className = 'font-bold text-sm tracking-wide text-slate-200';
    title.innerHTML = `<span class="line-through text-slate-500 mr-1">GODEL</span> KALSHI TRADING TERMINAL`;
    logoContainer.appendChild(title);

    container.appendChild(logoContainer);

    // Active ticker (conditionally rendered)
    this.tickerElement = document.createElement('div');
    this.tickerElement.className = 'flex items-center gap-3';
    this.updateTickerDisplay();
    container.appendChild(this.tickerElement);

    return container;
  }

  private createActivityIcon(): SVGSVGElement {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'w-5 h-5 text-cyan-400');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');

    // Activity icon path (pulse/heartbeat shape)
    svg.innerHTML = `<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>`;

    return svg;
  }

  private createCommandIcon(): SVGSVGElement {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'w-3 h-3');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');

    // Command icon (⌘ symbol approximation)
    svg.innerHTML = `<path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"></path>`;

    return svg;
  }

  private createCommandTrigger(): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = [
      'flex items-center gap-2 px-3 py-1.5',
      'bg-slate-800/50 hover:bg-slate-700/50',
      'border border-slate-600 rounded',
      'text-xs text-slate-400 hover:text-slate-300',
      'transition-colors',
    ].join(' ');

    const icon = this.createCommandIcon();
    button.appendChild(icon);

    const text = document.createElement('span');
    text.textContent = 'Search markets...';
    button.appendChild(text);

    const kbd = document.createElement('kbd');
    kbd.className = 'px-1.5 py-0.5 bg-slate-700 rounded text-xs font-mono';
    kbd.textContent = '`';
    button.appendChild(kbd);

    // Open command palette on click
    button.addEventListener('click', () => {
      // Dispatch keyboard event to trigger command palette
      const event = new KeyboardEvent('keydown', {
        key: '`',
        bubbles: true,
      });
      document.dispatchEvent(event);
    });

    return button;
  }

  private createRightSection(): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'flex items-center gap-4';

    // Connection status
    const statusContainer = document.createElement('div');
    statusContainer.className = 'flex items-center gap-2 text-xs';

    // API status dot
    statusContainer.appendChild(this.createStatusDot(true, 'API'));
    // WebSocket status dot
    statusContainer.appendChild(this.createStatusDot(true, 'WS'));

    // Environment label
    const envLabel = document.createElement('span');
    envLabel.className = 'text-slate-500';
    envLabel.textContent = 'DEMO'; // TODO: Get from config
    statusContainer.appendChild(envLabel);

    container.appendChild(statusContainer);

    // Current time
    this.timeElement = document.createElement('span');
    this.timeElement.className = 'font-mono text-xs text-slate-400';
    this.updateTime();
    container.appendChild(this.timeElement);

    return container;
  }

  private createStatusDot(connected: boolean, label: string): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'flex items-center gap-1';

    const dot = document.createElement('div');
    dot.className = [
      'w-2 h-2 rounded-full',
      connected ? 'bg-green-400' : 'bg-red-400',
    ].join(' ');
    container.appendChild(dot);

    const labelEl = document.createElement('span');
    labelEl.className = 'text-slate-500';
    labelEl.textContent = label;
    container.appendChild(labelEl);

    return container;
  }

  private updateTickerDisplay(): void {
    if (!this.tickerElement) return;

    if (this.activeTicker) {
      this.tickerElement.innerHTML = '';

      // Separator
      const separator = document.createElement('div');
      separator.className = 'w-px h-4 bg-slate-600';
      this.tickerElement.appendChild(separator);

      // Ticker text
      const ticker = document.createElement('span');
      ticker.className = 'text-sm font-mono text-cyan-400';
      ticker.textContent = this.activeTicker;
      this.tickerElement.appendChild(ticker);

      this.tickerElement.style.display = 'flex';
    } else {
      this.tickerElement.style.display = 'none';
    }
  }

  private updateTime(): void {
    if (!this.timeElement) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    this.timeElement.textContent = timeStr;
  }

  protected onMount(): void {
    // Subscribe to workspace store for active ticker
    this.storeUnsubscribe = workspaceStore.subscribe((event) => {
      const { newState } = event.detail;
      if (newState.currentTicker !== this.activeTicker) {
        this.activeTicker = newState.currentTicker;
        this.updateTickerDisplay();
      }
    });

    // Get initial state
    const state = workspaceStore.getState();
    this.activeTicker = state.currentTicker;
    this.updateTickerDisplay();

    // Start time update interval
    this.timeInterval = window.setInterval(() => {
      this.updateTime();
    }, 1000);
  }

  protected cleanup(): void {
    // Stop time updates
    if (this.timeInterval !== null) {
      clearInterval(this.timeInterval);
      this.timeInterval = null;
    }

    // Unsubscribe from store
    if (this.storeUnsubscribe) {
      this.storeUnsubscribe();
      this.storeUnsubscribe = null;
    }
  }
}
