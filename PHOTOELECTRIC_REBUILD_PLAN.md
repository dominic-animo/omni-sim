# Photoelectric Effect Rebuild Plan

## Governing Conclusion

The current direction is wrong if it tries to be a rotating 3D object. The strongest photoelectric effect visuals are mostly side-on instrument schematics, not free-orbit 3D props.

The main simulator should be a premium 2.5D cutaway phototube. Three.js can return later as an optional apparatus view, but the teaching view should be a polished, controlled Canvas/SVG-style diagram.

## Reference Patterns

- Metal-surface diagrams show photons hitting one surface and electrons leaving that same surface. They are clear, but too textbook for the final aesthetic. Reference: [Wikimedia Solid Diagram](https://commons.wikimedia.org/wiki/File:Photoelectric_effect_in_a_solid_-_diagram.svg).
- Apparatus diagrams show cathode/emitter, anode/collector, voltage source, and current meter. This is the most physically useful structure. Reference: [Photoelectric Diode Forward-Bias Diagram](https://commons.wikimedia.org/wiki/File:Photoelectric_diode_forward_bias.svg).
- PhET-style simulations use a lamp, target plate, collector, battery/voltage, and current graph. Their value is clear causal mapping: wavelength changes photon energy, intensity changes count, voltage changes collection. Reference: [PhET Photoelectric Simulation](https://rachel.core2learn.org/modules/en-phet-static/en/simulation/photoelectric.html).
- Wikimedia variants mostly succeed when they use the side-on sequence light -> emitter -> electrons -> collector, not rotating plates. Reference: [Photoelectric Effect Category](https://commons.wikimedia.org/wiki/Category:Photoelectric_effect).

## Premium Apparatus Layout

- A horizontal glass vacuum tube or chamber, side-on.
- UV/visible light source on the left, entering through a subtle quartz window.
- A curved or angled metallic photocathode inside the tube.
- A fine anode mesh or collector ring on the right.
- Photons hit a small illuminated patch on the cathode.
- Electrons emerge from that exact patch and fly toward the anode.
- Retarding voltage appears as a magenta electric-field region that bends or stops electrons.

## Physics Rules To Show

- Below threshold: photons still hit, but no electrons leave; show a faint "barrier not crossed" surface pulse.
- Intensity controls photon and electron count.
- Wavelength controls photon color and photon energy.
- Voltage controls trajectory curvature and collection.
- Work function changes the threshold marker and surface barrier.
- Higher frequency produces faster emitted electrons.
- Higher intensity does not increase each electron's maximum kinetic energy.
- Stopping voltage drives collector current toward zero when the retarding potential matches maximum kinetic energy.

## Aesthetic Target

- Dark glass tube with thin neon refraction edges, not a big literal tube wall.
- Metallic cathode with subtle brushed shader/highlight, not a brown slab.
- Electrons as small cyan streaks and trails, not large balls.
- Photons as tight luminous packets on a beam path.
- Anode as elegant mesh/grid, not a blue rectangle.
- Field lines as faint ordered contours, not clutter.
- Mostly orthographic side-view so the physics reads instantly.
- Labels off by default.
- Labels and values should use leader lines with small circular endpoint markers.
- Avoid opaque geometry between the viewer and the electrons.

## Implementation Constraints

- Prefer SVG or Canvas for the main view so the result is art-directed and physically legible.
- Keep the existing controls, equations, metrics, Explain, History, labels, values, and fullscreen wrapper unless there is a clear reason to change them.
- Replace or polish the visual scene first, then judge it with browser screenshots before touching wider architecture.
- Use multiple visual passes and screenshots before calling the rebuild acceptable.
