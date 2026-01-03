/**
 * EventTarget-based Store for Global State Management
 * Follows REFACTOR.md Phase 4.1 - Replace Zustand with native EventTarget
 *
 * This store provides a lightweight, framework-free state management solution
 * using native browser APIs.
 */

export interface StoreChangeEvent<T> {
  oldState: T;
  newState: T;
}

/**
 * Generic Store class using EventTarget for reactive state management
 *
 * @example
 * ```typescript
 * interface AppState {
 *   count: number;
 *   user: string | null;
 * }
 *
 * const store = new Store<AppState>({ count: 0, user: null });
 *
 * // Subscribe to changes
 * store.addEventListener('change', (event) => {
 *   const { newState } = (event as CustomEvent).detail;
 *   console.log('State updated:', newState);
 * });
 *
 * // Update state
 * store.setState({ count: 1 });
 * store.setState((prev) => ({ count: prev.count + 1 }));
 * ```
 */
export class Store<T extends Record<string, any>> extends EventTarget {
  private state: T;

  constructor(initialState: T) {
    super();
    this.state = initialState;
  }

  /**
   * Get the current state snapshot
   */
  public getState(): T {
    return { ...this.state };
  }

  /**
   * Update state and notify listeners
   * @param updater - Partial state object or updater function
   */
  public setState(updater: Partial<T> | ((prevState: T) => Partial<T>)): void {
    const oldState = { ...this.state };
    const partial = typeof updater === 'function' ? updater(this.state) : updater;
    this.state = { ...this.state, ...partial };

    // Dispatch change event with old and new state
    this.dispatchEvent(
      new CustomEvent<StoreChangeEvent<T>>('change', {
        detail: { oldState, newState: this.state },
      })
    );
  }

  /**
   * Subscribe to state changes
   * @param listener - Callback function that receives the change event
   * @returns Unsubscribe function
   */
  public subscribe(
    listener: (event: CustomEvent<StoreChangeEvent<T>>) => void
  ): () => void {
    const handler = listener as EventListener;
    this.addEventListener('change', handler);

    // Return unsubscribe function
    return () => {
      this.removeEventListener('change', handler);
    };
  }

  /**
   * Reset state to initial values
   */
  public reset(initialState: T): void {
    this.setState(initialState);
  }
}
