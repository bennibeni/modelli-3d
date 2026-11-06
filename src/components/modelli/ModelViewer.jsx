"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createMovementPreview } from "./movementPreview";
import { createLegSpread } from "./legSpread";
import { disposeModel, fetchModel } from "./loadModel";
import { MODELS } from "./models";
import "./ModelViewer.css";

export default function ModelViewer() {
  const sectionRef = useRef(null);
  const containerRef = useRef(null);
  const [modelUrl, setModelUrl] = useState(MODELS[0].url);
  const selectedModel = MODELS.find((item) => item.url === modelUrl);
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenError, setFullscreenError] = useState("");
  const viewerRef = useRef(null);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Caricamento del modello 3D…");
  const [rotating, setRotating] = useState(false);
  const [hasAnimation, setHasAnimation] = useState(false);
  const [animationPlaying, setAnimationPlaying] = useState(false);
  const [canSpreadLegs, setCanSpreadLegs] = useState(false);
  const [legOpening, setLegOpening] = useState(0);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const onFullscreenChange = () => {
      setFullscreen(document.fullscreenElement === sectionRef.current);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  async function toggleFullscreen() {
    setFullscreenError("");
    try {
      if (document.fullscreenElement === sectionRef.current) {
        await document.exitFullscreen();
      } else {
        await sectionRef.current.requestFullscreen();
      }
    } catch {
      setFullscreenError(
        "Il browser non consente il tutto schermo in questa finestra.",
      );
    }
  }

  useEffect(() => {
    const container = containerRef.current;
    let disposed = false;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    } catch {
      // Il callback asincrono evita aggiornamenti di stato sincroni nell'effetto.
      queueMicrotask(() => {
        if (!disposed) {
          setStatus("error");
          setMessage(
            "Il browser non riesce ad avviare WebGL. Controlla l'accelerazione grafica o prova un altro browser.",
          );
        }
      });
      return () => {
        disposed = true;
      };
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.setAttribute(
      "aria-label",
      "Modello 3D interattivo. Trascina per ruotare, usa la rotella per lo zoom oppure i pulsanti sottostanti.",
    );
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#182530");
    scene.add(new THREE.HemisphereLight(0xffffff, 0x667788, 2.6));
    const keyLight = new THREE.DirectionalLight(0xfff2df, 3.5);
    keyLight.position.set(3, 5, 4);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xc7e5ff, 2);
    fillLight.position.set(-3, 2, -3);
    scene.add(fillLight);
    const camera = new THREE.PerspectiveCamera(40, 1, 0.01, 100);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotateSpeed = 1;
    controls.minDistance = 0.05;
    controls.maxDistance = 12;
    const initialPosition = new THREE.Vector3();
    let distance = 4;
    let model;
    let mixer;
    let action;
    let legSpread;
    let ready = false;

    function resetView() {
      if (!ready) return;
      controls.target.set(0, 1, 0);
      initialPosition.set(0, 1.1, distance);
      camera.position.copy(initialPosition);
      controls.update();
    }
    function resize() {
      const width = Math.max(container.clientWidth, 1);
      const height = Math.max(container.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      // Inquadra l'intero modello anche sui display stretti.
      const vertical = THREE.MathUtils.degToRad(camera.fov);
      const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * camera.aspect);
      distance = 1.25 / Math.sin(Math.min(vertical, horizontal) / 2);
      controls.maxDistance = Math.max(12, distance * 3);
      resetView();
    }
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();
    viewerRef.current = {
      reset: resetView,
      spreadLegs: (degrees) => legSpread?.setDegrees(degrees),
      animate: (playing) => {
        if (!action || !ready) return false;
        action.paused = !playing;
        return true;
      },
      rotate: (value) => {
        controls.autoRotate = value;
      },
      turn: (angle) => {
        if (!ready) return;
        const offset = camera.position.clone().sub(controls.target);
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
        camera.position.copy(controls.target).add(offset);
        controls.update();
      },
      zoom: (factor) => {
        if (!ready) return;
        const offset = camera.position.clone().sub(controls.target);
        offset.setLength(
          THREE.MathUtils.clamp(
            offset.length() * factor,
            controls.minDistance,
            controls.maxDistance,
          ),
        );
        camera.position.copy(controls.target).add(offset);
        controls.update();
      },
    };
    const onContextLost = (event) => {
      event.preventDefault();
      setStatus("error");
      setMessage(
        "La connessione alla scheda grafica è stata interrotta. Premi Riprova per ricaricare il modello.",
      );
    };
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);
    const clock = new THREE.Clock();
    renderer.setAnimationLoop(() => {
      const delta = Math.min(clock.getDelta(), 0.1);
      controls.update(delta);
      mixer?.update(delta);
      legSpread?.update(delta);
      renderer.render(scene, camera);
    });
    const download = new AbortController();
    const onLoad = (gltf) => {
      if (disposed) {
        disposeModel(gltf.scene);
        return;
      }
      model = gltf.scene;
      model.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(model);
      const size = bounds.getSize(new THREE.Vector3());
      const longest = Math.max(size.x, size.y, size.z);
      if (!Number.isFinite(longest) || longest <= 0) {
        disposeModel(model);
        model = null;
        setStatus("error");
        setMessage("Il modello non contiene una geometria visualizzabile.");
        return;
      }
      const center = bounds.getCenter(new THREE.Vector3());
      const scale = 2 / longest;
      const pivot = new THREE.Group();
      model.position.sub(center);
      pivot.add(model);
      pivot.scale.setScalar(scale);
      pivot.position.y = 1;
      scene.add(pivot);
      if (gltf.animations.length) {
        mixer = new THREE.AnimationMixer(model);
        action = mixer.clipAction(createMovementPreview(gltf.animations[0]));
        action.play();
        action.paused = true;
        mixer.update(0);
      }
      legSpread = createLegSpread(model);
      setCanSpreadLegs(Boolean(legSpread));
      setHasAnimation(gltf.animations.length > 0);
      ready = true;
      resetView();
      setStatus("ready");
      setMessage(
        "Modello caricato. Trascina per ruotare e usa la rotella per lo zoom.",
      );
    };
    const onProgress = (event) => {
      if (disposed || !event.lengthComputable || event.total <= 0) return;
      const percentage = Math.min(
        100,
        Math.round((event.loaded / event.total) * 100),
      );
      setMessage(
        percentage === 100
          ? "Preparazione del modello e delle texture…"
          : `Caricamento del modello 3D… ${percentage}%`,
      );
    };
    const onError = () => {
      if (!disposed) {
        setStatus("error");
        setMessage(
          "Impossibile caricare il modello. Verifica la connessione e riprova.",
        );
      }
    };
    fetchModel(modelUrl, download.signal, onProgress)
      .then((buffer) => {
        if (disposed) return;
        const folder = modelUrl.slice(0, modelUrl.lastIndexOf("/") + 1);
        new GLTFLoader().parse(buffer, folder, onLoad, onError);
      })
      .catch((error) => {
        if (error.name !== "AbortError") onError();
      });
    return () => {
      disposed = true;
      download.abort();
      viewerRef.current = null;
      observer.disconnect();
      renderer.setAnimationLoop(null);
      controls.dispose();
      if (mixer) {
        mixer.stopAllAction();
        mixer.uncacheRoot(model);
      }
      if (model) disposeModel(model);
      renderer.domElement.removeEventListener(
        "webglcontextlost",
        onContextLost,
      );
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [attempt, modelUrl]);

  function toggleRotation() {
    const value = !rotating;
    setRotating(value);
    viewerRef.current?.rotate(value);
  }

  return (
    <section
      ref={sectionRef}
      className={`mv${fullscreen ? " mv--fullscreen" : ""}`}
    >
      <header>
        <p className="mv-kicker">Modelli 3D</p>
        <h1 className="mv-title">Esplora il modello</h1>
        <p className="mv-intro">
          Trascina per ruotare, usa la rotella per lo zoom e il tasto destro per
          spostare la vista. Su touch: un dito per ruotare, due per zoom e
          spostamento.
        </p>
      </header>
      <div className="mv-row">
        <label htmlFor="mv-model" className="mv-label">
          Modello
        </label>
        <select
          id="mv-model"
          className="mv-button"
          value={modelUrl}
          onChange={(event) => {
            setStatus("loading");
            setMessage("Caricamento del modello 3D…");
            setRotating(false);
            setCanSpreadLegs(false);
            setLegOpening(0);
            setHasAnimation(false);
            setAnimationPlaying(false);
            setModelUrl(event.target.value);
          }}
        >
          {MODELS.map((item) => (
            <option key={item.url} value={item.url}>
              {item.label} · {item.size}
            </option>
          ))}
        </select>
        <button type="button" className="mv-button" onClick={toggleFullscreen}>
          {fullscreen ? "Esci da tutto schermo" : "Tutto schermo"}
        </button>
        {fullscreenError && (
          <p role="alert" className="mv-small">
            {fullscreenError}
          </p>
        )}
      </div>
      <div className="mv-stage">
        <div ref={containerRef} className="mv-canvas" />
        {status !== "ready" && (
          <div className="mv-overlay">
            <div>
              <p role={status === "error" ? "alert" : "status"}>{message}</p>
              {status === "error" && (
                <button
                  type="button"
                  className="mv-button mv-retry"
                  onClick={() => {
                    setStatus("loading");
                    setMessage("Caricamento del modello 3D…");
                    setRotating(false);
                    setCanSpreadLegs(false);
                    setLegOpening(0);
                    setHasAnimation(false);
                    setAnimationPlaying(false);
                    setAttempt((value) => value + 1);
                  }}
                >
                  Riprova
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      <div
        role="group"
        aria-label="Controlli della vista 3D"
        className="mv-row mv-controls"
      >
        {hasAnimation && (
          <button
            type="button"
            className="mv-button"
            disabled={status !== "ready"}
            aria-pressed={animationPlaying}
            onClick={() => {
              const playing = !animationPlaying;
              if (viewerRef.current?.animate(playing)) {
                setAnimationPlaying(playing);
              }
            }}
          >
            {animationPlaying ? "Pausa movimento" : "Prova movimento"}
          </button>
        )}
        <button
          type="button"
          className="mv-button"
          disabled={status !== "ready"}
          onClick={() => viewerRef.current?.reset()}
        >
          Ripristina vista
        </button>
        <button
          type="button"
          className="mv-button"
          disabled={status !== "ready"}
          onClick={() => viewerRef.current?.turn(-Math.PI / 8)}
        >
          Ruota a sinistra
        </button>
        <button
          type="button"
          className="mv-button"
          disabled={status !== "ready"}
          onClick={() => viewerRef.current?.turn(Math.PI / 8)}
        >
          Ruota a destra
        </button>
        <button
          type="button"
          className="mv-button"
          disabled={status !== "ready"}
          onClick={() => viewerRef.current?.zoom(0.8)}
        >
          Avvicina
        </button>
        <button
          type="button"
          className="mv-button"
          disabled={status !== "ready"}
          onClick={() => viewerRef.current?.zoom(1.25)}
        >
          Allontana
        </button>
        <button
          type="button"
          className="mv-button"
          disabled={status !== "ready"}
          aria-pressed={rotating}
          onClick={toggleRotation}
        >
          {rotating ? "Ferma rotazione" : "Rotazione automatica"}
        </button>
      </div>
      {canSpreadLegs && (
        <div className="mv-row">
          <button
            type="button"
            className="mv-button"
            disabled={status !== "ready"}
            onClick={() => {
              setLegOpening(180);
              viewerRef.current?.spreadLegs(180);
            }}
          >
            Allarga le gambe al massimo
          </button>
          <button
            type="button"
            className="mv-button"
            disabled={status !== "ready" || legOpening === 0}
            onClick={() => {
              setLegOpening(0);
              viewerRef.current?.spreadLegs(0);
            }}
          >
            Richiudi le gambe
          </button>
          <label htmlFor="mv-leg-opening" className="mv-small">
            Apertura gambe: {legOpening}°
          </label>
          <input
            id="mv-leg-opening"
            type="range"
            min="0"
            max="180"
            step="1"
            value={legOpening}
            disabled={status !== "ready"}
            onChange={(event) => {
              const degrees = Number(event.target.value);
              setLegOpening(degrees);
              viewerRef.current?.spreadLegs(degrees);
            }}
            className="mv-range"
          />
          <p className="mv-note mv-full">
            A 180° le gambe sono orizzontali. Nelle aperture estreme possono
            comparire deformazioni del modello.
          </p>
        </div>
      )}
      {hasAnimation && (
        <p role="status" className="mv-status">
          {animationPlaying
            ? "Movimento in corso: oscillazione del torso e delle braccia."
            : "Premi Prova movimento per animare torso e braccia."}
        </p>
      )}
      <p role="status" className="mv-note">
        {status === "ready"
          ? `${selectedModel.label} · GLB con texture incorporate · ${selectedModel.size}`
          : ""}
      </p>
    </section>
  );
}
