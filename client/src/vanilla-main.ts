/**
 * Vanilla TypeScript Entry Point
 * Following CLAUDE.md architectural principles and REFACTOR.MD structure
 *
 * This is the main entry point for the vanilla TypeScript application.
 * It initializes all components and wires up the application structure.
 */

import { Header } from './components/Header';
import { GridLayout } from './components/GridLayout';
import { CommandPalette } from './components/CommandPalette';
import {
  workspaceStore,
  addWidget,
  removeWidget,
  setCurrentTicker,
} from './services/workspaceStore';

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Get container elements
  const headerContainer = document.getElementById('header');
  const mainContainer = document.getElementById('main');

  if (!headerContainer || !mainContainer) {
    console.error('Required containers not found');
    return;
  }

  // Initialize and mount the header
  const header = new Header();
  header.mount(headerContainer);

  // Initialize and mount the grid layout
  const gridLayout = new GridLayout();
  gridLayout.mount(mainContainer);

  // Initialize and mount the command palette (modal overlay)
  const commandPalette = new CommandPalette();
  commandPalette.mount(document.body);

  // Subscribe to workspace store changes
  const unsubscribe = workspaceStore.subscribe((event) => {
    const { newState } = event.detail;
    console.log('Workspace state updated:', newState);

    // In a full implementation, this would update the grid layout
    // and re-render widgets based on the new state
  });

  // Expose to window for debugging
  (window as any).__header = header;
  (window as any).__gridLayout = gridLayout;
  (window as any).__commandPalette = commandPalette;
  (window as any).__workspaceStore = workspaceStore;
  (window as any).__addWidget = addWidget;
  (window as any).__removeWidget = removeWidget;
  (window as any).__setCurrentTicker = setCurrentTicker;
  (window as any).__unsubscribe = unsubscribe;

  console.log('┌─────────────────────────────────────────────┐');
  console.log('│  Kalshi Trading Terminal - Vanilla TS      │');
  console.log('└─────────────────────────────────────────────┘');
  console.log('');
  console.log('✓ Header mounted');
  console.log('✓ Grid layout mounted');
  console.log('✓ Command palette ready');
  console.log('');
  console.log('Keyboard Shortcuts:');
  console.log('  • Cmd+K (Mac) / Ctrl+K (Win/Linux) - Open command palette');
  console.log('  • ` (backtick)                     - Open command palette');
  console.log('  • Click "Search markets..." button - Open command palette');
  console.log('  • Arrow Keys                       - Navigate results');
  console.log('  • Enter                            - Execute command');
  console.log('  • Escape                           - Close palette');
  console.log('');
  console.log('Available in console:');
  console.log('  • __header         - Header component instance');
  console.log('  • __gridLayout     - Grid layout component instance');
  console.log('  • __commandPalette - Command palette instance');
  console.log('  • __workspaceStore - Workspace store instance');
  console.log('  • __unsubscribe    - Unsubscribe from store changes');
  console.log('');
});
