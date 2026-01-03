/**
 * WatchlistWidget - Vanilla TypeScript
 * Personal watchlist of tickers with quick actions
 *
 * Features:
 * - Add/remove tickers from watchlist
 * - Persistent storage (localStorage)
 * - Current price and change display
 * - Quick actions (chart, remove)
 * - Click to set active ticker
 */

import { BaseWidget, BaseWidgetConfig } from './BaseWidget';
import { formatPrice, formatChange } from '../utils/format';
import { setCurrentTicker, addWidget } from '../services/workspaceStore';
import type { Market } from '../types/market';

export interface WatchlistWidgetConfig extends BaseWidgetConfig {}

const WATCHLIST_KEY = 'godel-watchlist';

export class WatchlistWidget extends BaseWidget {
  private watchlist: string[] = [];
  private markets: Record<string, Market> = {};
  private addMode: boolean = false;
  private pollInterval: number | null = null;
  private addInput: HTMLInputElement | null = null;
  private listContainer: HTMLDivElement | null = null;

  constructor(config: WatchlistWidgetConfig) {
    super(config);

    // Add header actions after super() is called
    const rightSide = this.headerElement.querySelector('.shrink-0');
    if (rightSide) {
      const headerActions = this.createHeaderActions();
      rightSide.insertBefore(headerActions, rightSide.firstChild);
    }

    this.loadWatchlist();
  }

  private loadWatchlist(): void {
    try {
      const saved = localStorage.getItem(WATCHLIST_KEY);
      this.watchlist = saved ? JSON.parse(saved) : [];
    } catch {
      this.watchlist = [];
    }
  }

