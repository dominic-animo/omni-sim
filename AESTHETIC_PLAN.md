# Aesthetic Plan

## Direction

The app should feel like a scientific instrument from a refined near-future lab: precise, luminous, and information dense. The goal is not generic dark SaaS, glassmorphism, or decorative gradients. Every visual flourish should imply measurement, energy, material, optics, fields, or instrumentation.

## Core Principles

- **Objects First:** The simulation subject should be the strongest visual signal. Controls and panels support it; they should not compete with it.
- **Physical Materials:** Use polished metal, ceramic, glass, emissive plasma, charge glow, field haze, and contact shadows. Avoid flat colored boxes when an object represents a real material.
- **Readable Neon:** Cyan, magenta, gold, and signal green are accents, not flood fills. Effects should reveal motion, thresholds, vectors, and measured values.
- **Dense Instrument Panels:** Controls should feel like lab hardware: compact sliders, click-to-edit numeric readouts, preset chips, telemetry cards, and low-empty-space layouts.
- **Scientific Graphs:** Charts should look like scope readouts with grid ticks, active cursors, glowing traces, units, and stable scales.
- **Motion With Meaning:** Animations should teach: waves propagate, charges drift, vectors rotate, objects bounce with believable energy loss, and fades indicate damping or distance.

## Shared Visual System

### Materials

- **Polished Metal:** Clearcoat highlights, brushed grooves, rim glints, bolts, frames, and warm/cool reflections.
- **Glass / Vacuum:** Transparent panes, faint edge glow, depth fog, and refraction-like gradients only where they help visualize containment.
- **Fields:** Subtle line lattices, contour rings, and particle trails attached to actual sources, charges, or wavefronts.
- **Measurement Hardware:** Rulers, tick rails, voltage rails, detector screens, clamps, probes, reticles, and readout cursors.

### Scene Composition

- Keep every simulator’s main object in a stable central zone.
- Use foreground instrumentation sparingly: brackets, tiny calibration ticks, and non-blocking labels.
- Labels default off and should use leader lines with endpoint circles where available.
- Value callouts should be visually distinct from labels and point to measurements, vectors, or regions.

### Panels And Controls

- Use compact grouped controls with clear micro-hierarchy.
- Keep sliders thin and precise.
- Make numeric input a subtle click-on-value interaction.
- Add preset modes when they teach common scenarios faster than manual tuning.
- Avoid large empty card surfaces. Panels should feel purposeful and instrument-like.

### Graphs

- Add quiet grid lines, trace glow, fill haze, and cursor lines.
- Always show meaningful units.
- Use LaTeX-style fonts for symbols, values, and units.
- Hover explanations should use rendered math and plain-English translation.

## Implementation Passes

### Implemented In This Pass

- Add this documented aesthetic plan as a project reference.
- Upgrade shared mini charts into scope-like readouts with grid lines, active cursors, filled traces, and glow hierarchy.
- Polish shared panels, metrics, and control docks with a more instrument-like material language.
- Add photoelectric scene presets so the simulator can quickly shift between common visually meaningful regimes.

### Next High-Leverage Pass

- Extract a shared `SceneChrome` layer for calibration ticks, corner brackets, and depth grids.
- Extract a shared `CalloutLayer` with leader lines, endpoint dots, collision-aware placement, and label/value variants.
- Add optional scene presets to every major physics simulator.
- Add material presets for common visual primitives: metal plate, charged particle, detector screen, wavefront, vector arrow, and energy trail.
- Run screenshot baselines for all existing simulators and keep a visual QA checklist in the repo.

## Simulator-Specific Notes

- **Photoelectric Effect:** Lean into polished plates, frame hardware, measured voltage rails, photon/electron trails, stopping-potential mode, near-threshold mode, and high-energy ultraviolet mode.
- **Double Slit:** Make waves continuous to boundaries, use detector phosphor glow, and show slit geometry as a real barrier with clean diffraction fronts.
- **Projectile Motion:** Emphasize path ghosts, bounce/roll energy transfer, floor contact, and vector arrows that are thin and precise.
- **Unit Circle:** Improve animation pacing, phase tracing, projection guides, and common-angle presets.
- **Electric Circuits:** Use clear component symbols, animated charge flow, voltage color ramps, and compact readouts near actual components.
