import { useEffect, useRef } from "react";
import type {
  AlcoholOxidationInputs,
  AlcoholOxidationState,
} from "../simulations/alcoholOxidation";

type AlcoholOxidationSceneProps = {
  inputs: AlcoholOxidationInputs;
  state: AlcoholOxidationState;
  paused: boolean;
};

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const value = Number.parseInt(clean, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function drawAtom(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  fill: string,
  label: string,
) {
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fillStyle = fill;
  context.shadowColor = fill;
  context.shadowBlur = 14;
  context.fill();
  context.shadowBlur = 0;
  context.fillStyle = "#061119";
  context.font = '800 12px "Proxima Nova", "Source Sans 3", sans-serif';
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(label, x, y + 0.5);
}

function drawMolecule(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  accent: string,
  kind: "alcohol" | "aldehyde" | "ketone" | "acid" | "fragment",
  alpha: number,
) {
  context.save();
  context.globalAlpha = alpha;
  context.strokeStyle = `rgba(214, 244, 248, ${0.5 + alpha * 0.25})`;
  context.lineWidth = 3.5;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(x - 55, y);
  context.lineTo(x - 16, y);
  context.lineTo(x + 22, y);
  context.lineTo(x + 54, y - 20);
  context.stroke();

  drawAtom(context, x - 15, y, 18, "#e8fbff", "C");

  if (kind === "alcohol") {
    context.beginPath();
    context.moveTo(x - 15, y);
    context.lineTo(x + 2, y - 40);
    context.stroke();
    drawAtom(context, x + 7, y - 52, 16, "#ff986c", "O");
    drawAtom(context, x + 30, y - 58, 12, "#f3fbff", "H");
  }

  if (kind === "ketone" || kind === "aldehyde" || kind === "acid" || kind === "fragment") {
    context.strokeStyle = accent;
    context.beginPath();
    context.moveTo(x - 19, y - 6);
    context.lineTo(x - 5, y - 45);
    context.moveTo(x - 10, y - 2);
    context.lineTo(x + 4, y - 41);
    context.stroke();
    drawAtom(context, x + 5, y - 54, 16, "#ff986c", "O");
  }

  if (kind === "aldehyde") {
    drawAtom(context, x - 46, y + 22, 12, "#f3fbff", "H");
  }

  if (kind === "acid" || kind === "fragment") {
    context.strokeStyle = "rgba(230, 250, 253, 0.86)";
    context.beginPath();
    context.moveTo(x + 22, y);
    context.lineTo(x + 42, y + 34);
    context.stroke();
    drawAtom(context, x + 49, y + 45, 16, "#ff986c", "O");
    drawAtom(context, x + 70, y + 50, 11, "#f3fbff", "H");
  }

  context.fillStyle = "#e6f2f5";
  context.font = '800 13px "Proxima Nova", "Source Sans 3", sans-serif';
  context.textAlign = "center";
  context.fillText(label, x, y + 68);
  context.restore();
}

export function AlcoholOxidationScene({
  inputs,
  state,
  paused,
}: AlcoholOxidationSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const latest = useRef({ inputs, state, paused });

  useEffect(() => {
    latest.current = { inputs, state, paused };
  }, [inputs, state, paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const scale = Math.min(window.devicePixelRatio, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * scale));
      canvas.height = Math.max(1, Math.floor(rect.height * scale));
      context.setTransform(scale, 0, 0, scale, 0, 0);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    let frame = 0;
    let animationId = 0;
    const draw = () => {
      animationId = requestAnimationFrame(draw);
      const { inputs: currentInputs, state: currentState, paused: isPaused } =
        latest.current;
      if (!isPaused) frame += currentInputs.simulationSpeed;

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const rgb = hexToRgb(currentState.color);

      context.clearRect(0, 0, width, height);
      const background = context.createLinearGradient(0, 0, width, height);
      background.addColorStop(0, "#0b1c25");
      background.addColorStop(0.45, "#102832");
      background.addColorStop(1, "#1a343a");
      context.fillStyle = background;
      context.fillRect(0, 0, width, height);

      context.strokeStyle = "rgba(127, 248, 255, 0.14)";
      context.lineWidth = 1;
      for (let x = 0; x < width; x += 36) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, height);
        context.stroke();
      }
      for (let y = 0; y < height; y += 36) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(width, y);
        context.stroke();
      }

      context.save();
      context.globalCompositeOperation = "lighter";
      for (let index = 0; index < 22; index += 1) {
        const phase = (frame * 0.012 + index / 22) % 1;
        const x = width * (0.18 + phase * 0.64);
        const y =
          height * 0.2 +
          ((index * 47) % Math.max(1, Math.floor(height * 0.55))) +
          Math.sin(frame * 0.03 + index) * 10;
        const radius = 2.4 + currentInputs.oxidantStrength * 4.5;
        context.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${
          0.2 + currentInputs.oxidantStrength * 0.38
        })`;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
      }
      context.restore();

      const mid = height * 0.49;
      const left = width * 0.21;
      const center = width * 0.5;
      const right = width * 0.78;
      const compact = width < 560;
      const productKind =
        currentInputs.substrateClass === "secondary"
          ? "ketone"
          : currentState.carboxylicAcid > currentState.aldehyde
            ? "acid"
            : "aldehyde";

      drawMolecule(context, left, mid, "alcohol", currentState.color, "alcohol", 1);

      context.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.92)`;
      context.lineWidth = 3.5;
      context.beginPath();
      context.moveTo(left + 95, mid);
      context.lineTo(center - 94, mid);
      context.stroke();
      context.beginPath();
      context.moveTo(center - 112, mid - 11);
      context.lineTo(center - 92, mid);
      context.lineTo(center - 112, mid + 11);
      context.stroke();

      drawMolecule(
        context,
        center,
        mid,
        currentInputs.substrateClass === "secondary" ? "ketone" : compact ? "CHO" : "aldehyde",
        currentState.color,
        currentInputs.substrateClass === "secondary" ? "ketone" : "aldehyde",
        0.35 + currentState.conversion * 0.65,
      );

      if (currentInputs.substrateClass === "primary") {
        context.strokeStyle = `rgba(255, 152, 108, ${0.48 + currentState.carboxylicAcid * 0.48})`;
        context.beginPath();
        context.moveTo(center + 92, mid);
        context.lineTo(right - 95, mid);
        context.stroke();
        context.beginPath();
        context.moveTo(right - 113, mid - 11);
        context.lineTo(right - 93, mid);
        context.lineTo(right - 113, mid + 11);
        context.stroke();
        drawMolecule(
          context,
          right,
          mid,
          compact ? "CO2H" : "carboxylic acid",
          "#ff8a55",
          "acid",
          0.18 + currentState.carboxylicAcid * 0.82,
        );
      } else {
        drawMolecule(
          context,
          right,
          mid,
          compact ? "fragments" : "acid fragments",
          "#ff8a55",
          "fragment",
          0.1 + currentState.cleavageAcid * 1.7,
        );
        context.fillStyle = "rgba(255, 138, 85, 0.88)";
        context.font = '800 12px "Proxima Nova", "Source Sans 3", sans-serif';
        context.textAlign = "center";
        context.fillText("requires harsh C-C cleavage", right, mid + 94);
      }

      const beakerX = width * 0.5;
      const beakerY = height * 0.78;
      context.strokeStyle = "rgba(230, 250, 253, 0.58)";
      context.lineWidth = 2;
      context.beginPath();
      context.roundRect(beakerX - 125, beakerY - 34, 250, 56, 8);
      context.stroke();
      const fill = context.createLinearGradient(beakerX - 120, beakerY, beakerX + 120, beakerY);
      fill.addColorStop(0, "rgba(127, 248, 255, 0.34)");
      fill.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.48)`);
      fill.addColorStop(1, "rgba(255, 138, 85, 0.32)");
      context.fillStyle = fill;
      context.fillRect(beakerX - 118, beakerY - 5, 236, 24);

      context.fillStyle = "#b6d8de";
      context.font = '700 12px "Proxima Nova", "Source Sans 3", sans-serif';
      context.textAlign = "center";
      context.fillText(
        `${Math.round(currentInputs.temperatureC)} C  |  ${Math.round(
          currentInputs.timeMinutes,
        )} min  |  ${Math.round(currentInputs.waterFraction * 100)}% water`,
        beakerX,
        beakerY + 47,
      );
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      className="sceneMount canvasScene"
      ref={canvasRef}
      aria-label="Alcohol oxidation reaction visualizer"
    />
  );
}
