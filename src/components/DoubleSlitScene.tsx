import { useEffect, useRef } from "react";
import {
  intensityAtY,
  type DoubleSlitInputs,
  type DoubleSlitState,
} from "../simulations/doubleSlit";

type DoubleSlitSceneProps = {
  inputs: DoubleSlitInputs;
  state: DoubleSlitState;
  paused: boolean;
  labelsVisible?: boolean;
  valuesVisible?: boolean;
};

type TagOptions = {
  text: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  tone: string;
  value?: boolean;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const value = Number.parseInt(clean, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.lineTo(x + width - r, y);
  context.quadraticCurveTo(x + width, y, x + width, y + r);
  context.lineTo(x + width, y + height - r);
  context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  context.lineTo(x + r, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - r);
  context.lineTo(x, y + r);
  context.quadraticCurveTo(x, y, x + r, y);
}

function drawTag(context: CanvasRenderingContext2D, options: TagOptions) {
  const { text, x, y, targetX, targetY, tone, value } = options;
  context.save();
  context.font = value
    ? '700 12px KaTeX_Main, "Times New Roman", serif'
    : '800 10px "Proxima Nova", "Source Sans 3", sans-serif';
  const paddingX = value ? 10 : 8;
  const boxWidth = Math.ceil(context.measureText(text).width + paddingX * 2);
  const boxHeight = value ? 25 : 22;
  const left = clamp(x - boxWidth / 2, 10, context.canvas.clientWidth - boxWidth - 10);
  const top = clamp(y - boxHeight / 2, 10, context.canvas.clientHeight - boxHeight - 10);
  const anchorX = left + boxWidth / 2;
  const anchorY = top + boxHeight / 2;

  context.strokeStyle = tone;
  context.globalAlpha = 0.62;
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(anchorX, anchorY);
  context.lineTo(targetX, targetY);
  context.stroke();
  context.globalAlpha = 1;

  context.fillStyle = tone;
  context.shadowColor = tone;
  context.shadowBlur = 10;
  context.beginPath();
  context.arc(targetX, targetY, value ? 4 : 3.2, 0, Math.PI * 2);
  context.fill();
  context.shadowBlur = 0;

  const fill = value ? "rgba(5, 18, 18, 0.76)" : "rgba(4, 12, 18, 0.68)";
  context.fillStyle = fill;
  context.strokeStyle = value ? "rgba(169, 239, 120, 0.46)" : "rgba(127, 248, 255, 0.38)";
  roundedRect(context, left, top, boxWidth, boxHeight, 4);
  context.fill();
  context.stroke();

  context.fillStyle = value ? "rgba(234, 255, 215, 0.95)" : "rgba(233, 251, 255, 0.92)";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, left + boxWidth / 2, top + boxHeight / 2 + (value ? 1 : 0));
  context.restore();
}

function drawDoubleArrow(
  context: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const arrow = 6;
  context.save();
  context.strokeStyle = color;
  context.fillStyle = color;
  context.lineWidth = 1.2;
  context.beginPath();
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  context.stroke();
  [0, Math.PI].forEach((offset, index) => {
    const baseX = index === 0 ? x2 : x1;
    const baseY = index === 0 ? y2 : y1;
    const a = angle + offset;
    context.beginPath();
    context.moveTo(baseX, baseY);
    context.lineTo(baseX - arrow * Math.cos(a - 0.45), baseY - arrow * Math.sin(a - 0.45));
    context.lineTo(baseX - arrow * Math.cos(a + 0.45), baseY - arrow * Math.sin(a + 0.45));
    context.closePath();
    context.fill();
  });
  context.restore();
}

