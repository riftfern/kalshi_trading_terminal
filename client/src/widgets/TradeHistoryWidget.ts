/**
 * TradeHistoryWidget - Vanilla TypeScript
 * Displays recent trades (fills) for a market
 *
 * Features:
 * - List of recent trades with price, quantity, side, time
 * - Color-coded by side (YES=green, NO=red)
 * - Auto-refresh every 5 seconds
 * - Mock data for demo (no real fills API yet)
 */

import { BaseWidget, BaseWidgetConfig } from './BaseWidget';
import { formatPrice, formatTime } from '../utils/format';
import type { Fill } from '../types/market';

export interface TradeHistoryWidgetConfig extends BaseWidgetConfig {}

export class TradeHistoryWidget extends BaseWidget {
  private ticker: string | null;
  private fills: Fill[] = [];
  private pollInterval: number | null = null;

  constructor(config: TradeHistoryWidgetConfig) {
    super({
      ...config,
      onRefresh: () => this.fetchFills(),
    });

    this.ticker = config.ticker || null;
  }

  protected render(): void {
    if (!this.ticker) {
      const placeholder = document.createElement('div');
      placeholder.className = 'flex flex-col items-center justify-center h-full text-slate-500 text-sm gap-2';

      const msg = document.createElement('div');
      msg.textContent = 'Select a market to view trades';
      placeholder.appendChild(msg);

      const hint = document.createElement('div');
      hint.className = 'text-xs text-slate-600';
      hint.textContent = 'Press ` or Ctrl+K and search for a market';
      placeholder.appendChild(hint);

      this.renderContent(placeholder);
      return;
    }

    const container = this.createTradeHistoryView();
    this.renderContent(container);
  }

  private createTradeHistoryView(): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'h-full overflow-y-auto font-mono text-xs';

    // Header
    const header = document.createElement('div');
    header.className = 'flex justify-between px-1 pb-1 border-b border-slate-700 text-slate-500 sticky top-0 bg-slate-900';

    const priceHeader = document.createElement('span');
    priceHeader.className = 'w-12';
    priceHeader.textContent = 'Price';
    header.appendChild(priceHeader);

    const qtyHeader = document.createElement('span');
    qtyHeader.className = 'w-10 text-right';
    qtyHeader.textContent = 'Qty';
    header.appendChild(qtyHeader);

    const sideHeader = document.createElement('span');
    sideHeader.className = 'w-8 text-center';
    sideHeader.textContent = 'Side';
    header.appendChild(sideHeader);

    const timeHeader = document.createElement('span');
    timeHeader.className = 'flex-1 text-right';
    timeHeader.textContent = 'Time';
    header.appendChild(timeHeader);

    container.appendChild(header);

    // Trades list
    if (this.fills.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'text-center text-slate-500 py-4';
      empty.textContent = 'No recent trades';
      container.appendChild(empty);
    } else {
      this.fills.forEach((fill) => {
        const row = this.createTradeRow(fill);
        container.appendChild(row);
      });
    }

    return container;
  }

  private createTradeRow(fill: Fill): HTMLDivElement {
    const row = document.createElement('div');
    row.className = 'flex justify-between px-1 py-0.5 hover:bg-slate-800/50';

    const priceColor = fill.side === 'yes' ? 'text-green-400' : 'text-red-400';

    // Price
    const price = document.createElement('span');
    price.className = `w-12 ${priceColor}`;
    price.textContent = formatPrice(fill.price);
    row.appendChild(price);

    // Quantity
    const qty = document.createElement('span');
    qty.className = 'w-10 text-right text-slate-400';
    qty.textContent = fill.count.toString();
    row.appendChild(qty);

    // Side
    const side = document.createElement('span');
    side.className = `w-8 text-center uppercase ${priceColor}`;
    side.textContent = fill.side;
    row.appendChild(side);

    // Time
    const time = document.createElement('span');
    time.className = 'flex-1 text-right text-slate-600';
    time.textContent = formatTime(fill.timestamp);
    row.appendChild(time);

    return row;
  }

  // Generate mock fills for demo (in production this would be an API call)
  private generateMockFills(count: number = 20): Fill[] {
    if (!this.ticker) return [];

    const fills: Fill[] = [];
    const now = Date.now();

    for (let i = 0; i < count; i++) {
      const side = Math.random() > 0.5 ? 'yes' : 'no';
      const price = Math.floor(30 + Math.random() * 40);

      fills.push({
        ticker: this.ticker,
        trade_id: `trade-${i}-${Date.now()}`,
        price,
        count: Math.floor(1 + Math.random() * 50),
        side,
        action: Math.random() > 0.5 ? 'buy' : 'sell',
        timestamp: new Date(now - i * 30000 - Math.random() * 30000).toISOString(),
        is_taker: Math.random() > 0.5,
      });
    }

    return fills;
  }

  private async fetchFills(): Promise<void> {
    if (!this.ticker) return;

    this.setLoading(true);
    this.setError(null);

    try {
      // In production, this would be an API call
      // For now, generate mock data
      await new Promise(resolve => setTimeout(resolve, 300));
      this.fills = this.generateMockFills();
      this.render();
    } catch (err) {
      this.setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      this.setLoading(false);
    }
  }

  protected onMount(): void {
    // Initial fetch
    this.fetchFills();

    // Poll every 5 seconds
    this.pollInterval = window.setInterval(() => {
      this.fetchFills();
    }, 5000);
  }

  protected cleanup(): void {
    if (this.pollInterval !== null) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }
}
