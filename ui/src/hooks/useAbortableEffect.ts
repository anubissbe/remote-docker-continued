import { useEffect, useRef } from 'react';

/**
 * Custom hook that provides an AbortController for cancelling async operations
 * in useEffect to prevent memory leaks
 */
export function useAbortableEffect(
  effect: (signal: AbortSignal) => void | (() => void),
  deps?: React.DependencyList,
) {
  const abortControllerRef = useRef<AbortController>(new AbortController());

  useEffect(() => {
    // Create a new AbortController for this effect
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // Run the effect with the abort signal
    const cleanup = effect(signal);

    // Cleanup function
    return () => {
      // Abort any pending operations
      abortControllerRef.current?.abort();

      // Run any additional cleanup returned by the effect
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, deps);
}

/**
 * Helper to check if an error is an abort error
 */
export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}
