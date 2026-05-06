import { useRef, useCallback } from "react";

interface UseClickOrDblClickOptions {
  onClick: () => void;
  onDblClick: () => void;
  delay?: number;
}

function useClickOrDblClick({ onClick, onDblClick, delay = 250 }: UseClickOrDblClickOptions) {
  const clickTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = useCallback(() => {
    if (clickTimeout.current !== null) {
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
      onDblClick();
    } else {
      clickTimeout.current = setTimeout(() => {
        clickTimeout.current = null;
        onClick();
      }, delay);
    }
  }, [onClick, onDblClick, delay]);

  return { onClick: handleClick };
}

export default useClickOrDblClick;
