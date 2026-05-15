import { useCallback, useEffect, useState } from "react";

function currentFullscreenState() {
  return typeof document !== "undefined" && Boolean(document.fullscreenElement);
}

export function useFullscreenMode() {
  const [isFullscreen, setIsFullscreen] = useState(currentFullscreenState);

  useEffect(() => {
    const syncFullscreen = () => setIsFullscreen(currentFullscreenState());
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const shell = document.querySelector(".appShell") as HTMLElement | null;
    const next = !isFullscreen;
    setIsFullscreen(next);

    try {
      if (next && shell?.requestFullscreen) {
        await shell.requestFullscreen();
      } else if (!next && document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      // Browser fullscreen can be denied; the condensed immersive layout still applies.
    }
  }, [isFullscreen]);

  return { isFullscreen, toggleFullscreen };
}
