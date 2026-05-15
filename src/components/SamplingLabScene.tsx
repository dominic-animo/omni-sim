import { useEffect, useRef } from "react";
import type { SamplingInputs, SamplingState } from "../simulations/samplingLab";

type SamplingLabSceneProps = {
  inputs: SamplingInputs;
  state: SamplingState;
  paused: boolean;
};

function drawHistogram(
  context: CanvasRenderingContext2D,
  values: number[],
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  min: number,
  max: number,
  bins = 34,
) {
  const counts = Array.from({ length: bins }, () => 0);
  values.forEach((value) => {
    const index = Math.max(
      0,
      Math.min(bins - 1, Math.floor(((value - min) / Math.max(max - min, 0.001)) * bins)),
    );
    counts[index] += 1;
  });
  const maxCount = Math.max(...counts, 1);
  context.fillStyle = color;
  counts.forEach((count, index) => {
    const barWidth = width / bins - 2;
    const barHeight = (count / maxCount) * height;
    context.fillRect(x + index * (width / bins), y + height - barHeight, barWidth, barHeight);
  });
}

export function SamplingLabScene({ inputs, state, paused }: SamplingLabSceneProps) {
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
      const { inputs: currentInputs, state: currentState, paused: isPaused } = latest.current;
      if (!isPaused) frame += 1;

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const min = currentInputs.mean - currentInputs.sd * 4;
      const max = currentInputs.mean + currentInputs.sd * 4;
      const scaleX = (value: number) =>
        ((value - min) / Math.max(max - min, 0.001)) * (width * 0.82) + width * 0.09;

      context.clearRect(0, 0, width, height);
      const background = context.createLinearGradient(0, 0, width, height);
      background.addColorStop(0, "#0b1c25");
      background.addColorStop(0.58, "#102832");
      background.addColorStop(1, "#18333b");
      context.fillStyle = background;
      context.fillRect(0, 0, width, height);

      context.strokeStyle = "rgba(127, 248, 255, 0.14)";
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

      const populationY = height * 0.1;
      const sampleY = height * 0.45;
      const meansY = height * 0.68;
      const plotW = width * 0.82;
      const plotX = width * 0.09;

      context.fillStyle = "#cfe6ea";
      context.font = '800 13px "Proxima Nova", "Source Sans 3", sans-serif';
      context.fillText("population values", plotX, populationY - 14);
      context.fillText("latest sample", plotX, sampleY - 18);
      context.fillText("sampling distribution of means", plotX, meansY - 18);

      drawHistogram(
        context,
        currentState.populationPoints,
        plotX,
        populationY,
        plotW,
        height * 0.2,
        "rgba(127, 248, 255, 0.58)",
        min,
        max,
      );

      context.fillStyle = "rgba(244, 201, 93, 0.95)";
      currentState.latest.values.forEach((value, index) => {
        const lane = index % 5;
        const jitter = Math.sin(frame * 0.05 + index) * 2;
        context.beginPath();
        context.arc(scaleX(value), sampleY + lane * 18 + jitter, 4.3, 0, Math.PI * 2);
        context.fill();
      });

      context.strokeStyle = "#f4c95d";
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(scaleX(currentState.latest.mean), sampleY - 8);
      context.lineTo(scaleX(currentState.latest.mean), sampleY + 110);
      context.stroke();

      drawHistogram(
        context,
        currentState.sampleMeans,
        plotX,
        meansY,
        plotW,
        height * 0.2,
        "rgba(169, 239, 120, 0.62)",
        min,
        max,
        38,
      );

      context.strokeStyle = "rgba(255, 138, 85, 0.9)";
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(scaleX(currentInputs.nullMean), meansY - 8);
      context.lineTo(scaleX(currentInputs.nullMean), meansY + height * 0.22);
      context.stroke();

      context.fillStyle = "rgba(255, 138, 85, 0.95)";
      context.fillText("null mean", scaleX(currentInputs.nullMean) + 8, meansY + 18);

      context.fillStyle = "rgba(9, 22, 31, 0.82)";
      context.strokeStyle = "rgba(161, 219, 230, 0.22)";
      context.beginPath();
      context.roundRect(plotX, height * 0.9 - 42, plotW, 42, 8);
      context.fill();
      context.stroke();
      context.fillStyle = "#d7eef1";
      context.font = '800 14px "Proxima Nova", "Source Sans 3", sans-serif';
      context.fillText(currentState.insight, plotX + 14, height * 0.9 - 16);
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
      aria-label="Sampling distribution visualizer"
    />
  );
}
