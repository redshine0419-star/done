import { useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';

export function useCookTimer() {
  const { state, dispatch } = useApp();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const cs = state.cookSession;
    if (!cs || !cs.isRunning || cs.isComplete) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      const now = performance.now();
      const pauseOffset = cs.pausedDuration;

      const b1Elapsed = Math.floor((now - cs.burner1StepStartMs - pauseOffset) / 1000);
      const b2Elapsed = cs.burner2StepStartMs >= 0
        ? Math.floor((now - cs.burner2StepStartMs - pauseOffset) / 1000)
        : -1;

      dispatch({ type: 'TICK_COOK', payload: { b1Elapsed: Math.max(0, b1Elapsed), b2Elapsed } });
    }, 500);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.cookSession?.isRunning, state.cookSession?.isComplete, dispatch]);
}
