import { Maximize2, Minimize2 } from "lucide-react";

export function FullscreenButton({
  active,
  onToggle,
}: {
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className={active ? "activeTool" : ""}
      onClick={onToggle}
    >
      {active ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
      <span>{active ? "Exit Fullscreen" : "Fullscreen"}</span>
    </button>
  );
}
