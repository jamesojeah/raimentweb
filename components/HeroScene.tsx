"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function HeroScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, el.clientWidth / el.clientHeight, 0.1, 100);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    // Gold material
    const mat = new THREE.MeshStandardMaterial({
      color: 0xca8a04,
      metalness: 0.9,
      roughness: 0.2,
      wireframe: false,
    });
    const wireframeMat = new THREE.MeshBasicMaterial({
      color: 0xca8a04,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
    });

    // Shapes
    const meshes: THREE.Mesh[] = [];

    const addShape = (geo: THREE.BufferGeometry, x: number, y: number, z: number, scale: number) => {
      const mesh = new THREE.Mesh(geo, mat);
      const wf = new THREE.Mesh(geo, wireframeMat);
      mesh.position.set(x, y, z);
      mesh.scale.setScalar(scale);
      wf.position.set(x, y, z);
      wf.scale.setScalar(scale);
      scene.add(mesh, wf);
      meshes.push(mesh, wf);
    };

    addShape(new THREE.TorusGeometry(1, 0.35, 16, 60), -2.5, 0.5, -1, 0.8);
    addShape(new THREE.IcosahedronGeometry(1, 0), 2.2, -0.3, -2, 0.7);
    addShape(new THREE.OctahedronGeometry(0.8, 0), 0.2, 1.5, -3, 0.6);
    addShape(new THREE.TorusKnotGeometry(0.6, 0.2, 80, 16), -1.0, -1.5, -2, 0.5);

    // Lights
    const ambLight = new THREE.AmbientLight(0xffffff, 0.4);
    const pointLight = new THREE.PointLight(0xca8a04, 3, 20);
    pointLight.position.set(3, 3, 3);
    const pointLight2 = new THREE.PointLight(0xffffff, 1, 20);
    pointLight2.position.set(-3, -2, 2);
    scene.add(ambLight, pointLight, pointLight2);

    // Mouse tracking
    const mouse = { x: 0, y: 0 };
    const onMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", onMouseMove);

    // Resize
    const onResize = () => {
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
    };
    window.addEventListener("resize", onResize);

    // Animate
    let rafId = 0;
    const clock = new THREE.Clock();
    const tick = () => {
      rafId = requestAnimationFrame(tick);
      const t = clock.getElapsedTime();

      meshes.forEach((m, i) => {
        const speed = 0.15 + i * 0.02;
        m.rotation.x = t * speed + mouse.y * 0.3;
        m.rotation.y = t * speed * 0.7 + mouse.x * 0.3;
        m.position.y += Math.sin(t * 0.4 + i) * 0.0005;
      });

      if (!prefersReduced) {
        camera.position.x += (mouse.x * 0.5 - camera.position.x) * 0.02;
        camera.position.y += (mouse.y * 0.3 - camera.position.y) * 0.02;
      }

      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 z-0"
      aria-hidden="true"
      style={{ willChange: "transform" }}
    />
  );
}
