import { useEffect, useId, useState } from "react";
import { Activity, ChartSpline } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ChartPoint = {
  x: number;
  y: number;
};

export function format(value: number, digits = 2) {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

export function formatMathText(value: string) {
  return value
    .replace(/\buA\b/g, "µA")
    .replace(/\bum\b/g, "µm")
    .replace(/\bohm\b/gi, "Ω")
    .replace(/\bdeg\b/g, "°")
    .replace(/m\/s2/g, "m/s²")
    .replace(/\be-/g, "e⁻")
    .replace(/\s+°/g, "°");
}

function formatControlUnit(unit: string) {
  if (unit === "x") return "×";
  if (unit === "C") return "°C";
  return formatMathText(unit);
}

function unitGap(unit: string) {
  const compactUnits = new Set(["°", "%"]);
  return compactUnits.has(unit) ? "" : " ";
}

function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function MiniChart({
  points,
  activeX,
  activeY,
  label,
  color,
  xUnit,
  yUnit,
}: {
  points: ChartPoint[];
  activeX: number;
  activeY: number;
  label: string;
  color: string;
  xUnit?: string;
  yUnit?: string;
}) {
  const width = 320;
  const height = 150;
  const pad = 18;
  const chartId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const fillId = `chartFill${chartId}`;
  const xValues = points.map((point) => point.x);
  const yValues = points.map((point) => point.y);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const minY = Math.min(0, ...yValues);
  const maxY = Math.max(1, ...yValues);

  const scaleX = (x: number) =>
    pad + ((x - minX) / Math.max(maxX - minX, 0.001)) * (width - pad * 2);
  const scaleY = (y: number) =>
    height - pad - ((y - minY) / Math.max(maxY - minY, 0.001)) * (height - pad * 2);

  const path = points
    .map((point, index) => {
      const command = index === 0 ? "M" : "L";
      return `${command} ${scaleX(point.x).toFixed(2)} ${scaleY(point.y).toFixed(2)}`;
    })
    .join(" ");
  const baselineY = height - pad;
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  const areaPath =
    firstPoint && lastPoint
      ? `${path} L ${scaleX(lastPoint.x).toFixed(2)} ${baselineY} L ${scaleX(firstPoint.x).toFixed(2)} ${baselineY} Z`
      : "";
  const activeXPx = scaleX(activeX);
  const activeYPx = scaleY(activeY);
  const gridFractions = [0.25, 0.5, 0.75];
  const formattedLabel = formatMathText(label);

  return (
    <div className="chartPanel">
      <div className="chartHeader">
        <span className="mathLabel">{formattedLabel}</span>
        <ChartSpline size={16} aria-hidden="true" />
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={formattedLabel}>
        <defs>
          <linearGradient id={fillId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.24" />
            <stop offset="64%" stopColor={color} stopOpacity="0.065" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {gridFractions.map((fraction) => {
          const x = pad + (width - pad * 2) * fraction;
          const y = pad + (height - pad * 2) * fraction;
          return (
            <g key={fraction}>
              <line className="chartGridLine" x1={x} y1={pad} x2={x} y2={height - pad} />
              <line className="chartGridLine" x1={pad} y1={y} x2={width - pad} y2={y} />
            </g>
          );
        })}
        <line className="chartAxisLine" x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} />
        <line className="chartAxisLine" x1={pad} y1={pad} x2={pad} y2={height - pad} />
        {areaPath ? <path className="chartArea" d={areaPath} fill={`url(#${fillId})`} /> : null}
        <line className="chartCursor" x1={activeXPx} y1={pad} x2={activeXPx} y2={height - pad} />
        <line className="chartCursor chartCursorHorizontal" x1={pad} y1={activeYPx} x2={width - pad} y2={activeYPx} />
        <path className="chartTrace" d={path} style={{ stroke: color }} />
        <circle
          className="chartActiveHalo"
          cx={activeXPx}
          cy={activeYPx}
          r="8.5"
          style={{ stroke: color }}
        />
        <circle
          className="chartActiveDot"
          cx={activeXPx}
          cy={activeYPx}
          r="4.5"
          style={{ fill: color }}
        />
        {xUnit ? (
          <text className="chartAxisLabel" x={width - pad} y={height - 3} textAnchor="end">
            {formatMathText(xUnit)}
          </text>
        ) : null}
        {yUnit ? (
          <text className="chartAxisLabel" x={pad + 2} y={12}>
            {formatMathText(yUnit)}
          </text>
        ) : null}
      </svg>
    </div>
  );
}

export function ControlSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  description,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  description?: string;
  onChange: (value: number) => void;
}) {
  const formattedUnit = formatControlUnit(unit);
  const tooltipId = useId();
  const digits = step < 1 ? 2 : 0;
  const formattedValue = Number.isInteger(step) ? String(value) : value.toFixed(digits);
  const [editing, setEditing] = useState(false);
  const [draftValue, setDraftValue] = useState(formattedValue);

  useEffect(() => {
    if (!editing) setDraftValue(formattedValue);
  }, [editing, formattedValue]);

  const commitDraft = () => {
    if (draftValue.trim() === "") {
      setDraftValue(formattedValue);
      setEditing(false);
      return;
    }
    const next = Number(draftValue);
    if (Number.isFinite(next)) onChange(clampNumber(next, min, max));
    setEditing(false);
  };

  return (
    <label className="control">
      <span className="controlTop">
        <span
          className={description ? "controlName hasTooltip" : "controlName"}
          tabIndex={description ? 0 : undefined}
          aria-describedby={description ? tooltipId : undefined}
        >
          <span>{label}</span>
          {description ? (
            <>
              <span className="controlInfoDot" aria-hidden="true">i</span>
              <span className="controlTooltip" id={tooltipId} role="tooltip">
                {description}
              </span>
            </>
          ) : null}
        </span>
        {editing ? (
          <span className="inlineManualBox">
            <input
              autoFocus
              className="inlineManualInput mathValue"
              type="number"
              min={min}
              max={max}
              step={step}
              value={draftValue}
              aria-label={`${label} Manual Value`}
              onBlur={commitDraft}
              onChange={(event) => setDraftValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") commitDraft();
                if (event.key === "Escape") {
                  setDraftValue(formattedValue);
                  setEditing(false);
                }
              }}
            />
            {unit ? <span className="unitText">{formattedUnit}</span> : null}
          </span>
        ) : (
          <button
            className="mathValue controlValueButton"
            type="button"
            aria-label={`Edit ${label} Value`}
            onClick={() => setEditing(true)}
          >
            <span>{format(value, digits)}</span>
            {unit ? (
              <span className="unitText">
                {unitGap(formattedUnit)}
                {formattedUnit}
              </span>
            ) : null}
          </button>
        )}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

export function Metric({
  icon: Icon = Activity,
  label,
  value,
  tone,
}: {
  icon?: LucideIcon;
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="metric">
      <Icon size={18} aria-hidden="true" />
      <span>{label}</span>
      <strong className="mathValue" style={{ color: tone }}>{formatMathText(value)}</strong>
    </div>
  );
}
