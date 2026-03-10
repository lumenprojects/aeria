import React from "react";

export const SEARCH_UNDERLINE_DELAY_MS = 120;

export function useUnderlineActivation(delayMs = SEARCH_UNDERLINE_DELAY_MS) {
  const activationTimerRef = React.useRef<number | null>(null);
  const [isUnderlineActive, setIsUnderlineActive] = React.useState(false);

  const clearUnderlineActivation = React.useCallback(() => {
    if (activationTimerRef.current === null) return;
    window.clearTimeout(activationTimerRef.current);
    activationTimerRef.current = null;
  }, []);

  const queueUnderlineActivation = React.useCallback(() => {
    clearUnderlineActivation();
    activationTimerRef.current = window.setTimeout(() => {
      setIsUnderlineActive(true);
      activationTimerRef.current = null;
    }, delayMs);
  }, [clearUnderlineActivation, delayMs]);

  React.useEffect(() => clearUnderlineActivation, [clearUnderlineActivation]);

  return {
    isUnderlineActive,
    setIsUnderlineActive,
    queueUnderlineActivation,
    clearUnderlineActivation
  };
}
