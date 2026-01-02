/**
 * Vanilla TypeScript Command Palette
 * Follows CLAUDE.md architectural principles:
 * - No frameworks
 * - Standard DOM manipulation
 * - Class-based component managing its own DOM
 */

export class CommandPalette {
  private modal: HTMLDivElement;
  private overlay: HTMLDivElement;
  private input: HTMLInputElement;
  private isOpen: boolean = false;

  constructor() {
    this.overlay = this.createOverlay();
    this.modal = this.createModal();
    this.input = this.createInput();

    this.modal.appendChild(this.input);
    this.overlay.appendChild(this.modal);
    document.body.appendChild(this.overlay);

    this.attachEventListeners();
  }

  private createOverlay(): HTMLDivElement {
    const overlay = document.createElement('div');
    overlay.className = 'command-palette-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.75);
      display: none;
      align-items: flex-start;
      justify-content: center;
      padding-top: 20vh;
      z-index: 9999;
    `;
    return overlay;
  }

  private createModal(): HTMLDivElement {
    const modal = document.createElement('div');
    modal.className = 'command-palette-modal';
    modal.style.cssText = `
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 8px;
      width: 600px;
      max-width: 90vw;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    `;
    return modal;
  }

  private createInput(): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Enter ticker symbol...';
    input.className = 'command-palette-input';
    input.style.cssText = `
      width: 100%;
      padding: 16px 20px;
      background: transparent;
      border: none;
      outline: none;
      color: #e0e0e0;
      font-family: 'JetBrains Mono', monospace;
      font-size: 16px;
      box-sizing: border-box;
    `;
    input.style.setProperty('caret-color', '#00d4ff');

    return input;
  }

  private attachEventListeners(): void {
    // Listen for backtick key to open palette
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === '`' && !this.isOpen) {
        e.preventDefault();
        this.open();
      } else if (e.key === 'Escape' && this.isOpen) {
        e.preventDefault();
        this.close();
      }
    });

    // Handle input submission
    this.input.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.handleSubmit();
      }
    });

    // Close on overlay click
    this.overlay.addEventListener('click', (e: MouseEvent) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });
  }

  private open(): void {
    this.isOpen = true;
    this.overlay.style.display = 'flex';
    this.input.value = '';

    // Focus input after a brief delay to ensure modal is visible
    setTimeout(() => {
      this.input.focus();
    }, 50);
  }

  private close(): void {
    this.isOpen = false;
    this.overlay.style.display = 'none';
    this.input.value = '';
  }

  private handleSubmit(): void {
    const ticker = this.input.value.trim().toUpperCase();

    if (ticker) {
      console.log('Ticker entered:', ticker);
      this.close();
    }
  }

  public destroy(): void {
    this.overlay.remove();
  }
}
