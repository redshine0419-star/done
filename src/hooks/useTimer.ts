import { useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';

export function useCookTimer() {
  const { state, dispatch } = useApp();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const isRunning = state.cookSession?.isRunning ?? false;

    if (isRunning) {
      intervalRef.current = setInterval(() => {
        dispatch({ type: 'TICK_COOK' });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [state.cookSession?.isRunning, dispatch]);
}
