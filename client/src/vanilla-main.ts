/**
 * Vanilla TypeScript Entry Point
 * Following CLAUDE.md architectural principles
 */

import { CommandPalette } from './components/CommandPalette';

// Initialize the command palette when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const commandPalette = new CommandPalette();

  console.log('Kalshi Trading Terminal - Vanilla Command Palette initialized');
  console.log('Press backtick (`) to open command palette');

  // Expose to window for debugging (optional)
  (window as any).__commandPalette = commandPalette;
});
