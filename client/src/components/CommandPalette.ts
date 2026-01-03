/**
 * Vanilla TypeScript Command Palette
 * Follows CLAUDE.md architectural principles and REFACTOR.md specifications
 *
 * Features:
 * - Extends BaseComponent for standardized lifecycle
 * - Uses Tailwind for styling
 * - Supports Cmd+K (Mac) and Ctrl+K (Windows/Linux) shortcuts
 * - Integrates with workspace store for actions
 * - No framework dependencies
 */

import { BaseComponent } from './BaseComponent';
import { workspaceStore, addWidget, setCurrentTicker } from '../services/workspaceStore';
import type { WidgetType } from '../types/widget';

interface Command {
  id: string;
  label: string;
  description: string;
  action: () => void;
  category: 'widget' | 'navigation' | 'market';
}

export class CommandPalette extends BaseComponent<HTMLDivElement> {
  private overlay: HTMLDivElement;
  private modal: HTMLDivElement;
  private input: HTMLInputElement;
  private resultsContainer: HTMLDivElement;
  private isOpen: boolean = false;
  private commands: Command[] = [];
  private filteredCommands: Command[] = [];
  private selectedIndex: number = 0;

  constructor() {
    super('div');
    this.element.className = 'command-palette-container';

    this.overlay = this.createOverlay();
    this.modal = this.createModal();
    this.input = this.createInput();
    this.resultsContainer = this.createResultsContainer();

    this.modal.appendChild(this.input);
    this.modal.appendChild(this.resultsContainer);
    this.overlay.appendChild(this.modal);
    this.element.appendChild(this.overlay);

    this.initializeCommands();
    this.attachEventListeners();
  }

  protected render(): void {
    // Render is handled by createX methods and updateResults
  }

  private createOverlay(): HTMLDivElement {
    const overlay = document.createElement('div');
    overlay.className = [
      'fixed inset-0',
      'bg-black/75 backdrop-blur-sm',
      'hidden',
      'items-start justify-center',
      'pt-[20vh]',
      'z-[9999]',
      'animate-in fade-in duration-150',
    ].join(' ');
    return overlay;
  }

  private createModal(): HTMLDivElement {
    const modal = document.createElement('div');
    modal.className = [
      'bg-slate-900',
      'border border-slate-700',
      'rounded-lg',
      'w-[600px] max-w-[90vw]',
      'shadow-2xl shadow-black/50',
      'overflow-hidden',
      'animate-in slide-in-from-top-4 duration-200',
    ].join(' ');
    return modal;
  }

