/**
 * OrderBookWidget - Vanilla TypeScript
 * Displays YES bids and asks with volume bars
 *
 * Features:
 * - Polls orderbook data every 2 seconds
 * - Shows YES bids (green) and asks (red)
 * - Volume visualization with horizontal bars
 * - Spread and midpoint display
 * - Handles reciprocal Kalshi orderbook format
 */

import { BaseWidget, BaseWidgetConfig } from './BaseWidget';
import { formatPrice, formatVolume } from '../utils/format';
import { getShortName, formatMarketDisplay } from '../utils/marketDisplay';
import type { Market, Event } from '../types/market';

// Hydrated orderbook type (transformed by backend)
interface HydratedOrderbook {
  bids: [number, number][];
  asks: [number, number][];
  spread: number;
  midpoint: number;
  bestBid: number | null;
  bestAsk: number | null;
  totalBidQty?: number;
  totalAskQty?: number;
  maxQty?: number;
}

export interface OrderBookWidgetConfig extends BaseWidgetConfig {
  depth?: number;
}

export class OrderBookWidget extends BaseWidget {
  private ticker: string | null;
  private depth: number;
  private orderbook: HydratedOrderbook | null = null;
  private market: Market | null = null;
  private event: Event | null = null;
  private pollInterval: number | null = null;
  private perspective: 'yes' | 'no' = 'yes'; // YES-centric by default

  constructor(config: OrderBookWidgetConfig) {
    super({
      ...config,
      onRefresh: () => this.fetchOrderbook(),
    });

    this.ticker = config.ticker || null;
    this.depth = config.depth || 10;
  }

  protected render(): void {
    if (!this.ticker) {
      const placeholder = document.createElement('div');
      placeholder.className = 'flex flex-col items-center justify-center h-full text-slate-500 text-sm gap-2';

      const msg = document.createElement('div');
      msg.textContent = 'Select a market to view orderbook';
      placeholder.appendChild(msg);

      const hint = document.createElement('div');
      hint.className = 'text-xs text-slate-600';
      hint.textContent = 'Press ` or Ctrl+K and search for a market';
      placeholder.appendChild(hint);

      this.renderContent(placeholder);
      return;
    }

    // Backend already transformed and aggregated the orderbook
    if (!this.orderbook || !this.market) {
      const placeholder = document.createElement('div');
      placeholder.className = 'flex items-center justify-center h-full text-slate-500 text-sm';
      placeholder.textContent = 'Loading orderbook...';
      this.renderContent(placeholder);
      return;
    }

    const container = this.createOrderbookView(this.orderbook);
    this.renderContent(container);
  }

  private createOrderbookView(orderbook: HydratedOrderbook): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'flex flex-col h-full font-mono text-xs';

    // Market title section (following CLAUDE.md rules)
    const titleSection = this.createTitleSection();
    container.appendChild(titleSection);

    // Header row with perspective toggle
    const header = document.createElement('div');
    header.className = 'flex items-center border-b border-slate-700 pb-1 mb-1';

    const bidsHeader = document.createElement('div');
    bidsHeader.className = 'flex-1 text-center text-green-400 font-bold';
    bidsHeader.textContent = this.perspective === 'yes' ? 'BIDS (YES)' : 'ASKS (NO)';
    header.appendChild(bidsHeader);

    // Perspective toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'px-2 py-0.5 text-xs bg-slate-800 hover:bg-slate-700 rounded border border-slate-600 transition-colors';
    toggleBtn.textContent = `${this.perspective.toUpperCase()}`;
    toggleBtn.title = 'Toggle YES/NO perspective';
    toggleBtn.addEventListener('click', () => {
      this.perspective = this.perspective === 'yes' ? 'no' : 'yes';
      this.render();
    });
    header.appendChild(toggleBtn);

    const asksHeader = document.createElement('div');
    asksHeader.className = 'flex-1 text-center text-red-400 font-bold';
    asksHeader.textContent = this.perspective === 'yes' ? 'ASKS' : 'BIDS (YES)';
    header.appendChild(asksHeader);

    container.appendChild(header);

    // Orderbook levels
    const levelsContainer = document.createElement('div');
    levelsContainer.className = 'flex flex-1 gap-2 overflow-hidden';

    // Bids column
    const bidsColumn = this.createBidsColumn(orderbook);
    levelsContainer.appendChild(bidsColumn);

    // Asks column
    const asksColumn = this.createAsksColumn(orderbook);
    levelsContainer.appendChild(asksColumn);

    container.appendChild(levelsContainer);

    // Footer with spread info
    const footer = document.createElement('div');
    footer.className = 'border-t border-slate-700 pt-1 mt-1 text-slate-500 flex justify-between';

    const spread = document.createElement('span');
    spread.textContent = `Spread: ${formatPrice(orderbook.spread)}`;
    footer.appendChild(spread);

    const mid = document.createElement('span');
    mid.textContent = `Mid: ${formatPrice(orderbook.midpoint)}`;
    footer.appendChild(mid);

