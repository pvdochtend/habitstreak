import { useRef } from 'react';

/**
 * Hook to track the previous value of a state or prop
 *
 * Useful for detecting state transitions (e.g., detecting when a count changes from 2 to 3)
 * Returns undefined on first render, then returns the previous value on subsequent renders.
 *
 * @param value - The value to track
 * @returns The previous value, or undefined on first render
 *
 * @example
 * const [count, setCount] = useState(0);
 * const prevCount = usePrevious(count);
 *
 * // On first render: prevCount === undefined
 * // After setCount(1): prevCount === 0
 * // After setCount(2): prevCount === 1
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<{ value: T; prev: T | undefined }>({
    value,
    prev: undefined,
  });

  const current = ref.current.value;

  if (value !== current) {
    ref.current.prev = current;
    ref.current.value = value;
  }

  return ref.current.prev;
}
