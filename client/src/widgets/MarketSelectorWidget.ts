/**
 * MarketSelectorWidget - Vanilla TypeScript
 * Browse and search events and markets
 *
 * Features:
 * - Event-first hierarchy (human-readable titles)
 * - Click event to view markets
 * - Search filter for events
 * - Pagination support with cursor
 * - Category badges
 * - Quick actions (Quote, OrderBook)
 */

import { BaseWidget, BaseWidgetConfig } from './BaseWidget';
import { formatVolume } from '../utils/format';
import { setCurrentTicker, addWidget } from '../services/workspaceStore';
import { calculateMarketHeat, isLiquidMarket, sortByHeat } from '../utils/marketHeat';
import type { Event, Market } from '../types/market';

export interface MarketSelectorWidgetConfig extends BaseWidgetConfig {}

type ViewMode = 'events' | 'markets';
type SortMode = 'default' | 'trending';

export class MarketSelectorWidget extends BaseWidget {
  private events: Event[] = [];
  private markets: Market[] = [];
  private filteredEvents: Event[] = [];
  private searchQuery: string = '';
  private viewMode: ViewMode = 'events';
  private selectedEvent: Event | null = null;
  private cursor: string | null = null;
  private hasMore: boolean = false;
  private sortMode: SortMode = 'default';
  private showOnlyLiquid: boolean = false;

  private searchInput: HTMLInputElement | null = null;
  private listContainer: HTMLDivElement | null = null;

  constructor(config: MarketSelectorWidgetConfig) {
    super(config);
  }

  protected render(): void {
    const container = document.createElement('div');
    container.className = 'flex flex-col h-full';

    // Search input
    const searchSection = this.createSearchInput();
    container.appendChild(searchSection);

    // Breadcrumb navigation (if viewing markets)
    if (this.viewMode === 'markets' && this.selectedEvent) {
      const breadcrumb = this.createBreadcrumb();
      container.appendChild(breadcrumb);
    }

    // Event/Market list
    this.listContainer = document.createElement('div');
    this.listContainer.className = 'flex-1 overflow-y-auto -mx-2';
    this.renderList();
    container.appendChild(this.listContainer);

    // Footer with count and load more
    const footer = this.createFooter();
    container.appendChild(footer);

    this.renderContent(container);
  }

  private createSearchInput(): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'relative mb-2';

    // Search icon
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('class', 'absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500');
    icon.setAttribute('fill', 'none');
    icon.setAttribute('stroke', 'currentColor');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('stroke-width', '2');
    icon.innerHTML = `<circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path>`;
    container.appendChild(icon);

    // Input
    this.searchInput = document.createElement('input');
    this.searchInput.type = 'text';
    this.searchInput.placeholder = this.viewMode === 'events' ? 'Search events...' : 'Search markets...';
    this.searchInput.className = [
      'w-full pl-7 pr-2 py-1.5',
      'bg-slate-800 border border-slate-700 rounded',
      'text-xs text-slate-300 placeholder:text-slate-600',
      'outline-none focus:border-cyan-500/50',
    ].join(' ');

    this.searchInput.addEventListener('input', () => {
      this.searchQuery = this.searchInput!.value;
      this.filterEvents();
      this.renderList();
    });

    container.appendChild(this.searchInput);