    container.appendChild(footer);

    return container;
  }

  private createBidsColumn(orderbook: HydratedOrderbook): HTMLDivElement {
    const column = document.createElement('div');
    column.className = 'flex-1 flex flex-col';

    if (orderbook.bids.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'text-slate-500 text-center py-2';
      empty.textContent = 'No bids';
      column.appendChild(empty);
      return column;
    }

    const maxQty = orderbook.maxQty || 1;

    orderbook.bids.forEach(([price, qty]) => {
      const level = document.createElement('div');
      level.className = 'flex justify-between px-2 py-0.5 relative';

      // Volume bar
      const bar = document.createElement('div');
      bar.className = 'absolute inset-0 bg-green-900/30';
      bar.style.width = `${(qty / maxQty) * 100}%`;
      level.appendChild(bar);

      // Quantity
      const qtySpan = document.createElement('span');
      qtySpan.className = 'relative z-10';
      qtySpan.textContent = formatVolume(qty);
      level.appendChild(qtySpan);

      // Price
      const priceSpan = document.createElement('span');
      priceSpan.className = 'relative z-10 text-green-400';
      priceSpan.textContent = formatPrice(price);
      level.appendChild(priceSpan);

      column.appendChild(level);
    });

    return column;
  }

  private createAsksColumn(orderbook: HydratedOrderbook): HTMLDivElement {
    const column = document.createElement('div');
    column.className = 'flex-1 flex flex-col';

    if (orderbook.asks.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'text-slate-500 text-center py-2';
      empty.textContent = 'No asks';
      column.appendChild(empty);
      return column;
    }

    const maxQty = orderbook.maxQty || 1;

    orderbook.asks.forEach(([price, qty]) => {
      const level = document.createElement('div');
      level.className = 'flex justify-between px-2 py-0.5 relative';

      // Volume bar (right-aligned)
      const bar = document.createElement('div');
      bar.className = 'absolute inset-0 right-0 left-auto bg-red-900/30';
      bar.style.width = `${(qty / maxQty) * 100}%`;
      level.appendChild(bar);

      // Price
      const priceSpan = document.createElement('span');
      priceSpan.className = 'relative z-10 text-red-400';
      priceSpan.textContent = formatPrice(price);
      level.appendChild(priceSpan);

      // Quantity
      const qtySpan = document.createElement('span');
      qtySpan.className = 'relative z-10';
      qtySpan.textContent = formatVolume(qty);
      level.appendChild(qtySpan);

      column.appendChild(level);
    });

    return column;
  }

  private createTitleSection(): HTMLDivElement {
    const section = document.createElement('div');
    section.className = 'border-b border-slate-700 pb-2 mb-2';

    if (this.market) {
      // Event title (primary heading)
      if (this.event) {
        const eventTitle = document.createElement('div');
        eventTitle.className = 'text-sm font-semibold text-slate-200 mb-1';
        eventTitle.textContent = this.event.title;
        section.appendChild(eventTitle);
      }

      // Market subtitle / outcome (sub-heading)
      const marketSubtitle = document.createElement('div');
      marketSubtitle.className = 'text-xs text-cyan-400';
      marketSubtitle.textContent = this.market.subtitle || getShortName(this.market);
      section.appendChild(marketSubtitle);

      // Bloomberg-style ticker (secondary, monospace)
      const tickerTag = document.createElement('div');
      tickerTag.className = 'text-[10px] font-mono text-slate-600 mt-1';
      tickerTag.textContent = `[${formatMarketDisplay(this.market).ticker}]`;
      section.appendChild(tickerTag);
    }

    return section;
  }

  private async fetchOrderbook(): Promise<void> {
    if (!this.ticker) return;

    this.setLoading(true);
    this.setError(null);

    try {
      // Fetch market data to get event ticker
      const marketRes = await fetch(`/api/markets/${this.ticker}`);
      if (!marketRes.ok) throw new Error('Failed to fetch market');

      this.market = await marketRes.json();

      // Fetch event data for context
      if (this.market?.event_ticker) {
        try {
          const eventRes = await fetch(`/api/events/${this.market.event_ticker}`);
          if (eventRes.ok) {
            this.event = await eventRes.json();
          }
        } catch {
          // Event fetch is optional, continue without it
        }
      }

      // Fetch orderbook (backend returns hydrated data with asks)
      const obRes = await fetch(`/api/markets/${this.ticker}/orderbook?depth=${this.depth}`);
      if (!obRes.ok) throw new Error('Failed to fetch orderbook');

      this.orderbook = await obRes.json();
      this.render();
    } catch (err) {
      this.setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      this.setLoading(false);
    }
  }

  protected onMount(): void {
    // Initial fetch
    this.fetchOrderbook();

    // Poll every 2 seconds
    this.pollInterval = window.setInterval(() => {
      this.fetchOrderbook();
    }, 2000);
  }

  protected cleanup(): void {
    if (this.pollInterval !== null) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }
}
