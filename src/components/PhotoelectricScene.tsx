import { useEffect, useRef } from "react";
import katex from "katex";
import * as THREE from "three";
import { CSS2DObject, CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer.js";
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

type MovingParticle = {
  mesh: THREE.Mesh;
  speed: number;
  lane: number;
  phase: number;
};

function renderSceneValue(element: HTMLElement, math: string) {
  katex.render(math, element, {
    throwOnError: false,
    strict: false,
  });
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
  const mountRef = useRef<HTMLDivElement | null>(null);
  const latest = useRef({
    state,
    metalColor,
    paused,
    speed,
    viewRotation,
    viewZoom,
    collectorSpacingCm,
    labelsVisible,
    valuesVisible,
  });

  useEffect(() => {
    latest.current = {
      state,
      metalColor,
      paused,
      speed,
      viewRotation,
      viewZoom,
      collectorSpacingCm,
      labelsVisible,
      valuesVisible,
    };
  }, [state, metalColor, paused, speed, viewRotation, viewZoom, collectorSpacingCm, labelsVisible, valuesVisible]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x102832, 0.044);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 3.7, 9);
    camera.lookAt(0.25, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    mount.appendChild(renderer.domElement);

    const labelRenderer = new CSS2DRenderer();
    labelRenderer.domElement.className = "sceneLabelLayer";
    mount.appendChild(labelRenderer.domElement);

    const ambient = new THREE.AmbientLight(0xa8d9ff, 1.4);
    scene.add(ambient);

    const fill = new THREE.HemisphereLight(0xe9fbff, 0x203040, 1.85);
    scene.add(fill);

    const key = new THREE.PointLight(0x58f0ff, 7, 20);
    key.position.set(-4, 5, 5);
    scene.add(key);

    const copper = new THREE.PointLight(0xffa15f, 4, 16);
    copper.position.set(4, 2, 2);
    scene.add(copper);

    const rim = new THREE.PointLight(0xf8fdff, 5.2, 18);
    rim.position.set(2.8, 4.5, -4.5);
    scene.add(rim);

    const frontSheen = new THREE.PointLight(0xffe0a5, 3.2, 12);
    frontSheen.position.set(-1.8, 1.9, 4.2);
    scene.add(frontSheen);

    const floorGeometry = new THREE.PlaneGeometry(12, 8, 36, 16);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x17313b,
      emissive: 0x0c222d,
      metalness: 0.25,
      roughness: 0.55,
      wireframe: true,
      transparent: true,
      opacity: 0.26,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.8;
    scene.add(floor);

    const guideMaterial = new THREE.MeshBasicMaterial({
      color: 0xff4df0,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const guideGeometry = new THREE.BoxGeometry(6.1, 0.014, 0.014);
    const topGuide = new THREE.Mesh(guideGeometry, guideMaterial);
    const bottomGuide = new THREE.Mesh(guideGeometry, guideMaterial);
    topGuide.position.set(0.35, 1.42, 1.24);
    bottomGuide.position.set(0.35, -1.42, -1.24);
    scene.add(topGuide, bottomGuide);


    const brushedTextureCanvas = document.createElement("canvas");
    brushedTextureCanvas.width = 128;
    brushedTextureCanvas.height = 128;
    const brushedContext = brushedTextureCanvas.getContext("2d");
    if (brushedContext) {
      brushedContext.fillStyle = "#888";
      brushedContext.fillRect(0, 0, 128, 128);
      for (let y = 0; y < 128; y += 1) {
        const line = 120 + Math.floor(Math.random() * 24);
        brushedContext.fillStyle = `rgb(${line}, ${line}, ${line})`;
        brushedContext.fillRect(0, y, 128, 1);
      }
    }
    const brushedTexture = new THREE.CanvasTexture(brushedTextureCanvas);
    brushedTexture.wrapS = THREE.RepeatWrapping;
    brushedTexture.wrapT = THREE.RepeatWrapping;
    brushedTexture.repeat.set(1, 5.5);
    brushedTexture.anisotropy = 4;

    const metalMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(metalColor),
      emissive: new THREE.Color(metalColor).multiplyScalar(0.08),
      metalness: 0.68,
      roughness: 0.3,
      roughnessMap: brushedTexture,
      normalMap: brushedTexture,
      normalScale: new THREE.Vector2(0.22, 0.08),
      clearcoat: 0.64,
      clearcoatRoughness: 0.18,
      reflectivity: 0.58,
    });
    const emitterFrameMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf4c95d,
      emissive: 0x5a370a,
      metalness: 1,
      roughness: 0.1,
      clearcoat: 0.7,
      clearcoatRoughness: 0.1,
      transparent: true,
      opacity: 0.9,
    });
    const emitterSlotMaterial = new THREE.MeshBasicMaterial({
      color: 0x7ff8ff,
      transparent: true,
      opacity: 0.34,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const plate = new THREE.Group();
    const emitterCoreGeometry = new THREE.BoxGeometry(0.22, 3.15, 3.15);
    const emitterCore = new THREE.Mesh(emitterCoreGeometry, metalMaterial);
    const brushedLineMaterial = new THREE.MeshBasicMaterial({
      color: 0xf4c95d,
      transparent: true,
      opacity: 0.018,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const darkGrooveMaterial = new THREE.MeshBasicMaterial({
      color: 0x7ff8ff,
      transparent: true,
      opacity: 0.022,
      depthWrite: false,
    });
    const plateGlintMaterial = new THREE.MeshBasicMaterial({
      color: 0xf4c95d,
      transparent: true,
      opacity: 0.06,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const warmReflectionMaterial = new THREE.MeshBasicMaterial({
      color: 0xffd88a,
      transparent: true,
      opacity: 0.07,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const coolReflectionMaterial = new THREE.MeshBasicMaterial({
      color: 0x9dfbff,
      transparent: true,
      opacity: 0.06,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const boltMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf7efe0,
      emissive: 0x1b2730,
      metalness: 1,
      roughness: 0.12,
      clearcoat: 0.8,
      clearcoatRoughness: 0.08,
      reflectivity: 0.9,
    });
    const brushedLineGeometry = new THREE.BoxGeometry(0.011, 2.65, 0.009);
    const darkGrooveGeometry = new THREE.BoxGeometry(0.012, 2.82, 0.01);
    const plateGlintGeometry = new THREE.BoxGeometry(0.014, 1.2, 0.018);
    const reflectionBandGeometry = new THREE.BoxGeometry(0.018, 1.75, 0.055);
    const boltGeometry = new THREE.SphereGeometry(0.075, 18, 12);
    const emitterSurfaceDetails = new THREE.Group();
    for (let i = 0; i < 5; i += 1) {
      const line = new THREE.Mesh(i % 3 === 0 ? darkGrooveGeometry : brushedLineGeometry, i % 3 === 0 ? darkGrooveMaterial : brushedLineMaterial);
      line.position.set(0.116, 0, -0.82 + i * 0.42);
      emitterSurfaceDetails.add(line);
    }
    const emitterGlintA = new THREE.Mesh(plateGlintGeometry, plateGlintMaterial);
    emitterGlintA.position.set(0.121, 0.88, -0.92);
    emitterGlintA.rotation.x = 0.68;
    const emitterGlintB = new THREE.Mesh(plateGlintGeometry, plateGlintMaterial);
    emitterGlintB.position.set(0.122, -0.72, 0.88);
    emitterGlintB.rotation.x = 0.68;
    const emitterReflectionA = new THREE.Mesh(reflectionBandGeometry, warmReflectionMaterial);
    emitterReflectionA.position.set(0.128, 0.34, -0.38);
    emitterReflectionA.rotation.x = 0.74;
    const emitterReflectionB = new THREE.Mesh(reflectionBandGeometry, coolReflectionMaterial);
    emitterReflectionB.position.set(0.129, -0.46, 0.54);
    emitterReflectionB.rotation.x = 0.74;
    emitterSurfaceDetails.add(emitterGlintA, emitterGlintB, emitterReflectionA, emitterReflectionB);
    const emitterFrameGeometry = new THREE.BoxGeometry(0.34, 3.5, 0.095);
    const emitterFrameTop = new THREE.Mesh(emitterFrameGeometry, emitterFrameMaterial);
    const emitterFrameBottom = new THREE.Mesh(emitterFrameGeometry, emitterFrameMaterial);
    emitterFrameTop.position.z = 1.65;
    emitterFrameBottom.position.z = -1.65;
    const emitterFrameSideGeometry = new THREE.BoxGeometry(0.34, 0.095, 3.5);
    const emitterFrameUpper = new THREE.Mesh(emitterFrameSideGeometry, emitterFrameMaterial);
    const emitterFrameLower = new THREE.Mesh(emitterFrameSideGeometry, emitterFrameMaterial);
    emitterFrameUpper.position.y = 1.65;
    emitterFrameLower.position.y = -1.65;
    [-1, 1].forEach((ySign) => {
      [-1, 1].forEach((zSign) => {
        const bolt = new THREE.Mesh(boltGeometry, boltMaterial);
        bolt.position.set(0.155, ySign * 1.38, zSign * 1.38);
        emitterSurfaceDetails.add(bolt);
      });
    });
    const emitterSlotGeometry = new THREE.BoxGeometry(0.245, 0.035, 1.45);
    const emitterFrontGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0x7ff8ff,
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const emitterFrontGlow = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 2.85), emitterFrontGlowMaterial);
    emitterFrontGlow.position.set(-0.125, 0, -1.58);
    emitterFrontGlow.rotation.y = Math.PI / 2;
    plate.add(emitterCore, emitterSurfaceDetails, emitterFrameTop, emitterFrameBottom, emitterFrameUpper, emitterFrameLower, emitterFrontGlow);
    for (let i = 0; i < 5; i += 1) {
      const slot = new THREE.Mesh(emitterSlotGeometry, emitterSlotMaterial);
      slot.position.set(-0.015, -1.0 + i * 0.5, -1.58);
      plate.add(slot);
    }
    plate.position.x = -1.4;
    scene.add(plate);

    const collectorMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xd7f2ff,
      emissive: 0x10394a,
      metalness: 0.78,
      roughness: 0.18,
      clearcoat: 0.58,
      clearcoatRoughness: 0.14,
      reflectivity: 0.66,
    });
    const collectorAccentMaterial = new THREE.MeshBasicMaterial({
      color: 0x7ff8ff,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const collector = new THREE.Group();
    const collectorCoreGeometry = new THREE.BoxGeometry(0.18, 2.75, 2.75);
    const collectorCore = new THREE.Mesh(collectorCoreGeometry, collectorMaterial);
    const collectorSurfaceDetails = new THREE.Group();
    for (let i = 0; i < 5; i += 1) {
      const line = new THREE.Mesh(i % 2 ? brushedLineGeometry : darkGrooveGeometry, i % 2 ? brushedLineMaterial : darkGrooveMaterial);
      line.position.set(-0.098, 0, -0.84 + i * 0.42);
      collectorSurfaceDetails.add(line);
    }
    const collectorGlint = new THREE.Mesh(plateGlintGeometry, plateGlintMaterial);
    collectorGlint.position.set(-0.102, 0.7, 0.72);
    collectorGlint.rotation.x = -0.62;
    const collectorReflectionA = new THREE.Mesh(reflectionBandGeometry, coolReflectionMaterial);
    collectorReflectionA.position.set(-0.106, 0.28, -0.52);
    collectorReflectionA.rotation.x = -0.74;
    const collectorReflectionB = new THREE.Mesh(reflectionBandGeometry, warmReflectionMaterial);
    collectorReflectionB.position.set(-0.107, -0.58, 0.54);
    collectorReflectionB.rotation.x = -0.74;
    [-1, 1].forEach((ySign) => {
      [-1, 1].forEach((zSign) => {
        const bolt = new THREE.Mesh(boltGeometry, boltMaterial);
        bolt.position.set(-0.124, ySign * 1.16, zSign * 1.16);
        collectorSurfaceDetails.add(bolt);
      });
    });
    collectorSurfaceDetails.add(collectorGlint, collectorReflectionA, collectorReflectionB);
    const collectorStripeGeometry = new THREE.BoxGeometry(0.19, 2.42, 0.035);
    const collectorStripeA = new THREE.Mesh(collectorStripeGeometry, collectorAccentMaterial);
    const collectorStripeB = new THREE.Mesh(collectorStripeGeometry, collectorAccentMaterial);
    collectorStripeA.position.z = 0.62;
    collectorStripeB.position.z = -0.62;
    const collectorNodeGeometry = new THREE.SphereGeometry(0.065, 16, 16);
    for (let i = 0; i < 6; i += 1) {
      const node = new THREE.Mesh(collectorNodeGeometry, collectorAccentMaterial);
      node.position.set(-0.12, -1.0 + i * 0.4, 1.25);
      collector.add(node);
    }
    collector.add(collectorCore, collectorSurfaceDetails, collectorStripeA, collectorStripeB);
    collector.position.x = 2.1;
    scene.add(collector);

    const beamMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(state.color),
      transparent: true,
      opacity: 0.34,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.075, 3.55, 24),
      beamMaterial,
    );
    beam.rotation.z = Math.PI / 2;
    beam.position.x = -3.15;
    scene.add(beam);

    const photonGeometry = new THREE.SphereGeometry(0.07, 16, 16);
    const electronGeometry = new THREE.SphereGeometry(0.055, 16, 16);
    const photonMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(state.color),
      transparent: true,
      opacity: 0.96,
      depthWrite: false,
    });
    const electronMaterial = new THREE.MeshBasicMaterial({
      color: 0x7ff8ff,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    });

    const photons: MovingParticle[] = Array.from({ length: 34 }, (_, index) => {
      const mesh = new THREE.Mesh(photonGeometry, photonMaterial);
      const lane = (index % 7) - 3;
      const phase = index / 34;
      mesh.position.set(-5 + phase * 3.35, lane * 0.18, Math.sin(index) * 0.32);
      scene.add(mesh);
      return { mesh, lane, phase, speed: 0.014 + (index % 4) * 0.002 };
    });

    const electrons: MovingParticle[] = Array.from({ length: 26 }, (_, index) => {
      const mesh = new THREE.Mesh(electronGeometry, electronMaterial);
      mesh.position.set(-1.28, 0, 0);
      scene.add(mesh);
      return {
        mesh,
        lane: (index % 9) - 4,
        phase: index / 26,
        speed: 0.007 + (index % 6) * 0.0014,
      };
    });

    const fieldLines = new THREE.Group();
    for (let i = 0; i < 9; i += 1) {
      const points = [
        new THREE.Vector3(-1.2, -1.15 + i * 0.28, -1.55),
        new THREE.Vector3(0.3, -1.0 + i * 0.25, -0.3),
        new THREE.Vector3(1.95, -1.15 + i * 0.28, 1.25),
      ];
      const curve = new THREE.CatmullRomCurve3(points);
      const geometry = new THREE.TubeGeometry(curve, 24, 0.01, 8, false);
      const material = new THREE.MeshBasicMaterial({
        color: i % 2 ? 0x47f3c5 : 0xffb86c,
        transparent: true,
        opacity: 0.22,
      });
      fieldLines.add(new THREE.Mesh(geometry, material));
    }
    scene.add(fieldLines);

    const retardingCurtainMaterial = new THREE.MeshBasicMaterial({
      color: 0xff4df0,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const retardingCurtainGeometry = new THREE.PlaneGeometry(2.85, 3.1, 1, 1);
    const retardingCurtain = new THREE.Mesh(retardingCurtainGeometry, retardingCurtainMaterial);
    retardingCurtain.rotation.y = Math.PI / 2;
    retardingCurtain.visible = false;
    scene.add(retardingCurtain);

    const electronPathGroup = new THREE.Group();
    const electronPathGeometries: THREE.BufferGeometry[] = [];
    const electronPathMaterials: THREE.LineBasicMaterial[] = [];
    const electronPathLines = Array.from({ length: 7 }, (_, index) => {
      const geometry = new THREE.BufferGeometry();
      const material = new THREE.LineBasicMaterial({
        color: index % 2 ? 0x7ff8ff : 0xa9ef78,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const line = new THREE.Line(geometry, material);
      electronPathGeometries.push(geometry);
      electronPathMaterials.push(material);
      electronPathGroup.add(line);
      return line;
    });
    scene.add(electronPathGroup);

    const makeLabel = (text: string, className = "sceneTag") => {
      const element = document.createElement("div");
      element.className = className;
      element.textContent = text;
      return new CSS2DObject(element);
    };

    const emitterLabel = makeLabel("Emitter Plate");
    emitterLabel.position.set(-0.1, 1.92, 0);
    plate.add(emitterLabel);

    const collectorLabel = makeLabel("Collector Plate");
    collectorLabel.position.set(0.1, 1.65, 0);
    collector.add(collectorLabel);

    const beamLabel = makeLabel("Photon Beam");
    beamLabel.position.set(-3.72, 0.92, -0.34);
    scene.add(beamLabel);

    const electronLabel = makeLabel("Emitted Electrons");
    electronLabel.position.set(-0.05, 0.82, 0.76);
    scene.add(electronLabel);

    const fieldLabel = makeLabel("Electric Field Lines");
    fieldLabel.position.set(0.45, -1.15, 1.34);
    scene.add(fieldLabel);

    const guideLabel = makeLabel("Measurement Guides");
    guideLabel.position.set(1.1, 1.78, -1.18);
    scene.add(guideLabel);

    const sceneLabels = [
      emitterLabel,
      collectorLabel,
      beamLabel,
      electronLabel,
      fieldLabel,
      guideLabel,
    ];

    const photonEnergyValue = makeLabel("", "sceneTag sceneValueTag");
    photonEnergyValue.position.set(-3.78, 1.06, 0.46);
    scene.add(photonEnergyValue);

    const kineticEnergyValue = makeLabel("", "sceneTag sceneValueTag");
    kineticEnergyValue.position.set(0.05, 1.05, 0.96);
    scene.add(kineticEnergyValue);

    const currentValue = makeLabel("", "sceneTag sceneValueTag");
    currentValue.position.set(0.82, -0.92, 0.95);
    scene.add(currentValue);

    const fieldValue = makeLabel("", "sceneTag sceneValueTag");
    fieldValue.position.set(0.35, -1.38, 1.46);
    scene.add(fieldValue);

    const sceneValues = [
      photonEnergyValue,
      kineticEnergyValue,
      currentValue,
      fieldValue,
    ];
    const valueMathCache = new Map<HTMLElement, string>();
    const setSceneValue = (element: HTMLElement, math: string) => {
      if (valueMathCache.get(element) === math) return;
      valueMathCache.set(element, math);
      renderSceneValue(element, math);
    };

    const resize = () => {
      const { clientWidth, clientHeight } = mount;
      renderer.setSize(clientWidth, clientHeight, false);
      labelRenderer.setSize(clientWidth, clientHeight);
      camera.aspect = clientWidth / Math.max(clientHeight, 1);
      camera.updateProjectionMatrix();
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    let animationId = 0;
    let t = 0;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const {
        state: current,
        metalColor: currentMetal,
        paused: isPaused,
        speed: currentSpeed,
        viewRotation: currentRotation,
        viewZoom: currentZoom,
        collectorSpacingCm: currentSpacing,
        labelsVisible: showLabels,
        valuesVisible: showValues,
      } = latest.current;
      if (!isPaused) t += currentSpeed;

      const rotationRadians = (currentRotation * Math.PI) / 180;
      const distance = 9 / currentZoom;
      camera.position.x = Math.sin(rotationRadians) * distance;
      camera.position.z = Math.cos(rotationRadians) * distance;
      camera.position.y = 3.2 + Math.cos(rotationRadians * 0.75) * 0.5;
      camera.lookAt(0.25, -0.08, 0);

      const photonColor = new THREE.Color(current.color);
      beamMaterial.color.copy(photonColor);
      beamMaterial.opacity = 0.24 + current.electronRate * 0.36;
      beam.scale.set(current.beamFocus * 0.6 + 0.55, 1, current.beamFocus * 0.6 + 0.55);
      photonMaterial.color.copy(photonColor);
      photonMaterial.opacity = 0.46 + current.intensity * 0.54;

      const metal = new THREE.Color(currentMetal);
      metalMaterial.color.copy(metal).lerp(new THREE.Color(0xffe0a5), 0.34);
      metalMaterial.emissive.copy(metal).multiplyScalar(current.emission ? 0.18 : 0.1);
      metalMaterial.roughness = current.emission ? 0.24 : 0.32;
      plateGlintMaterial.opacity = 0.035 + current.relativeCurrent * 0.04;

      plate.rotation.y = Math.sin(t * 0.009) * 0.035;
      collector.rotation.y = -plate.rotation.y;
      emitterSurfaceDetails.rotation.x = Math.sin(t * 0.006) * 0.015;
      collectorSurfaceDetails.rotation.x = -Math.sin(t * 0.006) * 0.012;
      collector.position.x = -0.45 + Math.min(4.2, Math.max(1.1, currentSpacing * 0.42));
      const emitterSurfaceX = plate.position.x + 0.18;
      const emitterEmissionZ = -1.46;
      const collectorFaceX = collector.position.x - 0.16;
      const flightSpan = Math.max(0.2, collectorFaceX - emitterSurfaceX);
      const collectionFraction = Math.max(0, Math.min(1, current.collectionFraction));
      const stoppingStress = Math.max(0, Math.min(1, current.stoppingRatio));
      const curtainProgress = Math.max(0.28, Math.min(0.72, 0.72 - collectionFraction * 0.38));
      retardingCurtain.position.set(emitterSurfaceX + flightSpan * curtainProgress, 0, 0);
      retardingCurtainMaterial.opacity = stoppingStress > 0.02 ? 0.04 + stoppingStress * 0.22 : 0;
      retardingCurtain.visible = stoppingStress > 0.04;
      retardingCurtain.scale.setScalar(0.92 + stoppingStress * 0.18);
      electronLabel.position.x = (plate.position.x + collector.position.x) / 2;
      fieldLabel.position.x = (plate.position.x + collector.position.x) / 2;
      guideLabel.position.x = (plate.position.x + collector.position.x) / 2 + 0.42;
      kineticEnergyValue.position.x = (plate.position.x + collector.position.x) / 2;
      currentValue.position.x = (plate.position.x + collector.position.x) / 2 + 0.68;
      fieldValue.position.x = (plate.position.x + collector.position.x) / 2;
      emitterFrameMaterial.opacity = 0.76 + current.relativeCurrent * 0.14;
      emitterSlotMaterial.opacity = 0.2 + current.electronRate * 0.36;
      emitterFrontGlowMaterial.opacity = 0.08 + current.electronRate * 0.24;
      collectorAccentMaterial.opacity = 0.38 + current.relativeCurrent * 0.34;
      warmReflectionMaterial.opacity = 0.1 + current.relativeCurrent * 0.08;
      coolReflectionMaterial.opacity = 0.09 + current.relativeCurrent * 0.08;
      guideMaterial.opacity = 0.12 + current.relativeCurrent * 0.32;
      fieldLines.rotation.x = Math.sin(t * 0.006) * 0.08;

      electronPathGroup.visible = current.emission && current.electronRate > 0.015;
      electronPathLines.forEach((line, index) => {
        const sequence = ((index * 5) % electronPathLines.length) / electronPathLines.length;
        const reachesCollector = collectionFraction > 0.04 && sequence < collectionFraction;
        const lane = index - (electronPathLines.length - 1) / 2;
        const laneY = lane * 0.16;
        const laneZ = Math.sin(index * 1.7) * 0.58;
        const maxProgress = reachesCollector ? 1 : 0.26 + collectionFraction * 0.42;
        const points = Array.from({ length: 26 }, (_, pointIndex) => {
          const progress = pointIndex / 25;
          const travel = reachesCollector ? progress * maxProgress : Math.sin(progress * Math.PI) * maxProgress;
          const y = laneY + Math.sin(progress * Math.PI) * (reachesCollector ? 0.22 : 0.42);
          const z = laneZ * (0.35 + 0.65 * Math.sin(progress * Math.PI));
          return new THREE.Vector3(emitterSurfaceX + travel * flightSpan, y, z);
        });
        line.geometry.setFromPoints(points);
        const material = line.material as THREE.LineBasicMaterial;
        material.opacity = current.electronRate * (reachesCollector ? 0.18 : 0.13) * (reachesCollector ? 0.42 + collectionFraction * 0.58 : 1);
      });

      photons.forEach((particle, index) => {
        if (!isPaused) {
          particle.phase += particle.speed * currentSpeed * (0.6 + current.electronRate);
        }
        particle.phase %= 1;
        particle.mesh.position.x = -5.1 + particle.phase * 3.7;
        particle.mesh.position.y =
          particle.lane * 0.16 + Math.sin(t * 0.05 + index) * 0.035;
        particle.mesh.position.z = Math.cos(t * 0.035 + index * 0.4) * 0.42;
        particle.mesh.scale.setScalar(0.82 + current.electronRate * 1.35);
        particle.mesh.visible = index / photons.length < 0.22 + current.electronRate * 0.78;
      });

      electrons.forEach((particle, index) => {
        const active = current.emission && index / electrons.length < current.electronRate;
        particle.mesh.visible = active;
        if (!active) return;
        const sequence = ((index * 7) % electrons.length) / electrons.length;
        const reachesCollector = collectionFraction > 0.04 && sequence < collectionFraction;

        if (!isPaused) {
          particle.phase +=
            particle.speed * (0.7 + current.maxKineticEnergyEv * 0.48) *
            currentSpeed *
            Math.max(0.15, current.relativeCurrent + 0.18);
        }
        particle.phase %= 1;
        const ease = 1 - Math.pow(1 - particle.phase, 2.2);
        const reflectedProgress = Math.sin(particle.phase * Math.PI) * (0.28 + collectionFraction * 0.42);
        particle.mesh.position.x = emitterSurfaceX + (reachesCollector ? ease : reflectedProgress) * flightSpan;
        particle.mesh.position.y =
          particle.lane * 0.12 +
          Math.sin(t * 0.04 + index) * 0.12 +
          (reachesCollector ? 0 : Math.sin(particle.phase * Math.PI) * 0.22);
        const lateralSpread = Math.sin(particle.phase * Math.PI * 2 + index * 0.8) * 0.08;
        const driftToCenter = reachesCollector ? particle.phase * 0.38 : particle.phase * 0.12;
        particle.mesh.position.z = emitterEmissionZ + lateralSpread + driftToCenter;
        particle.mesh.scale.setScalar((reachesCollector ? 1 : 0.82 + Math.sin(particle.phase * Math.PI) * 0.22) + current.maxKineticEnergyEv * 0.14);
      });

      sceneLabels.forEach((label) => {
        label.visible = showLabels;
      });
      setSceneValue(photonEnergyValue.element, String.raw`E_\gamma=${current.photonEnergyEv.toFixed(2)}\,\mathrm{eV}`);
      setSceneValue(kineticEnergyValue.element, String.raw`K_{\max}=${current.maxKineticEnergyEv.toFixed(2)}\,\mathrm{eV}`);
      setSceneValue(currentValue.element, String.raw`I=${current.collectorCurrentUa.toFixed(1)}\,\mu\mathrm{A}`);
      setSceneValue(fieldValue.element, String.raw`\mathcal{E}=${current.fieldStrengthVm.toFixed(1)}\,\mathrm{V\,m^{-1}}`);
      sceneValues.forEach((label) => {
        label.visible = showValues;
      });
      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
      mount.removeChild(renderer.domElement);
      renderer.dispose();
      labelRenderer.domElement.remove();
      floorGeometry.dispose();
      floorMaterial.dispose();
      photonGeometry.dispose();
      electronGeometry.dispose();
      photonMaterial.dispose();
      electronMaterial.dispose();
      beamMaterial.dispose();
      metalMaterial.dispose();
      brushedTexture.dispose();
      emitterCoreGeometry.dispose();
      emitterFrameGeometry.dispose();
      emitterFrameSideGeometry.dispose();
      emitterSlotGeometry.dispose();
      emitterFrontGlow.geometry.dispose();
      emitterFrameMaterial.dispose();
      emitterSlotMaterial.dispose();
      emitterFrontGlowMaterial.dispose();
      brushedLineGeometry.dispose();
      darkGrooveGeometry.dispose();
      plateGlintGeometry.dispose();
      reflectionBandGeometry.dispose();
      boltGeometry.dispose();
      brushedLineMaterial.dispose();
      darkGrooveMaterial.dispose();
      plateGlintMaterial.dispose();
      warmReflectionMaterial.dispose();
      coolReflectionMaterial.dispose();
      boltMaterial.dispose();
      collectorCoreGeometry.dispose();
      collectorStripeGeometry.dispose();
      collectorNodeGeometry.dispose();
      retardingCurtainGeometry.dispose();
      retardingCurtainMaterial.dispose();
      electronPathGeometries.forEach((geometry) => geometry.dispose());
      electronPathMaterials.forEach((material) => material.dispose());
      collectorMaterial.dispose();
      collectorAccentMaterial.dispose();
      guideGeometry.dispose();
      guideMaterial.dispose();
    };
  }, []);

  return <div className="sceneMount" ref={mountRef} aria-label="Photoelectric effect visualizer" />;
}
