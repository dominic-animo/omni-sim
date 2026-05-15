import type { CSSProperties } from "react";
import katex from "katex";
import type { PhotoelectricState } from "../simulations/photoelectric";

type PhotoelectricSceneProps = {
  state: PhotoelectricState;
  metalColor: string;
  paused: boolean;
  speed: number;
  viewRotation: number;
  viewZoom: number;
  collectorSpacingCm: number;
  labelsVisible: boolean;
  valuesVisible: boolean;
};

type Callout = {
  label?: string;
  math?: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  color: string;
};

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

function renderMath(math: string) {
  return katex.renderToString(math, {
    throwOnError: false,
    strict: false,
    output: "html",
  });
}

function calloutPath(callout: Callout) {
  const bendX = callout.targetX + (callout.x - callout.targetX) * 0.48;
  const bendY = callout.targetY + (callout.y - callout.targetY) * 0.18;
  return `M ${callout.targetX} ${callout.targetY} C ${bendX} ${bendY}, ${callout.x - 14} ${callout.y}, ${callout.x} ${callout.y}`;
}

function SceneCallout({ callout, value = false }: { callout: Callout; value?: boolean }) {
  const width = value ? 148 : 134;
  const height = value ? 34 : 30;
  return (
    <g className={value ? "tubeCallout tubeValueCallout" : "tubeCallout"} style={{ color: callout.color }}>
      <path d={calloutPath(callout)} />
      <circle cx={callout.targetX} cy={callout.targetY} r="3.4" />
      <foreignObject x={callout.x} y={callout.y - height / 2} width={width} height={height}>
        <div className={value ? "tubeCalloutCard tubeValueCard" : "tubeCalloutCard"}>
          {callout.math ? (
            <span dangerouslySetInnerHTML={{ __html: renderMath(callout.math) }} />
          ) : (
            callout.label
          )}
        </div>
      </foreignObject>
    </g>
  );
}

function electronPath({
  impactX,
  impactY,
  collectorX,
  lane,
  collection,
  collected,
}: {
  impactX: number;
  impactY: number;
  collectorX: number;
  lane: number;
  collection: number;
  collected: boolean;
}) {
  const gap = collectorX - impactX;
  const sign = lane >= 0 ? 1 : -1;
  const lift = lane * 34;
  const endX = collected ? collectorX - 20 : impactX + gap * (0.22 + collection * 0.42);
  const endY = collected ? impactY + lift * 0.55 : impactY + lift + sign * 26;
  const controlOneX = impactX + gap * 0.25;
  const controlTwoX = collected ? impactX + gap * 0.72 : endX - gap * 0.18;
  const controlOneY = impactY + lift * 0.15 - 22;
  const controlTwoY = collected ? impactY + lift * 0.78 : impactY + lift - sign * 34;
  return `M ${impactX} ${impactY} C ${controlOneX} ${controlOneY}, ${controlTwoX} ${controlTwoY}, ${endX} ${endY}`;
}