export function DoubleSlitScene({
  inputs,
  state,
  paused,
  labelsVisible = false,
  valuesVisible = false,
}: DoubleSlitSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const latest = useRef({ inputs, state, paused, labelsVisible, valuesVisible });

  useEffect(() => {
    latest.current = { inputs, state, paused, labelsVisible, valuesVisible };
  }, [inputs, state, paused, labelsVisible, valuesVisible]);

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
      const {
        inputs: current,
        state: currentState,
        paused: isPaused,
        labelsVisible: showLabels,
        valuesVisible: showValues,
      } = latest.current;
      if (!isPaused) frame += current.simulationSpeed;

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const rgb = hexToRgb(currentState.color);
      context.clearRect(0, 0, width, height);

      const sourceX = width * 0.12;
      const barrierX = width * 0.37;
      const barrierWidth = 24;
      const screenX = width * 0.82;
      const centerY = height * 0.5;
      const wallTop = height * 0.12;
      const wallBottom = height * 0.88;
      const wallHeight = wallBottom - wallTop;
      const slitGap = clamp(current.slitSeparationUm * 6.1, 38, wallHeight * 0.36);
      const slitHeight = clamp(current.slitWidthUm * 3.4, 14, 46);
      const slitYs = [centerY - slitGap / 2, centerY + slitGap / 2];
      const detectorY = clamp(centerY - (current.detectorYmm / 25) * height * 0.39, wallTop, wallBottom);
      const screenPatternX = screenX + 18;
      const screenPatternWidth = Math.max(64, Math.min(130, width - screenPatternX - 20));

      const background = context.createLinearGradient(0, 0, width, height);
      background.addColorStop(0, "#071018");
      background.addColorStop(0.52, "#0b1f28");
      background.addColorStop(1, "#111325");
      context.fillStyle = background;
      context.fillRect(0, 0, width, height);

      context.save();
      context.strokeStyle = "rgba(127, 248, 255, 0.075)";
      context.lineWidth = 1;
      for (let x = 0; x < width; x += 34) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, height);
        context.stroke();
      }
      for (let y = 0; y < height; y += 34) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(width, y);
        context.stroke();
      }
      context.strokeStyle = "rgba(255, 77, 240, 0.09)";
      context.beginPath();
      context.moveTo(0, centerY);
      context.lineTo(width, centerY);
      context.stroke();
      context.restore();

      const chamber = context.createLinearGradient(sourceX, 0, screenX + screenPatternWidth, 0);
      chamber.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.08)`);
      chamber.addColorStop(0.5, "rgba(127, 248, 255, 0.025)");
      chamber.addColorStop(1, "rgba(255, 77, 240, 0.06)");
      context.fillStyle = chamber;
      roundedRect(context, sourceX - 46, wallTop - 10, screenX + screenPatternWidth - sourceX + 58, wallHeight + 20, 8);
      context.fill();
      context.strokeStyle = "rgba(127, 248, 255, 0.16)";
      context.stroke();

      context.save();
      context.globalCompositeOperation = "lighter";

      const beamGradient = context.createLinearGradient(sourceX, 0, barrierX - barrierWidth / 2, 0);
      beamGradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.12 * current.intensity})`);
      beamGradient.addColorStop(0.72, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.055 * current.intensity})`);
      beamGradient.addColorStop(1, "rgba(127, 248, 255, 0)");
      context.fillStyle = beamGradient;
      context.beginPath();
      context.moveTo(sourceX + 10, centerY - wallHeight * 0.22);
      context.lineTo(barrierX - barrierWidth / 2, centerY - wallHeight * 0.31);
      context.lineTo(barrierX - barrierWidth / 2, centerY + wallHeight * 0.31);
      context.lineTo(sourceX + 10, centerY + wallHeight * 0.22);
      context.closePath();
      context.fill();

      context.save();
      context.beginPath();
      context.rect(sourceX + 18, wallTop, barrierX - sourceX - barrierWidth / 2 - 22, wallHeight);
      context.clip();
      context.lineWidth = 1.55;
      const incidentPitch = 25;
      const phase = (frame * 1.4) % incidentPitch;
      for (let x = sourceX + 22 + phase; x < barrierX - barrierWidth / 2 - 4; x += incidentPitch) {
        const distanceFade = 0.45 + 0.55 * ((x - sourceX) / (barrierX - sourceX));
        context.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.16 * current.intensity * distanceFade})`;
        context.beginPath();
        context.moveTo(x, centerY - wallHeight * 0.29);
        context.quadraticCurveTo(x + 6, centerY, x, centerY + wallHeight * 0.29);
        context.stroke();
      }
      context.restore();

      const fieldLeft = barrierX + barrierWidth / 2;
      const fieldWidth = screenX - fieldLeft;
      for (let row = 0; row < wallHeight; row += 3) {
        const y = wallTop + row;
        const yMm = ((centerY - y) / (height * 0.39)) * 25;
        const intensity = intensityAtY(current, yMm);
        const alpha = (0.014 + intensity * 0.12) * current.coherence;
        context.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
        context.fillRect(fieldLeft, y, fieldWidth, 3);
      }

      context.save();
      context.beginPath();
      context.rect(fieldLeft, wallTop, fieldWidth + 4, wallHeight);
      context.clip();
      context.lineCap = "round";
      slitYs.forEach((slitY) => {
        const maxRadius = Math.hypot(screenX - fieldLeft, Math.max(slitY - wallTop, wallBottom - slitY));
        for (let i = 0; i < 16; i += 1) {
          const radius = ((frame * 2 + i * 25) % (maxRadius + 42)) + 8;
          if (radius > maxRadius) continue;
          const edgeFade = clamp((maxRadius - radius) / 52, 0, 1);
          const slitFade = clamp((radius - 6) / 30, 0, 1);
          const alpha = 0.2 * current.intensity * Math.max(0.26, current.coherence) * edgeFade * slitFade;
          context.beginPath();
          context.arc(fieldLeft, slitY, radius, -Math.PI / 2, Math.PI / 2);
          context.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
          context.lineWidth = 1.4 + 0.45 * edgeFade;
          context.stroke();
        }
      });
      context.restore();
      context.restore();

      context.strokeStyle = "rgba(127, 248, 255, 0.22)";
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(sourceX - 28, wallBottom + 18);
      context.lineTo(screenX + screenPatternWidth + 12, wallBottom + 18);
      context.stroke();

      context.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.98)`;
      context.shadowColor = currentState.color;
      context.shadowBlur = 30;
      context.beginPath();
      context.arc(sourceX, centerY, 9 + current.intensity * 7, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.48)`;
      context.lineWidth = 2;
      context.beginPath();
      context.arc(sourceX, centerY, 28, 0, Math.PI * 2);
      context.stroke();
      context.shadowBlur = 0;

      const wallGradient = context.createLinearGradient(barrierX - barrierWidth / 2, 0, barrierX + barrierWidth / 2, 0);
      wallGradient.addColorStop(0, "rgba(2, 8, 12, 0.98)");
      wallGradient.addColorStop(0.44, "rgba(36, 70, 78, 0.96)");
      wallGradient.addColorStop(0.58, "rgba(106, 150, 158, 0.28)");
      wallGradient.addColorStop(1, "rgba(4, 12, 18, 0.98)");
      context.fillStyle = wallGradient;
      const segments = [
        [wallTop, slitYs[0] - slitHeight / 2],
        [slitYs[0] + slitHeight / 2, slitYs[1] - slitHeight / 2],
        [slitYs[1] + slitHeight / 2, wallBottom],
      ];
      segments.forEach(([y1, y2]) => {
        if (y2 <= y1) return;
        roundedRect(context, barrierX - barrierWidth / 2, y1, barrierWidth, y2 - y1, 4);
        context.fill();
      });
      context.strokeStyle = "rgba(127, 248, 255, 0.32)";
      context.lineWidth = 1.2;
      context.beginPath();
      context.moveTo(barrierX - barrierWidth / 2, wallTop);
      context.lineTo(barrierX - barrierWidth / 2, wallBottom);
      context.moveTo(barrierX + barrierWidth / 2, wallTop);
      context.lineTo(barrierX + barrierWidth / 2, wallBottom);
      context.stroke();

      slitYs.forEach((slitY) => {
        context.save();
        context.shadowColor = currentState.color;
        context.shadowBlur = 20;
        context.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.22)`;
        roundedRect(context, barrierX - barrierWidth / 2 - 3, slitY - slitHeight / 2, barrierWidth + 6, slitHeight, 3);
        context.fill();
        context.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.95)`;
        context.lineWidth = 1.6;
        context.stroke();
        context.restore();
      });

      const screenGradient = context.createLinearGradient(screenX - 8, 0, screenX + 22, 0);
      screenGradient.addColorStop(0, "rgba(127, 248, 255, 0.14)");
      screenGradient.addColorStop(0.48, "rgba(222, 245, 248, 0.58)");
      screenGradient.addColorStop(1, "rgba(255, 77, 240, 0.16)");
      context.fillStyle = screenGradient;
      roundedRect(context, screenX - 3, wallTop - 2, 18, wallHeight + 4, 5);
      context.fill();
      context.strokeStyle = "rgba(127, 248, 255, 0.34)";
      context.stroke();

      for (let row = 0; row < wallHeight; row += 2) {
        const y = wallTop + row;
        const yMm = ((centerY - y) / (height * 0.39)) * 25;
        const intensity = intensityAtY(current, yMm);
        const alpha = 0.16 + intensity * 0.84;
        context.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
        context.fillRect(screenX + 2, y, 10, 2);
        context.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.08 + intensity * 0.72})`;
        context.fillRect(screenPatternX, y, 12 + intensity * screenPatternWidth, 2);
      }

      context.strokeStyle = "rgba(244, 201, 93, 0.96)";
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(screenX - 18, detectorY);
      context.lineTo(screenPatternX + screenPatternWidth + 3, detectorY);
      context.stroke();
      context.fillStyle = "#f4c95d";
      context.shadowColor = "#f4c95d";
      context.shadowBlur = 14;
      context.beginPath();
      context.arc(screenX - 17, detectorY, 6, 0, Math.PI * 2);
      context.fill();
      context.shadowBlur = 0;

      context.fillStyle = "rgba(230, 242, 245, 0.76)";
      context.font = '700 11px "Proxima Nova", "Source Sans 3", sans-serif';
      context.textAlign = "center";
      context.fillText("Source", sourceX, centerY + 48);
      context.fillText("Slit Barrier", barrierX, wallTop - 12);
      context.fillText("Screen", screenX + 7, wallTop - 12);

      if (showValues) {
        const dimensionX = barrierX + barrierWidth / 2 + 20;
        drawDoubleArrow(context, dimensionX, slitYs[0], dimensionX, slitYs[1], "rgba(169, 239, 120, 0.82)");
        context.strokeStyle = "rgba(169, 239, 120, 0.5)";
        context.beginPath();
        context.moveTo(barrierX + barrierWidth / 2 + 2, slitYs[0]);
        context.lineTo(dimensionX + 5, slitYs[0]);
        context.moveTo(barrierX + barrierWidth / 2 + 2, slitYs[1]);
        context.lineTo(dimensionX + 5, slitYs[1]);
        context.stroke();

        drawTag(context, {
          text: `λ = ${Math.round(current.wavelengthNm)} nm`,
          x: sourceX + 28,
          y: wallTop + 24,
          targetX: sourceX,
          targetY: centerY,
          tone: "#a9ef78",
          value: true,
        });
        drawTag(context, {
          text: `d = ${current.slitSeparationUm.toFixed(1)} µm`,
          x: dimensionX + 46,
          y: centerY,
          targetX: dimensionX,
          targetY: centerY,
          tone: "#a9ef78",
          value: true,
        });
        drawTag(context, {
          text: `a = ${current.slitWidthUm.toFixed(1)} µm`,
          x: barrierX - 42,
          y: slitYs[0] - slitHeight / 2 - 18,
          targetX: barrierX,
          targetY: slitYs[0],
          tone: "#a9ef78",
          value: true,
        });
        drawTag(context, {
          text: `L = ${current.screenDistanceM.toFixed(2)} m`,
          x: (barrierX + screenX) / 2,
          y: wallBottom + 44,
          targetX: (barrierX + screenX) / 2,
          targetY: wallBottom + 18,
          tone: "#a9ef78",
          value: true,
        });
        drawTag(context, {
          text: `I = ${Math.round(currentState.detectorIntensity * 100)}%`,
          x: screenPatternX + screenPatternWidth - 42,
          y: detectorY - 28,
          targetX: screenX - 17,
          targetY: detectorY,
          tone: "#a9ef78",
          value: true,
        });
      } else if (showLabels) {
        drawTag(context, {
          text: "Coherent Source",
          x: sourceX + 20,
          y: wallTop + 22,
          targetX: sourceX,
          targetY: centerY,
          tone: "#7ff8ff",
        });
        drawTag(context, {
          text: "Twin Slits",
          x: barrierX + 64,
          y: centerY - 2,
          targetX: barrierX,
          targetY: slitYs[0],
          tone: "#7ff8ff",
        });
        drawTag(context, {
          text: "Interference Field",
          x: (barrierX + screenX) / 2,
          y: wallTop + 26,
          targetX: (barrierX + screenX) / 2,
          targetY: centerY,
          tone: "#7ff8ff",
        });
        drawTag(context, {
          text: "Screen Bands",
          x: screenPatternX + screenPatternWidth - 36,
          y: wallTop + 26,
          targetX: screenX + 7,
          targetY: centerY,
          tone: "#7ff8ff",
        });
        drawTag(context, {
          text: "Detector Probe",
          x: screenPatternX + screenPatternWidth - 40,
          y: detectorY + 30,
          targetX: screenX - 17,
          targetY: detectorY,
          tone: "#7ff8ff",
        });
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
    };
  }, []);

  return <canvas className="sceneMount canvasScene" ref={canvasRef} aria-label="Double-slit interference visualizer" />;
}