  private createInput(): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Type a command or ticker symbol...';
    input.className = [
      'w-full',
      'px-5 py-4',
      'bg-transparent',
      'border-none outline-none',
      'text-slate-100 placeholder-slate-500',
      'font-mono text-base',
      'caret-cyan-400',
    ].join(' ');
    return input;
  }

  private createResultsContainer(): HTMLDivElement {
    const container = document.createElement('div');
    container.className = [
      'max-h-[400px]',
      'overflow-y-auto',
      'border-t border-slate-700',
    ].join(' ');
    return container;
  }

  private initializeCommands(): void {
    // Widget commands
    const widgetTypes: WidgetType[] = [
      'orderbook',
      'chart',
      'quote',
      'market-selector',
      'watchlist',
      'trade-history',
    ];

    widgetTypes.forEach((type) => {
      this.commands.push({
        id: `add-${type}`,
        label: `Add ${this.formatWidgetName(type)}`,
        description: `Add a new ${type} widget to the workspace`,
        category: 'widget',
        action: () => {
          addWidget(type);
          this.close();
        },
      });
    });

    // Market/ticker search command
    this.commands.push({
      id: 'search-ticker',
      label: 'Search Ticker',
      description: 'Search for a market ticker symbol',
      category: 'market',
      action: () => {
        // This will be handled by direct ticker input
        this.close();
      },
    });
  }

  private formatWidgetName(type: WidgetType): string {
    return type
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private attachEventListeners(): void {
    // Global keyboard shortcuts: Cmd+K (Mac) or Ctrl+K (Windows/Linux), or backtick
    document.addEventListener('keydown', this.handleGlobalKeydown);

    // Input handling
    this.input.addEventListener('input', this.handleInput);
    this.input.addEventListener('keydown', this.handleInputKeydown);

    // Close on overlay click
    this.overlay.addEventListener('click', (e: MouseEvent) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });
  }

  private handleGlobalKeydown = (e: KeyboardEvent): void => {
    // Cmd+K (Mac) or Ctrl+K (Windows/Linux)
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      if (!this.isOpen) {
        this.open();
      }
      return;
    }

    // Backtick key (alternative shortcut)
    if (e.key === '`' && !this.isOpen) {
      e.preventDefault();
      this.open();
      return;
    }

    // Escape key to close
    if (e.key === 'Escape' && this.isOpen) {
      e.preventDefault();
      this.close();
    }
  };

  private handleInput = (): void => {
    const query = this.input.value.trim().toLowerCase();

    if (!query) {
      this.filteredCommands = this.commands;
    } else {
      // Simple fuzzy filter
      this.filteredCommands = this.commands.filter(
        (cmd) =>
          cmd.label.toLowerCase().includes(query) ||
          cmd.description.toLowerCase().includes(query)
      );

      // If input looks like a ticker (uppercase letters/numbers), add ticker command
      if (/^[A-Z0-9-]+$/i.test(this.input.value)) {
        this.filteredCommands.unshift({
          id: 'goto-ticker',
          label: `Go to ${this.input.value.toUpperCase()}`,
          description: 'Set as current ticker and add quote widget',
          category: 'market',
          action: () => {
            const ticker = this.input.value.trim().toUpperCase();
            setCurrentTicker(ticker);
            addWidget('quote', ticker);
            console.log('Ticker selected:', ticker);
            this.close();
          },
        });
      }
    }

    this.selectedIndex = 0;
    this.updateResults();
  };

  private handleInputKeydown = (e: KeyboardEvent): void => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.selectedIndex = Math.min(
          this.selectedIndex + 1,
          this.filteredCommands.length - 1
        );
        this.updateResults();
        break;

      case 'ArrowUp':
        e.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
        this.updateResults();
        break;

      case 'Enter':
        e.preventDefault();
        this.executeSelectedCommand();
        break;

      case 'Escape':
        e.preventDefault();
        this.close();
        break;
    }
  };

  private updateResults(): void {
    // Clear previous results
    this.resultsContainer.innerHTML = '';

    if (this.filteredCommands.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'px-5 py-8 text-center text-slate-500 text-sm';
      empty.textContent = 'No commands found';
      this.resultsContainer.appendChild(empty);
      return;
    }

    // Group by category
    const grouped = this.groupByCategory(this.filteredCommands);

    Object.entries(grouped).forEach(([category, commands]) => {
      // Category header
      const header = document.createElement('div');
      header.className = 'px-5 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-800/50';
      header.textContent = category;
      this.resultsContainer.appendChild(header);

      // Commands
      commands.forEach((cmd, index) => {
        const globalIndex = this.filteredCommands.indexOf(cmd);
        const item = this.createResultItem(cmd, globalIndex === this.selectedIndex);
        item.addEventListener('click', () => {
          cmd.action();
        });
        item.addEventListener('mouseenter', () => {
          this.selectedIndex = globalIndex;
          this.updateResults();
        });
        this.resultsContainer.appendChild(item);
      });
    });

    // Scroll selected item into view
    const selectedElement = this.resultsContainer.querySelector('[data-selected="true"]');
    selectedElement?.scrollIntoView({ block: 'nearest' });
  }

  private createResultItem(cmd: Command, isSelected: boolean): HTMLDivElement {
    const item = document.createElement('div');
    item.className = [
      'px-5 py-3',
      'cursor-pointer',
      'transition-colors',
      isSelected ? 'bg-cyan-900/30 border-l-2 border-cyan-400' : 'border-l-2 border-transparent hover:bg-slate-800/50',
    ].join(' ');
    item.setAttribute('data-selected', String(isSelected));

    const label = document.createElement('div');
    label.className = 'text-sm font-medium text-slate-100';
    label.textContent = cmd.label;

    const description = document.createElement('div');
    description.className = 'text-xs text-slate-500 mt-1';
    description.textContent = cmd.description;

    item.appendChild(label);
    item.appendChild(description);

    return item;
  }

  private groupByCategory(commands: Command[]): Record<string, Command[]> {
    return commands.reduce(
      (acc, cmd) => {
        if (!acc[cmd.category]) {
          acc[cmd.category] = [];
        }
        acc[cmd.category].push(cmd);
        return acc;
      },
      {} as Record<string, Command[]>
    );
  }

  private executeSelectedCommand(): void {
    const cmd = this.filteredCommands[this.selectedIndex];
    if (cmd) {
      cmd.action();
    }
  }

  private open(): void {
    this.isOpen = true;
    this.overlay.classList.remove('hidden');
    this.overlay.classList.add('flex');
    this.input.value = '';
    this.filteredCommands = this.commands;
    this.selectedIndex = 0;
    this.updateResults();

    // Focus input after a brief delay
    setTimeout(() => {
      this.input.focus();
    }, 50);
  }

  private close(): void {
    this.isOpen = false;
    this.overlay.classList.remove('flex');
    this.overlay.classList.add('hidden');
    this.input.value = '';
    this.filteredCommands = [];
    this.resultsContainer.innerHTML = '';
  }

  protected cleanup(): void {
    document.removeEventListener('keydown', this.handleGlobalKeydown);
  }
}