export function PhotoelectricScene({
  state,
  metalColor,
  paused,
  speed,
  viewRotation,
  viewZoom,
  collectorSpacingCm,
  labelsVisible,
  valuesVisible,
}: PhotoelectricSceneProps) {
  const chamberX = 78;
  const chamberY = 72;
  const chamberWidth = 830;
  const chamberHeight = 276;
  const chamberCenterY = chamberY + chamberHeight / 2;
  const spacingRatio = clamp((collectorSpacingCm - 1.2) / (9 - 1.2));
  const collectorX = 610 + spacingRatio * 190;
  const cathodeX = 268;
  const impactX = cathodeX + 50;
  const impactY = chamberCenterY + 4;
  const lensX = 144;
  const lensY = chamberY + 68;
  const collection = clamp(state.collectionFraction);
  const electronDensity = state.emission ? clamp(state.electronRate) : 0;
  const stoppingStress = clamp(state.stoppingRatio);
  const beamWidth = 66 - state.beamFocus * 30;
  const photonCount = Math.round(9 + state.intensity * 17);
  const electronCount = Math.round(7 + electronDensity * 17);
  const fieldX = impactX + (collectorX - impactX) * (0.42 + collection * 0.14);
  const diagramTilt = clamp(viewRotation, -65, 65) * 0.16;
  const diagramScale = clamp(viewZoom, 0.72, 1.38);
  const animationDuration = paused ? 999999 : Math.max(0.72, 2.35 / Math.max(speed, 0.2));
  const electronDuration = paused ? 999999 : Math.max(0.62, 2.05 / Math.max(speed, 0.2));
  const electronPaths = Array.from({ length: 18 }, (_, index) => {
    const lane = (index - 8.5) / 8.5;
    const collected = collection > 0.06 && index / 18 < collection;
    return {
      id: `photoelectron-path-${index}`,
      d: electronPath({ impactX, impactY, collectorX, lane, collection, collected }),
      collected,
      lane,
    };
  });
  const labelCallouts: Callout[] = [
    { label: "Photon Beam", x: 124, y: 92, targetX: 214, targetY: 163, color: state.color },
    { label: "Photocathode", x: 292, y: 70, targetX: impactX - 12, targetY: impactY, color: "#f4c95d" },
    { label: "Emission Patch", x: 336, y: 322, targetX: impactX + 2, targetY: impactY, color: "#a9ef78" },
    { label: "Electron Flight", x: 478, y: 98, targetX: impactX + (collectorX - impactX) * 0.42, targetY: impactY - 28, color: "#7ff8ff" },
    { label: "Collector Mesh", x: collectorX - 118, y: 304, targetX: collectorX, targetY: chamberCenterY, color: "#ff4df0" },
    { label: "Retarding Field", x: fieldX - 22, y: 326, targetX: fieldX, targetY: chamberCenterY, color: "#ff4df0" },
  ];
  const valueCallouts: Callout[] = [
    {
      math: String.raw`E_\gamma=${state.photonEnergyEv.toFixed(2)}\,\mathrm{eV}`,
      x: 118,
      y: 94,
      targetX: 214,
      targetY: 163,
      color: state.color,
    },
    {
      math: String.raw`K_{\max}=${state.maxKineticEnergyEv.toFixed(2)}\,\mathrm{eV}`,
      x: 404,
      y: 86,
      targetX: impactX + 94,
      targetY: impactY - 34,
      color: "#7ff8ff",
    },
    {
      math: String.raw`I=${state.collectorCurrentUa.toFixed(1)}\,\mu\mathrm{A}`,
      x: collectorX - 122,
      y: 304,
      targetX: collectorX,
      targetY: chamberCenterY,
      color: "#ff4df0",
    },
    {
      math: String.raw`\mathcal{E}=${state.fieldStrengthVm.toFixed(1)}\,\mathrm{V\,m^{-1}}`,
      x: fieldX - 42,
      y: 326,
      targetX: fieldX,
      targetY: chamberCenterY + 48,
      color: "#f4c95d",
    },
  ];
  const sceneStyle = {
    "--photon-color": state.color,
    "--metal-color": metalColor,
  } as CSSProperties;

  return (
    <div className="sceneMount photoelectricTubeScene" aria-label="Photoelectric effect cutaway visualizer" style={sceneStyle}>
      <svg className="photoelectricTubeSvg" viewBox="0 0 1000 430" role="img" aria-label="Photoelectric Effect Cutaway">
        <defs>
          <radialGradient id="photoelectricBackdrop" cx="47%" cy="44%" r="68%">
            <stop offset="0%" stopColor="rgba(127, 248, 255, 0.24)" />
            <stop offset="42%" stopColor="rgba(17, 44, 58, 0.34)" />
            <stop offset="100%" stopColor="rgba(2, 8, 12, 0.08)" />
          </radialGradient>
          <linearGradient id="photoelectricGlass" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#e9fbff" stopOpacity="0.2" />
            <stop offset="38%" stopColor="#7ff8ff" stopOpacity="0.06" />
            <stop offset="72%" stopColor="#ff4df0" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.14" />
          </linearGradient>
          <linearGradient id="photoelectricGlassEdge" x1="0%" x2="100%">
            <stop offset="0%" stopColor="#7ff8ff" stopOpacity="0.16" />
            <stop offset="48%" stopColor="#e9fbff" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ff4df0" stopOpacity="0.16" />
          </linearGradient>
          <linearGradient id="photoelectricBeam" x1="0%" x2="100%">
            <stop offset="0%" stopColor={state.color} stopOpacity="0.04" />
            <stop offset="54%" stopColor={state.color} stopOpacity={0.2 + state.intensity * 0.32} />
            <stop offset="100%" stopColor={state.color} stopOpacity={0.08 + state.intensity * 0.22} />
          </linearGradient>
          <linearGradient id="photoelectricCathodeMetal" x1="0%" x2="100%">
            <stop offset="0%" stopColor="#fff0c2" />
            <stop offset="17%" stopColor={metalColor} />
            <stop offset="48%" stopColor="#c9d0c4" />
            <stop offset="74%" stopColor="#fff7dd" />
            <stop offset="100%" stopColor={metalColor} />
          </linearGradient>
          <linearGradient id="photoelectricCollectorMetal" x1="0%" x2="100%">
            <stop offset="0%" stopColor="#f2feff" stopOpacity="0.9" />
            <stop offset="32%" stopColor="#7ff8ff" stopOpacity="0.52" />
            <stop offset="68%" stopColor="#d6f8ff" stopOpacity="0.82" />
            <stop offset="100%" stopColor="#ff4df0" stopOpacity="0.46" />
          </linearGradient>
          <linearGradient id="photoelectricRetardingField" x1="0%" x2="100%">
            <stop offset="0%" stopColor="#ff4df0" stopOpacity="0" />
            <stop offset="50%" stopColor="#ff4df0" stopOpacity={0.08 + stoppingStress * 0.24} />
            <stop offset="100%" stopColor="#7ff8ff" stopOpacity="0" />
          </linearGradient>
          <filter id="photoelectricSoftGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="photoelectricMetalShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="5" stdDeviation="7" floodColor="#00070b" floodOpacity="0.55" />
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#7ff8ff" floodOpacity="0.18" />
          </filter>
          <path id="photoelectricPhotonPath" d={`M ${lensX} ${lensY} C ${lensX + 58} ${lensY + 30}, ${impactX - 95} ${impactY - 30}, ${impactX} ${impactY}`} />
          <clipPath id="photoelectricChamberClip">
            <rect x={chamberX} y={chamberY} width={chamberWidth} height={chamberHeight} rx="104" />
          </clipPath>
          <pattern id="photoelectricMeshPattern" width="13" height="13" patternUnits="userSpaceOnUse">
            <path d="M 0 0 L 13 13 M 13 0 L 0 13" stroke="rgba(233,251,255,0.38)" strokeWidth="0.7" />
          </pattern>
        </defs>

        <rect width="1000" height="430" fill="url(#photoelectricBackdrop)" />
        <g className="tubeSceneShell" transform={`translate(500 215) scale(${diagramScale}) rotate(${diagramTilt}) translate(-500 -215)`}>
          <g className="tubeReferenceGrid" clipPath="url(#photoelectricChamberClip)">
            {Array.from({ length: 12 }, (_, index) => (
              <path
                key={`grid-h-${index}`}
                d={`M ${chamberX + 56} ${chamberY + 28 + index * 21} H ${chamberX + chamberWidth - 56}`}
              />
            ))}
            {Array.from({ length: 18 }, (_, index) => (
              <path
                key={`grid-v-${index}`}
                d={`M ${chamberX + 62 + index * 42} ${chamberY + 26} V ${chamberY + chamberHeight - 26}`}
              />
            ))}
          </g>

          <rect className="tubeChamberFill" x={chamberX} y={chamberY} width={chamberWidth} height={chamberHeight} rx="104" fill="url(#photoelectricGlass)" />
          <rect className="tubeChamberEdge" x={chamberX} y={chamberY} width={chamberWidth} height={chamberHeight} rx="104" fill="none" stroke="url(#photoelectricGlassEdge)" />
          <path
            className="tubeGlassHighlight"
            d={`M ${chamberX + 76} ${chamberY + 42} C ${chamberX + 210} ${chamberY + 10}, ${chamberX + chamberWidth - 210} ${chamberY + 12}, ${chamberX + chamberWidth - 78} ${chamberY + 44}`}
          />
          <path
            className="tubeGlassHighlight lower"
            d={`M ${chamberX + 104} ${chamberY + chamberHeight - 34} C ${chamberX + 246} ${chamberY + chamberHeight - 8}, ${chamberX + chamberWidth - 246} ${chamberY + chamberHeight - 8}, ${chamberX + chamberWidth - 104} ${chamberY + chamberHeight - 34}`}
          />

          <g className="tubeSource">
            <path d="M 84 118 L 130 92 L 153 116 L 151 169 L 126 191 L 84 166 Z" />
            <circle cx="130" cy="143" r="31" />
            <path d="M 104 143 H 70" />
            <path d="M 130 112 C 146 126, 147 160, 130 177" />
            <text x="82" y="213">Tunable Source</text>
          </g>

          <path
            className="tubePhotonBeam"
            d={`M ${lensX - 6} ${lensY - beamWidth / 2} C ${lensX + 62} ${lensY + 20 - beamWidth / 2}, ${impactX - 90} ${impactY - 28 - beamWidth / 2}, ${impactX + 2} ${impactY - 8}
              L ${impactX + 2} ${impactY + 8} C ${impactX - 90} ${impactY + 28 + beamWidth / 2}, ${lensX + 62} ${lensY + 20 + beamWidth / 2}, ${lensX - 6} ${lensY + beamWidth / 2} Z`}
            fill="url(#photoelectricBeam)"
          />
          {Array.from({ length: photonCount }, (_, index) => (
            <circle
              key={`photon-${index}`}
              className="tubePhotonParticle"
              r={3.2 + (index % 3) * 0.45}
              fill={state.color}
              opacity={0.42 + state.intensity * 0.48}
            >
              <animateMotion
                dur={`${animationDuration}s`}
                begin={`${-(index / photonCount) * animationDuration}s`}
                repeatCount="indefinite"
              >
                <mpath href="#photoelectricPhotonPath" />
              </animateMotion>
            </circle>
          ))}

          <g className="tubeCathode" filter="url(#photoelectricMetalShadow)">
            <path
              className="tubeCathodeFrame"
              d={`M ${cathodeX - 20} 124 C ${cathodeX - 48} 162, ${cathodeX - 48} 266, ${cathodeX - 20} 304 L ${cathodeX + 54} 286 C ${cathodeX + 38} 236, ${cathodeX + 38} 188, ${cathodeX + 54} 140 Z`}
            />
            <path
              className="tubeCathodeFace"
              d={`M ${cathodeX - 5} 139 C ${cathodeX - 24} 170, ${cathodeX - 25} 256, ${cathodeX - 4} 290 L ${cathodeX + 44} 277 C ${cathodeX + 32} 234, ${cathodeX + 32} 191, ${cathodeX + 44} 152 Z`}
              fill="url(#photoelectricCathodeMetal)"
            />
            <path
              className="tubeCathodeBrush"
              d={`M ${cathodeX + 6} 157 C ${cathodeX - 4} 190, ${cathodeX - 4} 240, ${cathodeX + 6} 272`}
            />
            <path
              className="tubeCathodeBrush second"
              d={`M ${cathodeX + 24} 154 C ${cathodeX + 14} 190, ${cathodeX + 14} 242, ${cathodeX + 24} 276`}
            />
          </g>

          <g className="tubeImpactPatch" filter="url(#photoelectricSoftGlow)">
            <ellipse cx={impactX} cy={impactY} rx={18 + state.beamFocus * 12} ry={23 + state.beamFocus * 10} fill={state.color} opacity={0.13 + state.intensity * 0.24} />
            <ellipse cx={impactX} cy={impactY} rx={7.5 + state.beamFocus * 5} ry={10 + state.beamFocus * 5} fill="#e9fbff" opacity={0.22 + state.intensity * 0.38} />
            <circle className="tubeSparkRing" cx={impactX} cy={impactY} r={18 + state.beamFocus * 8} stroke={state.color} />
          </g>

          <g className="tubeFieldVolume" opacity={stoppingStress > 0.025 ? 1 : 0.34}>
            <rect
              x={fieldX - 62}
              y={chamberY + 35}
              width="124"
              height={chamberHeight - 70}
              rx="34"
              fill="url(#photoelectricRetardingField)"
            />
            {Array.from({ length: 7 }, (_, index) => (
              <path
                key={`field-${index}`}
                d={`M ${fieldX - 42} ${chamberY + 66 + index * 25} C ${fieldX - 12} ${chamberY + 56 + index * 25}, ${fieldX + 22} ${chamberY + 56 + index * 25}, ${fieldX + 50} ${chamberY + 66 + index * 25}`}
                opacity={0.18 + stoppingStress * 0.42}
              />
            ))}
          </g>

          <g className="tubeElectronPaths">
            {electronPaths.map((path, index) => (
              <path
                key={path.id}
                id={path.id}
                d={path.d}
                opacity={electronDensity * (path.collected ? 0.58 : 0.28)}
                className={path.collected ? "collected" : "stopped"}
              />
            ))}
          </g>
          {state.emission ? (
            <g className="tubeElectrons" filter="url(#photoelectricSoftGlow)">
              {electronPaths.slice(0, electronCount).map((path, index) => (
                <circle
                  key={`electron-${path.id}`}
                  className={path.collected ? "tubeElectronParticle collected" : "tubeElectronParticle stopped"}
                  r={path.collected ? 3.4 : 3}
                  opacity={electronDensity * (path.collected ? 0.9 : 0.58)}
                >
                  <animateMotion
                    dur={`${electronDuration * (path.collected ? 1 : 1.22)}s`}
                    begin={`${-(index / Math.max(electronCount, 1)) * electronDuration}s`}
                    repeatCount="indefinite"
                  >
                    <mpath href={`#${path.id}`} />
                  </animateMotion>
                </circle>
              ))}
            </g>
          ) : (
            <g className="tubeThresholdLock">
              <path d={`M ${impactX + 34} ${impactY - 48} C ${impactX + 70} ${impactY - 28}, ${impactX + 70} ${impactY + 28}, ${impactX + 34} ${impactY + 48}`} />
              <text x={impactX + 54} y={impactY + 5}>Below Threshold</text>
            </g>
          )}

          <g className="tubeCollector" filter="url(#photoelectricMetalShadow)">
            <rect x={collectorX - 20} y={118} width="40" height="192" rx="14" fill="url(#photoelectricCollectorMetal)" />
            <rect x={collectorX - 14} y={132} width="28" height="164" rx="10" fill="url(#photoelectricMeshPattern)" opacity="0.82" />
            {Array.from({ length: 8 }, (_, index) => (
              <path
                key={`collector-line-${index}`}
                d={`M ${collectorX - 12} ${142 + index * 19} H ${collectorX + 12}`}
                className="tubeCollectorLine"
              />
            ))}
            <path className="tubeCollectorLead" d={`M ${collectorX} 310 C ${collectorX + 16} 348, ${collectorX + 62} 354, ${collectorX + 92} 332`} />
          </g>

          <g className="tubeCircuitTraces">
            <path d={`M ${cathodeX + 5} 304 C ${cathodeX - 10} 362, ${collectorX + 60} 374, ${collectorX + 92} 332`} />
            <rect x={collectorX + 102} y="310" width="78" height="42" rx="8" />
            <path d={`M ${collectorX + 118} 331 H ${collectorX + 166}`} />
            <text x={collectorX + 118} y="303">Electrometer</text>
          </g>

          {(labelsVisible || valuesVisible) ? (
            <g className="tubeCalloutLayer">
              {(valuesVisible ? valueCallouts : labelCallouts).map((callout) => (
                <SceneCallout key={`${callout.label ?? callout.math}-${callout.x}-${callout.y}`} callout={callout} value={valuesVisible} />
              ))}
            </g>
          ) : null}
        </g>
      </svg>
    </div>
  );
}
