/**
 * QuoteWidget - Vanilla TypeScript
 * Displays market summary information
 *
 * Features:
 * - Market title with event context
 * - Last price and 24h change
 * - YES Bid/Ask prices
 * - Volume and Open Interest
 * - Market status and expiry
 * - Auto-refresh every 5 seconds
 */

import { BaseWidget, BaseWidgetConfig } from './BaseWidget';
import { formatPrice, formatVolume, formatDate, formatChange } from '../utils/format';
import { getShortName, formatMarketDisplay } from '../utils/marketDisplay';
import type { Market, Event } from '../types/market';

export interface QuoteWidgetConfig extends BaseWidgetConfig {}

export class QuoteWidget extends BaseWidget {
  private ticker: string | null;
  private market: Market | null = null;
  private event: Event | null = null;
  private pollInterval: number | null = null;

  constructor(config: QuoteWidgetConfig) {
    super({
      ...config,
      onRefresh: () => this.fetchMarket(),
    });

    this.ticker = config.ticker || null;
  }

  protected render(): void {
    if (!this.ticker) {
      const placeholder = document.createElement('div');
      placeholder.className = 'flex flex-col items-center justify-center h-full text-slate-500 text-sm gap-2';

      const msg = document.createElement('div');
      msg.textContent = 'Select a market to view quote';
      placeholder.appendChild(msg);

      const hint = document.createElement('div');
      hint.className = 'text-xs text-slate-600';
      hint.textContent = 'Press ` or Ctrl+K and search for a market';
      placeholder.appendChild(hint);

      this.renderContent(placeholder);
      return;
    }

    if (!this.market) {
      const placeholder = document.createElement('div');
      placeholder.className = 'flex items-center justify-center h-full text-slate-500 text-sm';
      placeholder.textContent = 'Loading quote...';
      this.renderContent(placeholder);
      return;
    }

    const container = this.createQuoteView();
    this.renderContent(container);
  }

  private createQuoteView(): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'font-mono text-xs space-y-2';

    if (!this.market) return container;

    // Market title section (following CLAUDE.md rules)
    const titleSection = document.createElement('div');
    titleSection.className = 'border-b border-slate-700 pb-2 mb-2';

    if (this.event) {
      const eventTitle = document.createElement('div');
      eventTitle.className = 'text-sm font-semibold text-slate-200 mb-1';
      eventTitle.textContent = this.event.title;
      titleSection.appendChild(eventTitle);
    }

    const marketSubtitle = document.createElement('div');
    marketSubtitle.className = 'text-xs text-cyan-400';
    marketSubtitle.textContent = this.market.subtitle || getShortName(this.market);
    titleSection.appendChild(marketSubtitle);

    const tickerTag = document.createElement('div');
    tickerTag.className = 'text-[10px] font-mono text-slate-600 mt-1';
    tickerTag.textContent = `[${formatMarketDisplay(this.market).ticker}]`;
    titleSection.appendChild(tickerTag);

    container.appendChild(titleSection);

    // Price section
    const priceSection = document.createElement('div');
    priceSection.className = 'grid grid-cols-2 gap-2';

    const change = formatChange(this.market.last_price, this.market.previous_price);

    priceSection.appendChild(this.createQuoteRow('Last', formatPrice(this.market.last_price)));
    priceSection.appendChild(
      this.createQuoteRow(
        'Change',
        change.text,
        change.isPositive ? 'text-green-400' : change.isNegative ? 'text-red-400' : ''
      )
    );

    container.appendChild(priceSection);

    // Bid/Ask section
    const bidAskSection = document.createElement('div');
    bidAskSection.className = 'grid grid-cols-2 gap-2 border-t border-slate-700 pt-2';

    bidAskSection.appendChild(
      this.createQuoteRow('Bid (YES)', formatPrice(this.market.yes_bid), 'text-green-400')
    );
    bidAskSection.appendChild(
      this.createQuoteRow('Ask (YES)', formatPrice(this.market.yes_ask), 'text-red-400')
    );

    container.appendChild(bidAskSection);

    // Volume & Open Interest section
    const volumeSection = document.createElement('div');
    volumeSection.className = 'grid grid-cols-2 gap-2 border-t border-slate-700 pt-2';

    volumeSection.appendChild(
      this.createQuoteRow('Volume 24h', formatVolume(this.market.volume_24h))
    );
    volumeSection.appendChild(
      this.createQuoteRow('Open Interest', formatVolume(this.market.open_interest))
    );

    container.appendChild(volumeSection);

    // Status & Expiry section
    const statusSection = document.createElement('div');
    statusSection.className = 'grid grid-cols-2 gap-2 border-t border-slate-700 pt-2';

    const statusColor =
      this.market.status === 'open'
        ? 'text-green-400'
        : this.market.status === 'closed'
        ? 'text-red-400'
        : '';

    statusSection.appendChild(
      this.createQuoteRow('Status', this.market.status.toUpperCase(), statusColor)
    );
    statusSection.appendChild(
      this.createQuoteRow('Expires', formatDate(this.market.close_time))
    );

    container.appendChild(statusSection);

    return container;
  }

  private createQuoteRow(label: string, value: string, className: string = ''): HTMLDivElement {
    const row = document.createElement('div');
    row.className = 'flex justify-between';

    const labelEl = document.createElement('span');
    labelEl.className = 'text-slate-500';
    labelEl.textContent = label;
    row.appendChild(labelEl);

    const valueEl = document.createElement('span');
    valueEl.className = `font-bold ${className}`;
    valueEl.textContent = value;
    row.appendChild(valueEl);

    return row;
  }

  private async fetchMarket(): Promise<void> {
    if (!this.ticker) return;

    this.setLoading(true);
    this.setError(null);

    try {
      // Fetch market data
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
          // Event fetch is optional
        }
      }

      this.render();
    } catch (err) {
      this.setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      this.setLoading(false);
    }
  }

  protected onMount(): void {
    // Initial fetch
    this.fetchMarket();

    // Poll every 5 seconds
    this.pollInterval = window.setInterval(() => {
      this.fetchMarket();
    }, 5000);
  }

  protected cleanup(): void {
    if (this.pollInterval !== null) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }
}
