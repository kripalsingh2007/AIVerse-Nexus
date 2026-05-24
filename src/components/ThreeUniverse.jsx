import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useSimulation } from '../context/SimulationContext';
import { Zap, HelpCircle, Activity, Globe } from 'lucide-react';

export default function ThreeUniverse() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const { 
    threeDMode, 
    setThreeDMode, 
    rlExploration, 
    modelWeightCF, 
    setSelectedNode,
    playBeep
  } = useSimulation();

  const [hoveredNodeName, setHoveredNodeName] = useState(null);

  // References to animate nodes dynamically from state updates
  const simParamsRef = useRef({ rlExploration, modelWeightCF });
  useEffect(() => {
    simParamsRef.current = { rlExploration, modelWeightCF };
  }, [rlExploration, modelWeightCF]);

  useEffect(() => {
    if (!canvasRef.current) return;

    // --- 1. SETUP THREE.JS RUNTIME ---
    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 450;
    const scene = new THREE.Scene();
    
    // Cyberpunk void background color with deep purple ambient fog
    scene.background = new THREE.Color(0x03000a);
    scene.fog = new THREE.FogExp2(0x03000a, 0.015);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 45, 95);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current, 
      antialias: true,
      alpha: false
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // --- 2. LIGHTING SYSTEM ---
    const ambientLight = new THREE.AmbientLight(0x0a0520);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x00f2fe, 1.5);
    dirLight1.position.set(50, 100, 50);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xff007f, 1.2);
    dirLight2.position.set(-50, -50, -50);
    scene.add(dirLight2);

    // --- 3. CREATING GRID FLOOR LAYOUT (Futuristic HUD style) ---
    const gridHelper = new THREE.GridHelper(160, 40, 0x00f2fe, 0x1f0b40);
    gridHelper.position.y = -20;
    gridHelper.material.opacity = 0.25;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    // --- 4. CREATING ELEMENTS & PARTICLES ---
    // A: High Density Starfield Particles representing Embeddings Matrix
    const starCount = 350;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      // Create cluster groups
      const clusterIdx = Math.floor(Math.random() * 3);
      let px, py, pz;
      
      if (clusterIdx === 0) {
        // Cyan Cluster (Retrieval Core)
        px = (Math.random() - 0.5) * 40 - 30;
        py = (Math.random() - 0.5) * 40;
        pz = (Math.random() - 0.5) * 40;
      } else if (clusterIdx === 1) {
        // Magenta Cluster (Ranking Core)
        px = (Math.random() - 0.5) * 40 + 30;
        py = (Math.random() - 0.5) * 40;
        pz = (Math.random() - 0.5) * 40;
      } else {
        // Center Active Hub
        px = (Math.random() - 0.5) * 30;
        py = (Math.random() - 0.5) * 30;
        pz = (Math.random() - 0.5) * 30;
      }

      starPositions[i * 3] = px;
      starPositions[i * 3 + 1] = py;
      starPositions[i * 3 + 2] = pz;

      // Cyber Colors
      const isCyan = Math.random() > 0.5;
      starColors[i * 3] = isCyan ? 0.0 : 1.0;
      starColors[i * 3 + 1] = isCyan ? 0.95 : 0.0;
      starColors[i * 3 + 2] = isCyan ? 1.0 : 0.5;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    // Custom textured glowing star dots
    const starMat = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // B: Main Interactive Universe Category Spheres (Planets)
    const planets = [
      { id: 'cat_cyberwear', name: 'Cyberwear Immersive', color: 0x00f2fe, size: 4.8, x: -35, y: 5, z: 0, products: [] },
      { id: 'cat_implants', name: 'Neural Implants', color: 0xff007f, size: 5.5, x: 25, y: -8, z: 20, products: [] },
      { id: 'cat_holotech', name: 'Holo-Tech Grid', color: 0x8a2be2, size: 4.2, x: 5, y: 15, z: -35, products: [] },
      { id: 'cat_software', name: 'Algonet Software', color: 0x39ff14, size: 3.8, x: 30, y: 10, z: -20, products: [] },
    ];

    const planetMeshes = [];
    const satelliteGroupMap = [];

    planets.forEach((p) => {
      // Main Planet Sphere
      const geo = new THREE.SphereGeometry(p.size, 32, 32);
      const mat = new THREE.MeshPhongMaterial({
        color: p.color,
        emissive: p.color,
        emissiveIntensity: 0.35,
        shininess: 90,
        transparent: true,
        opacity: 0.85,
        wireframe: true
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(p.x, p.y, p.z);
      mesh.userData = { id: p.id, name: p.name, type: 'category', details: p };
      scene.add(mesh);
      planetMeshes.push(mesh);

      // Create product orbits for each planet
      const orbitalGroup = new THREE.Group();
      orbitalGroup.position.set(p.x, p.y, p.z);
      scene.add(orbitalGroup);
      satelliteGroupMap.push({ group: orbitalGroup, planetData: p, speed: Math.random() * 0.4 + 0.3 });

      // Generate 4 orbital product satellites per planet
      for (let j = 0; j < 4; j++) {
        const satRadius = p.size * 2.2 + Math.random() * 4;
        const satGeo = new THREE.SphereGeometry(0.8 + Math.random() * 0.6, 16, 16);
        const satMat = new THREE.MeshBasicMaterial({
          color: p.color,
          transparent: true,
          opacity: 0.95
        });
        const satMesh = new THREE.Mesh(satGeo, satMat);
        
        const angle = (j / 4) * Math.PI * 2;
        satMesh.position.set(Math.cos(angle) * satRadius, (Math.random() - 0.5) * 2, Math.sin(angle) * satRadius);
        satMesh.userData = { id: `${p.id}_prod_${j}`, name: `${p.name} Product #${j + 100}`, type: 'product' };
        orbitalGroup.add(satMesh);

        // Holographic orbital paths (Visual lines)
        const orbitPathGeo = new THREE.RingGeometry(satRadius, satRadius + 0.05, 64);
        orbitPathGeo.rotateX(Math.PI / 2);
        const orbitPathMat = new THREE.MeshBasicMaterial({
          color: p.color,
          transparent: true,
          opacity: 0.08,
          side: THREE.DoubleSide
        });
        const orbitPath = new THREE.Mesh(orbitPathGeo, orbitPathMat);
        orbitalGroup.add(orbitPath);
      }
    });

    // C: Central Active Vector Node (The "AI Decision Brain")
    const centralGeo = new THREE.OctahedronGeometry(6.5, 2);
    const centralMat = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      emissive: 0x8a2be2,
      emissiveIntensity: 0.8,
      wireframe: true,
      transparent: true,
      opacity: 0.9
    });
    const centralBrain = new THREE.Mesh(centralGeo, centralMat);
    centralBrain.userData = { id: 'brain_root', name: 'AIVerse Nexus core', type: 'system' };
    scene.add(centralBrain);

    // D: Holographic Laser Edge connectors (Visual streams connecting Core to planets)
    const lineMat = new THREE.LineBasicMaterial({ 
      color: 0x00f2fe, 
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending 
    });

    const connectingLines = [];
    planets.forEach((p) => {
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(p.x, p.y, p.z)
      ]);
      const line = new THREE.Line(lineGeo, lineMat);
      scene.add(line);
      connectingLines.push({ line, p });
    });

    // --- 5. INTERACTIVE MOUSE CONTROLLER (Orbit & Zoom) ---
    let isMouseDown = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let orbitTheta = 0; // horizontal angle
    let orbitPhi = Math.PI / 4; // vertical angle
    let orbitRadius = 110;

    const updateCameraOrbit = () => {
      // Clamp phi to prevent flip
      orbitPhi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, orbitPhi));
      
      camera.position.x = orbitRadius * Math.sin(orbitTheta) * Math.cos(orbitPhi);
      camera.position.z = orbitRadius * Math.cos(orbitTheta) * Math.cos(orbitPhi);
      camera.position.y = orbitRadius * Math.sin(orbitPhi);
      camera.lookAt(0, 0, 0);
    };

    const onMouseDown = (e) => {
      isMouseDown = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e) => {
      if (!isMouseDown) {
        // Perform raycasting for hover tooltip
        const rect = canvasRef.current.getBoundingClientRect();
        const mouse = new THREE.Vector2(
          ((e.clientX - rect.left) / width) * 2 - 1,
          -((e.clientY - rect.top) / height) * 2 + 1
        );

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        
        // Raycast against categories and satellites
        const intersects = raycaster.intersectObjects(scene.children, true);
        const validMatch = intersects.find(intersect => intersect.object.userData && intersect.object.userData.name);
        
        if (validMatch) {
          setHoveredNodeName(validMatch.object.userData.name);
          document.body.style.cursor = 'pointer';
        } else {
          setHoveredNodeName(null);
          document.body.style.cursor = 'default';
        }
        return;
      }
      
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      
      orbitTheta -= deltaX * 0.007;
      orbitPhi += deltaY * 0.007;
      
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
      updateCameraOrbit();
    };

    const onMouseUp = () => {
      isMouseDown = false;
    };

    const onWheel = (e) => {
      e.preventDefault();
      orbitRadius += e.deltaY * 0.08;
      orbitRadius = Math.max(40, Math.min(180, orbitRadius));
      updateCameraOrbit();
    };

    const onClick = (e) => {
      const rect = canvasRef.current.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / width) * 2 - 1,
        -((e.clientY - rect.top) / height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      const valid = intersects.find(int => int.object.userData && int.object.userData.name);
      
      if (valid) {
        const uData = valid.object.userData;
        playBeep(920, 'square', 0.06);
        
        // Feed clicked node stats to explanation context!
        setSelectedNode({
          id: uData.id || 'custom_node',
          category: uData.type === 'category' ? uData.name : 'Sub-Embedding Node',
          lastInteracted: uData.type === 'product' ? uData.name : 'Direct WebGL Click',
          attentionWeights: [0.42, 0.20, 0.18, 0.10, 0.05, 0.03, 0.01, 0.01],
          cosineSimilarity: uData.type === 'product' ? 0.952 : 0.884,
          rankingConfidence: 0.978,
          rlDecision: `DIRECT INSPECTION -> ${uData.name.toUpperCase()} target node active.`
        });
      }
    };

    const canvasElement = canvasRef.current;
    canvasElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    canvasElement.addEventListener('wheel', onWheel, { passive: false });
    canvasElement.addEventListener('click', onClick);

    // --- 6. CONTINUOUS ANIMATION TICK LOOP (Driven by Context Variables!) ---
    let frameId;
    let clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const params = simParamsRef.current;

      // A: Central Brain rotations and pulsations (linked to Collaborative Weight)
      const brainPulse = 1.0 + Math.sin(elapsed * 4) * 0.08 * (1.0 + params.modelWeightCF);
      centralBrain.scale.set(brainPulse, brainPulse, brainPulse);
      centralBrain.rotation.y += 0.008;
      centralBrain.rotation.x += 0.004;

      // Adjust Brain wireframe glow based on parameters
      centralBrain.material.emissiveIntensity = 0.5 + Math.sin(elapsed * 2) * 0.3 + params.modelWeightCF * 0.5;

      // B: Planets orbital speeds (Faster based on Exploration settings!)
      satelliteGroupMap.forEach((orbit) => {
        // Orbit speed scales up with RL Exploration epsilon!
        const speedScale = 1.0 + params.rlExploration * 2.5;
        orbit.group.rotation.y += 0.012 * orbit.speed * speedScale;
        
        // Sub-oscillate the heights
        orbit.group.children.forEach(child => {
          if (child.userData && child.userData.type === 'product') {
            child.rotation.y += 0.02;
          }
        });
      });

      // Maintain category meshes rotations
      planetMeshes.forEach((mesh, index) => {
        mesh.rotation.y += 0.005 * (index + 1);
        mesh.rotation.z += 0.002;
      });

      // C: Modulate the starfield points drift speeds
      const starPositionsArr = starField.geometry.attributes.position.array;
      const driftScale = 0.02 * (1.0 + params.rlExploration * 2.0);
      
      for (let i = 0; i < starCount; i++) {
        // Slowly drift up or down
        starPositionsArr[i * 3 + 1] += Math.sin(elapsed + i) * driftScale;
        
        // Wrap around limits
        if (Math.abs(starPositionsArr[i * 3 + 1]) > 50) {
          starPositionsArr[i * 3 + 1] = (Math.random() - 0.5) * 40;
        }
      }
      starField.geometry.attributes.position.needsUpdate = true;

      // D: Modulate connecting lasers (flicker opacity representing data packet transmissions)
      connectingLines.forEach((connector) => {
        const speedScale = 1.0 + params.modelWeightCF * 3;
        connector.line.material.opacity = 0.25 + Math.sin(elapsed * 10 * speedScale + connector.p.size) * 0.2;
      });

      // E: Handle view mode layouts (dynamically shift node anchors!)
      planets.forEach((p, idx) => {
        const mesh = planetMeshes[idx];
        const connector = connectingLines[idx].line;
        const orbitGrp = satelliteGroupMap[idx].group;

        let targetX = p.x;
        let targetY = p.y;
        let targetZ = p.z;

        if (threeDMode === 'universe') {
          // Universe Mode: Cluster planetary bodies closer together representing hyper-similarity orbit
          const simRatio = 1.0 - (params.modelWeightCF * 0.4);
          targetX = p.x * simRatio;
          targetY = p.y * simRatio;
          targetZ = p.z * simRatio;
        }

        // Interpolate meshes positions
        mesh.position.x += (targetX - mesh.position.x) * 0.1;
        mesh.position.y += (targetY - mesh.position.y) * 0.1;
        mesh.position.z += (targetZ - mesh.position.z) * 0.1;

        orbitGrp.position.copy(mesh.position);

        // Update connecting lasers geometry in graph mode
        if (threeDMode === 'graph') {
          connector.visible = true;
          const posAttr = connector.geometry.attributes.position;
          posAttr.setXYZ(1, mesh.position.x, mesh.position.y, mesh.position.z);
          posAttr.needsUpdate = true;
        } else {
          connector.visible = false;
        }
      });

      renderer.render(scene, camera);
    };

    // Begin Loop
    animate();

    // --- 7. HANDLE RESIZE TELEMETRY ---
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(containerRef.current);

    // --- 8. CLEANUP STAGE ---
    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      canvasElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      canvasElement.removeEventListener('wheel', onWheel);
      canvasElement.removeEventListener('click', onClick);
      
      // Dispose WebGL contexts
      renderer.dispose();
      starGeo.dispose();
      starMat.dispose();
      planets.forEach((p, idx) => {
        planetMeshes[idx].geometry.dispose();
        planetMeshes[idx].material.dispose();
      });
      centralGeo.dispose();
      centralMat.dispose();
      lineMat.dispose();
    };
  }, [threeDMode, setSelectedNode]);

  return (
    <div ref={containerRef} className="relative w-full h-[460px] overflow-hidden rounded-xl cyber-panel border-cyan-500/20 border bg-[#050110]/80">
      
      {/* 3D WebGL Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Futuristic HUD overlay details */}
      <div className="absolute top-4 left-4 flex items-center space-x-3 pointer-events-none">
        <div className="flex h-2.5 w-2.5 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
        </div>
        <div className="text-xs font-orbitron tracking-widest text-cyan-400 glow-text-cyan uppercase">
          3D Visual Engine: {threeDMode === 'graph' ? 'Holographic Decision Net' : 'Embedding Vector Space'}
        </div>
      </div>

      {/* Active Hover Tooltip */}
      {hoveredNodeName && (
        <div className="absolute bottom-4 left-4 cyber-panel border-cyan-400/30 px-3 py-1.5 rounded text-xs font-orbitron tracking-wider text-cyan-300 pointer-events-none bg-slate-900/90 shadow-cyan-glow">
          <Zap className="inline w-3 h-3 text-cyan-400 mr-1.5 animate-pulse" />
          TARGET MAPPED: {hoveredNodeName}
        </div>
      )}

      {/* Engine Control Overlay */}
      <div className="absolute top-4 right-4 flex space-x-2">
        <button
          onClick={() => {
            setThreeDMode('graph');
            playBeep(660, 'sine', 0.04);
          }}
          className={`px-3 py-1.5 text-[10px] font-orbitron tracking-widest rounded transition-all duration-300 border uppercase flex items-center gap-1.5 ${
            threeDMode === 'graph'
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-cyan-glow'
              : 'bg-transparent text-slate-400 border-slate-700/50 hover:bg-slate-800/30'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Decision Graph
        </button>
        
        <button
          onClick={() => {
            setThreeDMode('universe');
            playBeep(780, 'sine', 0.04);
          }}
          className={`px-3 py-1.5 text-[10px] font-orbitron tracking-widest rounded transition-all duration-300 border uppercase flex items-center gap-1.5 ${
            threeDMode === 'universe'
              ? 'bg-magenta-500/20 text-magenta-300 border-magenta-500/40 shadow-magenta-glow'
              : 'bg-transparent text-slate-400 border-slate-700/50 hover:bg-slate-800/30'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          Embedding Universe
        </button>
      </div>

      {/* Grid helper key details */}
      <div className="absolute bottom-4 right-4 text-[9px] font-mono text-slate-500 text-right pointer-events-none">
        <div>ORBIT_CAM: ACTIVE [R: {threeDMode === 'graph' ? 'DECISION_NET' : 'COSINE_SPACE'}]</div>
        <div>RENDER_NODES: 350 | STABLE_60_FPS</div>
        <div>DRAG TO ROTATE | SCROLL TO ZOOM</div>
      </div>
    </div>
  );
}
