/**
 * WidgetFactory - Creates widget instances based on type
 * Follows the factory pattern for dynamic widget creation
 */

import { OrderBookWidget } from './OrderBookWidget';
import { QuoteWidget } from './QuoteWidget';
import { MarketSelectorWidget } from './MarketSelectorWidget';
import { TradeHistoryWidget } from './TradeHistoryWidget';
import { WatchlistWidget } from './WatchlistWidget';
import { BaseWidget } from './BaseWidget';
import type { WidgetInstance } from '../types/widget';
import { removeWidget } from '../services/workspaceStore';

/**
 * Create a widget component based on the widget instance configuration
 */
export function createWidget(widget: WidgetInstance): BaseWidget {
  const baseConfig = {
    id: widget.id,
    title: widget.title,
    ticker: widget.ticker,
    onRemove: () => removeWidget(widget.id),
  };

  switch (widget.type) {
    case 'orderbook':
      return new OrderBookWidget({
        ...baseConfig,
        depth: widget.config.depth || 10,
      });

    case 'quote':
      return new QuoteWidget(baseConfig);

    case 'chart':
      // TODO: Implement ChartWidget
      return createPlaceholderWidget(widget);

    case 'market-selector':
      return new MarketSelectorWidget(baseConfig);

    case 'watchlist':
      return new WatchlistWidget(baseConfig);

    case 'trade-history':
      return new TradeHistoryWidget(baseConfig);

    default:
      return createPlaceholderWidget(widget);
  }
}

/**
 * Create a placeholder widget for unimplemented widget types
 */
function createPlaceholderWidget(widget: WidgetInstance): BaseWidget {
  class PlaceholderWidget extends BaseWidget {
    protected render(): void {
      const container = document.createElement('div');
      container.className = 'flex items-center justify-center h-full text-slate-500 text-sm';
      container.textContent = `${widget.type} widget (not implemented yet)`;
      this.renderContent(container);
    }
  }

  return new PlaceholderWidget({
    id: widget.id,
    title: widget.title,
    ticker: widget.ticker,
    onRemove: () => removeWidget(widget.id),
  });
}