  private saveWatchlist(): void {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(this.watchlist));
  }

  private createHeaderActions(): HTMLElement {
    const container = document.createElement('div');

    const addBtn = document.createElement('button');
    addBtn.className = 'p-1 hover:bg-slate-700 rounded transition-colors';
    addBtn.title = 'Add ticker';
    addBtn.innerHTML = `
      <svg class="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
    `;
    addBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.addMode = true;
      this.render();
      // Focus input after render
      setTimeout(() => this.addInput?.focus(), 0);
    });

    container.appendChild(addBtn);
    return container;
  }

  protected render(): void {
    const container = document.createElement('div');
    container.className = 'h-full flex flex-col font-mono text-xs';

    // Add ticker input
    if (this.addMode) {
      const addSection = this.createAddSection();
      container.appendChild(addSection);
    }

    // Watchlist items
    this.listContainer = document.createElement('div');
    this.listContainer.className = 'flex-1 overflow-y-auto -mx-2';

    if (this.watchlist.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'text-center text-slate-500 py-4';

      const msg = document.createElement('p');
      msg.textContent = 'No tickers in watchlist';
      empty.appendChild(msg);

      const hint = document.createElement('p');
      hint.className = 'text-xs mt-1';
      hint.textContent = 'Click + to add';
      empty.appendChild(hint);

      this.listContainer.appendChild(empty);
    } else {
      this.watchlist.forEach((ticker) => {
        const row = this.createWatchlistRow(ticker);
        this.listContainer!.appendChild(row);
      });
    }

    container.appendChild(this.listContainer);

    this.renderContent(container);
  }

  private createAddSection(): HTMLDivElement {
    const section = document.createElement('div');
    section.className = 'flex gap-1 mb-2';

    this.addInput = document.createElement('input');
    this.addInput.type = 'text';
    this.addInput.placeholder = 'Enter ticker...';
    this.addInput.className = [
      'flex-1 px-2 py-1',
      'bg-slate-800 border border-slate-700 rounded',
      'text-slate-300 placeholder:text-slate-600',
      'outline-none focus:border-cyan-500/50',
    ].join(' ');

    this.addInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.handleAdd();
      } else if (e.key === 'Escape') {
        this.addMode = false;
        this.render();
      }
    });

    section.appendChild(this.addInput);

    const addBtn = document.createElement('button');
    addBtn.className = 'px-2 py-1 bg-cyan-900/50 text-cyan-400 rounded hover:bg-cyan-800/50';
    addBtn.textContent = 'Add';
    addBtn.addEventListener('click', () => this.handleAdd());
    section.appendChild(addBtn);

    return section;
  }

  private createWatchlistRow(ticker: string): HTMLDivElement {
    const row = document.createElement('div');
    row.className = [
      'flex items-center justify-between px-2 py-1.5',
      'hover:bg-slate-800/50 cursor-pointer',
      'border-b border-slate-800',
    ].join(' ');

    // Left side: ticker and price
    const leftSide = document.createElement('div');
    leftSide.className = 'flex items-center gap-2';

    const tickerSpan = document.createElement('span');
    tickerSpan.className = 'text-cyan-400 font-bold';
    tickerSpan.textContent = ticker;
    leftSide.appendChild(tickerSpan);

    const market = this.markets[ticker];
    if (market) {
      const change = formatChange(market.last_price, market.previous_price);
      const priceSpan = document.createElement('span');
      priceSpan.className = change.isPositive
        ? 'text-green-400'
        : change.isNegative
        ? 'text-red-400'
        : 'text-slate-400';
      priceSpan.textContent = formatPrice(market.last_price);
      leftSide.appendChild(priceSpan);
    }

    row.appendChild(leftSide);

    // Right side: actions
    const rightSide = document.createElement('div');
    rightSide.className = 'flex items-center gap-1';

    // Chart button
    const chartBtn = document.createElement('button');
    chartBtn.className = 'p-1 hover:bg-slate-700 rounded';
    chartBtn.title = 'Open chart';
    chartBtn.innerHTML = `
      <svg class="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    `;
    chartBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      addWidget('chart', ticker);
    });
    rightSide.appendChild(chartBtn);

    // Remove button
    const removeBtn = document.createElement('button');
    removeBtn.className = 'p-1 hover:bg-red-900/50 rounded';
    removeBtn.title = 'Remove';
    removeBtn.innerHTML = `
      <svg class="w-3 h-3 text-slate-400 hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    `;
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleRemove(ticker);
    });
    rightSide.appendChild(removeBtn);

    row.appendChild(rightSide);

    // Click to select ticker
    row.addEventListener('click', () => {
      setCurrentTicker(ticker);
    });

    return row;
  }

  private handleAdd(): void {
    if (!this.addInput) return;

    const ticker = this.addInput.value.trim().toUpperCase();
    if (ticker && !this.watchlist.includes(ticker)) {
      this.watchlist.push(ticker);
      this.saveWatchlist();
    }

    this.addMode = false;
    this.render();
  }

  private handleRemove(ticker: string): void {
    this.watchlist = this.watchlist.filter((t) => t !== ticker);
    this.saveWatchlist();
    this.render();
  }

  private async fetchMarketData(): Promise<void> {
    if (this.watchlist.length === 0) return;

    this.setLoading(true);
    this.setError(null);

    try {
      // Fetch market data for all watchlist tickers
      const promises = this.watchlist.map(async (ticker) => {
        try {
          const res = await fetch(`/api/markets?ticker=${ticker}`);
          if (!res.ok) return null;

          const data = await res.json();
          const markets = data.markets || [];
          const market = markets.find((m: Market) => m.ticker === ticker);
          return market ? { ticker, market } : null;
        } catch {
          return null;
        }
      });

      const results = await Promise.all(promises);

      // Update markets map
      results.forEach((result) => {
        if (result) {
          this.markets[result.ticker] = result.market;
        }
      });

      this.render();
    } catch (err) {
      this.setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      this.setLoading(false);
    }
  }

  protected onMount(): void {
    // Initial fetch
    this.fetchMarketData();

    // Poll every 10 seconds
    this.pollInterval = window.setInterval(() => {
      this.fetchMarketData();
    }, 10000);
  }

  protected cleanup(): void {
    if (this.pollInterval !== null) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }
}