    return container;
  }

  private createBreadcrumb(): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'mb-2 px-2';

    // Breadcrumb navigation
    const breadcrumb = document.createElement('div');
    breadcrumb.className = 'flex items-center gap-2 text-xs mb-2';

    const backBtn = document.createElement('button');
    backBtn.className = 'text-cyan-400 hover:text-cyan-300';
    backBtn.textContent = '← Back to Events';
    backBtn.addEventListener('click', () => {
      this.viewMode = 'events';
      this.selectedEvent = null;
      this.markets = [];
      this.render();
    });
    breadcrumb.appendChild(backBtn);

    const separator = document.createElement('span');
    separator.className = 'text-slate-600';
    separator.textContent = '/';
    breadcrumb.appendChild(separator);

    const eventName = document.createElement('span');
    eventName.className = 'text-slate-400 truncate';
    eventName.textContent = this.selectedEvent!.title.substring(0, 50);
    breadcrumb.appendChild(eventName);

    container.appendChild(breadcrumb);

    // Sort and filter controls
    const controls = document.createElement('div');
    controls.className = 'flex items-center gap-2 text-xs';

    // Sort toggle
    const sortLabel = document.createElement('span');
    sortLabel.className = 'text-slate-500';
    sortLabel.textContent = 'Sort:';
    controls.appendChild(sortLabel);

    const sortBtn = document.createElement('button');
    sortBtn.className = [
      'px-2 py-0.5 rounded border transition-colors',
      this.sortMode === 'trending'
        ? 'bg-cyan-900/30 border-cyan-500/50 text-cyan-300'
        : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500'
    ].join(' ');
    sortBtn.textContent = this.sortMode === 'trending' ? '🔥 Trending' : 'Default';
    sortBtn.addEventListener('click', () => {
      this.sortMode = this.sortMode === 'default' ? 'trending' : 'default';
      this.render();
    });
    controls.appendChild(sortBtn);

    // Liquidity filter toggle
    const liquidCheckbox = document.createElement('input');
    liquidCheckbox.type = 'checkbox';
    liquidCheckbox.checked = this.showOnlyLiquid;
    liquidCheckbox.className = 'ml-2';
    liquidCheckbox.addEventListener('change', (e) => {
      this.showOnlyLiquid = (e.target as HTMLInputElement).checked;
      this.render();
    });
    controls.appendChild(liquidCheckbox);

    const liquidLabel = document.createElement('label');
    liquidLabel.className = 'text-slate-400 cursor-pointer';
    liquidLabel.textContent = 'Show Only Liquid Markets';
    liquidLabel.addEventListener('click', () => {
      liquidCheckbox.click();
    });
    controls.appendChild(liquidLabel);

    container.appendChild(controls);

    return container;
  }

  private createFooter(): HTMLDivElement {
    const footer = document.createElement('div');
    footer.className = 'text-xs text-slate-600 pt-1 border-t border-slate-700 mt-1 flex justify-between items-center';

    const count = document.createElement('span');
    if (this.viewMode === 'events') {
      count.textContent = `${this.filteredEvents.length} events`;
    } else {
      count.textContent = `${this.markets.length} markets`;
    }
    footer.appendChild(count);

    // Load more button (only for events with pagination)
    if (this.viewMode === 'events' && this.hasMore) {
      const loadMoreBtn = document.createElement('button');
      loadMoreBtn.className = 'text-cyan-400 hover:text-cyan-300 text-xs';
      loadMoreBtn.textContent = 'Load more';
      loadMoreBtn.addEventListener('click', () => {
        this.fetchEvents(this.cursor);
      });
      footer.appendChild(loadMoreBtn);
    }

    return footer;
  }

  private filterEvents(): void {
    const searchLower = this.searchQuery.toLowerCase();

    this.filteredEvents = this.events.filter(
      (e) =>
        e.title.toLowerCase().includes(searchLower) ||
        (e.category && e.category.toLowerCase().includes(searchLower)) ||
        (e.series_ticker && e.series_ticker.toLowerCase().includes(searchLower))
    );
  }

  private renderList(): void {
    if (!this.listContainer) return;

    this.listContainer.innerHTML = '';

    if (this.viewMode === 'events') {
      this.renderEventList();
    } else {
      this.renderMarketList();
    }
  }

  private renderEventList(): void {
    if (this.filteredEvents.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'text-center text-slate-500 text-xs py-4';
      empty.textContent = this.searchQuery ? 'No events found' : 'Loading events...';
      this.listContainer!.appendChild(empty);
      return;
    }

    this.filteredEvents.forEach((event) => {
      const row = this.createEventRow(event);
      this.listContainer!.appendChild(row);
    });
  }

  private createEventRow(event: Event): HTMLDivElement {
    const row = document.createElement('div');
    row.className = [
      'px-2 py-1.5 cursor-pointer',
      'hover:bg-slate-800/50 transition-colors',
      'border-b border-slate-800',
    ].join(' ');

    const content = document.createElement('div');
    content.className = 'flex items-center justify-between gap-2';

    // Left side: event info
    const leftSide = document.createElement('div');
    leftSide.className = 'min-w-0 flex-1';

    // Category badge
    if (event.category) {
      const categoryBadge = document.createElement('span');
      categoryBadge.className = 'text-[10px] px-1 py-0.5 rounded bg-slate-700 text-slate-400 inline-block mb-1';
      categoryBadge.textContent = event.category;
      leftSide.appendChild(categoryBadge);
    }

    // Event title
    const titleRow = document.createElement('div');
    titleRow.className = 'text-xs text-slate-200 font-medium';
    titleRow.textContent = event.title;
    leftSide.appendChild(titleRow);

    // Series ticker (if available)
    if (event.series_ticker) {
      const tickerRow = document.createElement('div');
      tickerRow.className = 'text-[10px] text-cyan-400/60 mt-0.5';
      tickerRow.textContent = event.series_ticker;
      leftSide.appendChild(tickerRow);
    }

    content.appendChild(leftSide);

    // Right side: arrow indicator
    const rightSide = document.createElement('div');
    rightSide.className = 'shrink-0 text-slate-600';
    rightSide.innerHTML = `
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    `;
    content.appendChild(rightSide);

    row.appendChild(content);

    // Click to view markets for this event
    row.addEventListener('click', () => {
      this.selectedEvent = event;
      this.viewMode = 'markets';
      if (event.series_ticker) {
        this.fetchMarketsForEvent(event.series_ticker);
      }
    });

    return row;
  }

  private renderMarketList(): void {
    if (this.markets.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'text-center text-slate-500 text-xs py-4';
      empty.textContent = 'Loading markets...';
      this.listContainer!.appendChild(empty);
      return;
    }

    // Apply filtering
    let filteredMarkets = [...this.markets];
    if (this.showOnlyLiquid) {
      filteredMarkets = filteredMarkets.filter(m => isLiquidMarket(m, 100));
    }

    // Apply sorting
    if (this.sortMode === 'trending') {
      filteredMarkets = sortByHeat(filteredMarkets);
    }

    if (filteredMarkets.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'text-center text-slate-500 text-xs py-4';
      empty.textContent = 'No liquid markets found';
      this.listContainer!.appendChild(empty);
      return;
    }

    filteredMarkets.forEach((market) => {
      const row = this.createMarketRow(market);
      this.listContainer!.appendChild(row);
    });
  }

  private createMarketRow(market: Market): HTMLDivElement {
    const row = document.createElement('div');
    row.className = [
      'px-2 py-1.5 cursor-pointer',
      'hover:bg-slate-800/50 transition-colors',
      'border-b border-slate-800',
    ].join(' ');

    const content = document.createElement('div');
    content.className = 'flex items-center justify-between gap-2';

    // Left side: market info
    const leftSide = document.createElement('div');
    leftSide.className = 'min-w-0 flex-1';

    // Market subtitle (the outcome/question)
    const titleRow = document.createElement('div');
    titleRow.className = 'text-xs text-slate-200';
    titleRow.textContent = market.subtitle || market.title;
    leftSide.appendChild(titleRow);

    // Ticker with stats
    const tickerRow = document.createElement('div');
    tickerRow.className = 'text-[10px] text-cyan-400/60 mt-0.5 truncate flex items-center gap-2';

    const ticker = document.createElement('span');
    ticker.textContent = market.ticker;
    tickerRow.appendChild(ticker);

    // Show heat score in trending mode
    if (this.sortMode === 'trending') {
      const heat = calculateMarketHeat(market);
      if (heat > 0) {
        const heatBadge = document.createElement('span');
        heatBadge.className = 'px-1 py-0.5 rounded bg-orange-900/30 text-orange-400 text-[9px]';
        heatBadge.textContent = `🔥 ${Math.round(heat)}`;
        tickerRow.appendChild(heatBadge);
      }
    }

    // Show liquidity indicator
    if (market.liquidity && market.liquidity > 0) {
      const liquidityBadge = document.createElement('span');
      liquidityBadge.className = 'px-1 py-0.5 rounded bg-green-900/30 text-green-400 text-[9px]';
      liquidityBadge.textContent = `${formatVolume(market.liquidity)}`;
      tickerRow.appendChild(liquidityBadge);
    }

    leftSide.appendChild(tickerRow);

    content.appendChild(leftSide);

    // Right side: actions
    const rightSide = document.createElement('div');
    rightSide.className = 'shrink-0 flex gap-1';

    const quoteBtn = this.createActionButton('Quote', () => {
      addWidget('quote', market.ticker);
    });
    rightSide.appendChild(quoteBtn);

    const bookBtn = this.createActionButton('Book', () => {
      addWidget('orderbook', market.ticker);
    });
    rightSide.appendChild(bookBtn);

    content.appendChild(rightSide);

    row.appendChild(content);

    // Click to set active ticker
    row.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('button')) return;
      setCurrentTicker(market.ticker);
    });

    return row;
  }

  private createActionButton(label: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = [
      'px-2 py-0.5 text-[10px]',
      'bg-slate-700 hover:bg-cyan-900/50',
      'border border-slate-600',
      'rounded transition-colors',
    ].join(' ');
    button.textContent = label;
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      onClick();
    });

    return button;
  }

  private async fetchEvents(cursor: string | null = null): Promise<void> {
    this.setLoading(true);
    this.setError(null);

    try {
      const url = cursor
        ? `/api/events?limit=50&cursor=${encodeURIComponent(cursor)}`
        : '/api/events?limit=50';

      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch events');

      const data = await res.json();

      // Append events (for pagination)
      if (cursor) {
        this.events = [...this.events, ...(data.events || [])];
      } else {
        this.events = data.events || [];
      }

      this.cursor = data.cursor || null;
      this.hasMore = !!data.cursor;

      this.filterEvents();
      this.render();
    } catch (err) {
      this.setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      this.setLoading(false);
    }
  }

  private async fetchMarketsForEvent(eventTicker: string): Promise<void> {
    this.setLoading(true);
    this.setError(null);

    try {
      const res = await fetch(`/api/markets?series_ticker=${eventTicker}&limit=200`);
      if (!res.ok) throw new Error('Failed to fetch markets');

      const data = await res.json();
      this.markets = data.markets || [];
      this.render();
    } catch (err) {
      this.setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      this.setLoading(false);
    }
  }

  protected onMount(): void {
    this.fetchEvents();
  }

  protected cleanup(): void {
    // Cleanup if needed
  }
}
