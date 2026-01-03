/**
 * Base Component Class for Vanilla TypeScript Components
 * Follows REFACTOR.md Phase 2.1 - Standardize component structure
 *
 * All UI components should extend this class to ensure consistent lifecycle
 * management and DOM manipulation patterns.
 */

/**
 * Abstract base class for all UI components
 *
 * Provides a standardized structure for:
 * - DOM element creation and management
 * - Mounting/unmounting lifecycle
 * - Rendering logic
 * - Event handling cleanup
 *
 * @example
 * ```typescript
 * class MyButton extends BaseComponent<HTMLButtonElement> {
 *   constructor(text: string) {
 *     super('button');
 *     this.element.textContent = text;
 *     this.render();
 *   }
 *
 *   protected render(): void {
 *     this.element.className = 'bg-blue-500 text-white px-4 py-2 rounded';
 *     this.element.addEventListener('click', () => {
 *       console.log('Clicked!');
 *     });
 *   }
 *
 *   protected cleanup(): void {
 *     // Remove event listeners if needed
 *   }
 * }
 *
 * const button = new MyButton('Click me');
 * button.mount(document.body);
 * ```
 */
export abstract class BaseComponent<T extends HTMLElement = HTMLElement> {
  protected element: T;
  private isMounted: boolean = false;

  /**
   * Create a new component with the specified HTML tag
   * @param tag - HTML tag name (default: 'div')
   */
  constructor(tag: keyof HTMLElementTagNameMap = 'div') {
    this.element = document.createElement(tag) as T;
  }

  /**
   * Get the underlying DOM element
   * Useful for accessing the element outside the component
   */
  public getDOMNode(): T {
    return this.element;
  }

  /**
   * Mount this component to a parent element
   * @param parent - The parent element to append this component to
   */
  public mount(parent: HTMLElement): void {
    if (this.isMounted) {
      console.warn('Component is already mounted');
      return;
    }

    parent.appendChild(this.element);
    this.isMounted = true;
    this.onMount();
  }

  /**
   * Unmount this component from the DOM
   * Calls cleanup before removing
   */
  public unmount(): void {
    if (!this.isMounted) {
      console.warn('Component is not mounted');
      return;
    }

    this.cleanup();
    this.element.remove();
    this.isMounted = false;
    this.onUnmount();
  }

  /**
   * Check if the component is currently mounted
   */
  public isMountedToDom(): boolean {
    return this.isMounted;
  }

  /**
   * Update the component's display
   * Subclasses can call this to trigger a re-render
   */
  public update(): void {
    this.render();
  }

  /**
   * Add a CSS class to the component's root element
   */
  protected addClass(...classes: string[]): void {
    this.element.classList.add(...classes);
  }

  /**
   * Remove a CSS class from the component's root element
   */
  protected removeClass(...classes: string[]): void {
    this.element.classList.remove(...classes);
  }

  /**
   * Toggle a CSS class on the component's root element
   */
  protected toggleClass(className: string, force?: boolean): void {
    this.element.classList.toggle(className, force);
  }

  /**
   * Set an attribute on the component's root element
   */
  protected setAttribute(name: string, value: string): void {
    this.element.setAttribute(name, value);
  }

  /**
   * Query for a child element within this component
   */
  protected querySelector<E extends Element = Element>(
    selector: string
  ): E | null {
    return this.element.querySelector<E>(selector);
  }

  /**
   * Query for all child elements matching a selector
   */
  protected querySelectorAll<E extends Element = Element>(
    selector: string
  ): NodeListOf<E> {
    return this.element.querySelectorAll<E>(selector);
  }

  // ============================================================================
  // Abstract and Lifecycle Methods (Subclasses can override)
  // ============================================================================

  /**
   * Render the component's content
   * This method MUST be implemented by subclasses
   */
  protected abstract render(): void;

  /**
   * Cleanup event listeners and resources before unmounting
   * Subclasses should override this to clean up their specific resources
   */
  protected cleanup(): void {
    // Default: no-op
    // Subclasses should override to remove event listeners, timers, etc.
  }

  /**
   * Called after the component is mounted to the DOM
   * Subclasses can override to perform post-mount actions
   */
  protected onMount(): void {
    // Default: no-op
  }

  /**
   * Called after the component is unmounted from the DOM
   * Subclasses can override to perform post-unmount actions
   */
  protected onUnmount(): void {
    // Default: no-op
  }
}
