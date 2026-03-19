import { useEffect, useRef } from 'react';

export default function useDebouncedCallback(callback, delay = 300) {
  const timeoutRef = useRef(null);
  const latestCallbackRef = useRef(callback);

  useEffect(() => {
    latestCallbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const cancel = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const debouncedCallback = (...args) => {
    cancel();
    timeoutRef.current = setTimeout(() => {
      latestCallbackRef.current(...args);
    }, delay);
  };

  return { debouncedCallback, cancel };
}
