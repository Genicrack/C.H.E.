const video = document.querySelector("#camera");
const canvas = document.querySelector("#overlay");
const ctx = canvas.getContext("2d");

const startButton = document.querySelector("#startButton");
const stopButton = document.querySelector("#stopButton");
const installButton = document.querySelector("#installButton");
const autoSpeak = document.querySelector("#autoSpeak");
const cameraSelect = document.querySelector("#cameraSelect");
const voiceSelect = document.querySelector("#voiceSelect");
const phraseGrid = document.querySelector("#phraseGrid");
const guideList = document.querySelector("#guideList");
const spokenPhrase = document.querySelector("#spokenPhrase");
const cameraStatus = document.querySelector("#cameraStatus");
const modelStatus = document.querySelector("#modelStatus");
const speechStatus = document.querySelector("#speechStatus");

const signs = [
  {
    phrase: "Escuchar",
    sign: "Escuchar",
    gesture: "LISTEN",
    how: "Lleva la mano cerca de la oreja. Mantenela ahi un segundo, como senalando que estas escuchando."
  },
  {
    phrase: "Explicar",
    sign: "Explicar",
    gesture: "EXPLAIN",
    how: "Pone la mano frente al pecho con indice y pulgar activos. Movela suave hacia adelante, como mostrando una idea."
  },
  {
    phrase: "Felicitar",
    sign: "Felicitar",
    gesture: "CONGRATULATE",
    how: "Mano abierta frente al pecho o cara. Hace un movimiento corto hacia arriba, como celebrando."
  },
  {
    phrase: "Entender",
    sign: "Entender",
    gesture: "UNDERSTAND",
    how: "Estira solo el indice y llevalo cerca de la frente. Dejalo quieto un instante."
  },
  {
    phrase: "Invitar",
    sign: "Invitar",
    gesture: "INVITE",
    how: "Mano abierta al costado del cuerpo. Movela hacia el centro, como llamando a alguien a venir."
  },
  {
    phrase: "Necesitar",
    sign: "Necesitar",
    gesture: "NEED",
    how: "Estira el indice y bajalo un poco frente al pecho, como marcando necesidad."
  },
  {
    phrase: "Disculpar",
    sign: "Disculpar",
    gesture: "APOLOGIZE",
    how: "Puno cerrado sobre el pecho. Hace un movimiento pequeno y lento, sin sacar el puno del pecho."
  },
  {
    phrase: "Permiso",
    sign: "Permiso",
    gesture: "PERMISSION",
    how: "Mano abierta sobre la otra mano o frente al pecho. Deslizala suavemente hacia adelante."
  },
  {
    phrase: "Hablar",
    sign: "Hablar",
    gesture: "SPEAK",
    how: "Lleva dos dedos o la mano cerca de la boca. Movela apenas hacia afuera, como saliendo la palabra."
  }
];

let stream;
let recognizer;
let poseLandmarker;
let lastVideoTime = -1;
let lastPoseAt = 0;
let lastPoseResult;
let lastSpokenPhrase = "";
let lastSpokenAt = 0;
let stableGestureName = "";
let stableGestureCount = 0;
let handMotionHistory = [];
let running = false;
let deferredInstallPrompt;
let voices = [];
let cameras = [];

renderPhraseButtons();
renderGestureGuide();
loadCameras();
loadVoices();
bindVoiceUpdates();
showEnvironmentHint();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js").catch(() => {});
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  installButton.hidden = false;
});

installButton.addEventListener("click", async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = undefined;
  installButton.hidden = true;
});

startButton.addEventListener("click", start);
stopButton.addEventListener("click", stop);
cameraSelect.addEventListener("change", () => {
  if (running) {
    stop();
    start();
  }
});

async function start() {
  startButton.disabled = true;
  cameraStatus.textContent = "Abriendo camara";

  try {
    await initCamera();
    try {
      await initRecognizer();
    } catch (error) {
      modelStatus.textContent = "Sin IA online";
      console.error(error);
    }
    running = true;
    stopButton.disabled = false;
    cameraStatus.textContent = "Camara activa";
    requestAnimationFrame(loop);
  } catch (error) {
    startButton.disabled = false;
    stopButton.disabled = true;
    cameraStatus.textContent = "Permiso de camara requerido";
    spokenPhrase.textContent = "No pude iniciar";
    stream?.getTracks().forEach((track) => track.stop());
    stream = undefined;
    console.error(error);
  }
}

function stop() {
  running = false;
  stream?.getTracks().forEach((track) => track.stop());
  stream = undefined;
  video.srcObject = null;
  handMotionHistory = [];
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  startButton.disabled = false;
  stopButton.disabled = true;
  cameraStatus.textContent = "Camara apagada";
}

async function initCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("La camara necesita HTTPS o localhost en este navegador.");
  }

  const selectedCameraId = cameraSelect.value;
  const videoConstraints = selectedCameraId
    ? {
        deviceId: { exact: selectedCameraId },
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 24, max: 30 }
      }
    : {
        facingMode: "user",
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 24, max: 30 }
      };

  stream = await navigator.mediaDevices.getUserMedia({
    video: videoConstraints,
    audio: false
  });

  video.srcObject = stream;
  await video.play();
  await loadCameras();
}

async function initRecognizer() {
  if (recognizer && poseLandmarker) return;

  modelStatus.textContent = "Cargando IA";
  const vision = await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18");
  const fileset = await vision.FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm"
  );

  if (!recognizer) {
    recognizer = await vision.GestureRecognizer.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
        delegate: "GPU"
      },
      runningMode: "VIDEO",
      numHands: 1,
      minHandDetectionConfidence: 0.62,
      minHandPresenceConfidence: 0.62,
      minTrackingConfidence: 0.62
    });
  }

  if (!poseLandmarker) {
    poseLandmarker = await vision.PoseLandmarker.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
        delegate: "GPU"
      },
      runningMode: "VIDEO",
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
  }

  modelStatus.textContent = "IA movil lista";
}

function loop() {
  if (!running) return;
  resizeCanvas();

  if (video.currentTime !== lastVideoTime && recognizer) {
    lastVideoTime = video.currentTime;
    const now = performance.now();
    const gestureResult = recognizer.recognizeForVideo(video, now);

    if (poseLandmarker && now - lastPoseAt > 180) {
      lastPoseResult = poseLandmarker.detectForVideo(video, now);
      lastPoseAt = now;
    }

    drawResult(gestureResult, lastPoseResult);
    handleGesture(gestureResult, lastPoseResult);
  }

  requestAnimationFrame(loop);
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.round(rect.width * ratio);
  const height = Math.round(rect.height * ratio);

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
}

function drawResult(result, poseResult) {
  const rect = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);

  const posePoints = [0, 9, 10, 11, 12];
  for (const pose of poseResult?.landmarks ?? []) {
    for (const index of posePoints) {
      const point = pose[index];
      if (!point) continue;
      drawPoint(point, rect.width, rect.height, 4, "#0ea5e9");
    }
  }

  for (const landmarks of result?.landmarks ?? []) {
    for (const index of [0, 4, 8, 12, 16, 20]) {
      drawPoint(landmarks[index], rect.width, rect.height, 5, "#16a34a");
    }
  }
}

function drawPoint(point, width, height, radius, color) {
  if (!point) return;
  ctx.beginPath();
  ctx.arc((1 - point.x) * width, point.y * height, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function handleGesture(result, poseResult) {
  const detectedGesture = getDetectedGesture(result, poseResult);

  if (!detectedGesture || detectedGesture.score < 0.76) {
    stableGestureName = "";
    stableGestureCount = 0;
    return;
  }

  const sign = signs.find((item) => item.gesture === detectedGesture.categoryName);
  if (!sign) return;

  if (stableGestureName === detectedGesture.categoryName) {
    stableGestureCount += 1;
  } else {
    stableGestureName = detectedGesture.categoryName;
    stableGestureCount = 1;
  }

  modelStatus.textContent = `${sign.sign} ${stableGestureCount}/4`;
  if (stableGestureCount < 4) return;

  spokenPhrase.textContent = sign.phrase;
  if (autoSpeak.checked) speak(sign.phrase);
}

function getDetectedGesture(result, poseResult) {
  const landmarks = result?.landmarks?.[0];
  if (!landmarks) return undefined;

  const topGesture = result?.gestures?.[0]?.[0];
  const pose = poseResult?.landmarks?.[0];
  const customGesture = getCustomGesture(landmarks, pose);
  if (customGesture) return customGesture;

  if (topGesture?.categoryName === "Pointing_Up" && topGesture.score > 0.72) {
    return gesture("NEED", 0.78);
  }
  if (topGesture?.categoryName === "Closed_Fist" && topGesture.score > 0.72) {
    return gesture("APOLOGIZE", 0.78);
  }
  if (topGesture?.categoryName === "Open_Palm" && topGesture.score > 0.72) {
    return gesture("PERMISSION", 0.78);
  }

  return undefined;
}

function getCustomGesture(landmarks, pose) {
  const fingers = getFingerState(landmarks);
  const count = Object.values(fingers).filter(Boolean).length;
  const center = getHandCenter(landmarks);
  const motion = getHandMotion(center);
  const zones = getBodyZones(pose);
  const nearEar = zones.ear && distance(center, zones.ear) < 0.17;
  const nearMouth = zones.mouth && distance(center, zones.mouth) < 0.15;
  const nearForehead = zones.forehead && distance(center, zones.forehead) < 0.18;
  const nearChest = zones.chest && distance(center, zones.chest) < 0.25;
  const fromSide = Math.abs(center.x - 0.5) > 0.2;

  if (nearEar) return gesture("LISTEN");
  if (nearMouth && motion.outward) return gesture("SPEAK");
  if (nearForehead && fingers.index && count <= 2) return gesture("UNDERSTAND");
  if (nearChest && count === 0) return gesture("APOLOGIZE");
  if (nearChest && fingers.index && motion.down) return gesture("NEED");
  if (nearChest && count >= 4 && motion.up) return gesture("CONGRATULATE");
  if (nearChest && count >= 4 && motion.outward) return gesture("PERMISSION");
  if (nearChest && fingers.index && fingers.thumb && motion.outward) return gesture("EXPLAIN");
  if (fromSide && count >= 4 && motion.towardCenter) return gesture("INVITE");

  return undefined;
}

function gesture(categoryName, score = 0.82) {
  return { categoryName, score };
}

function getHandCenter(landmarks) {
  const sum = landmarks.reduce(
    (total, point) => ({ x: total.x + point.x, y: total.y + point.y }),
    { x: 0, y: 0 }
  );
  return { x: sum.x / landmarks.length, y: sum.y / landmarks.length };
}

function getHandMotion(center) {
  handMotionHistory.push(center);
  if (handMotionHistory.length > 8) handMotionHistory.shift();

  const first = handMotionHistory[0] ?? center;
  const last = handMotionHistory[handMotionHistory.length - 1] ?? center;
  const dx = last.x - first.x;
  const dy = last.y - first.y;

  return {
    up: dy < -0.035,
    down: dy > 0.035,
    outward: Math.abs(dx) > 0.035 || Math.abs(dy) > 0.035,
    towardCenter: Math.abs(last.x - 0.5) < Math.abs(first.x - 0.5) - 0.025
  };
}

function getBodyZones(pose) {
  if (!pose) return {};
  const nose = pose[0];
  const mouth = midpoint(pose[9], pose[10]) || nose;
  const shoulder = midpoint(pose[11], pose[12]);
  const chest = shoulder ? { x: shoulder.x, y: shoulder.y + 0.14 } : undefined;
  const forehead = nose ? { x: nose.x, y: nose.y - 0.08 } : undefined;
  const ear = nearestToHand([pose[7], pose[8]]);
  return { mouth, chest, forehead, ear };
}

function midpoint(a, b) {
  if (!a || !b) return undefined;
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function nearestToHand(points) {
  const lastHand = handMotionHistory[handMotionHistory.length - 1];
  const valid = points.filter(Boolean);
  if (!lastHand || !valid.length) return valid[0];
  return valid.sort((a, b) => distance(a, lastHand) - distance(b, lastHand))[0];
}

function distance(a, b) {
  if (!a || !b) return Infinity;
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function getFingerState(landmarks) {
  const wrist = landmarks[0];
  return {
    thumb: Math.abs(landmarks[4].x - wrist.x) > Math.abs(landmarks[3].x - wrist.x) + 0.035,
    index: landmarks[8].y < landmarks[6].y - 0.025,
    middle: landmarks[12].y < landmarks[10].y - 0.025,
    ring: landmarks[16].y < landmarks[14].y - 0.025,
    pinky: landmarks[20].y < landmarks[18].y - 0.025
  };
}

function speak(text) {
  if (!window.speechSynthesis) {
    speechStatus.textContent = "Voz no disponible";
    return;
  }

  const now = Date.now();
  if (text === lastSpokenPhrase && now - lastSpokenAt < 2200) return;
  lastSpokenPhrase = text;
  lastSpokenAt = now;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "es-AR";
  utterance.rate = 1;
  utterance.pitch = 1;

  const selectedVoice = voices.find((voice) => voice.name === voiceSelect.value);
  if (selectedVoice) utterance.voice = selectedVoice;

  utterance.onstart = () => {
    speechStatus.textContent = "Hablando";
  };
  utterance.onend = () => {
    speechStatus.textContent = "Altavoz listo";
  };

  window.speechSynthesis.speak(utterance);
}

function loadVoices() {
  voices = window.speechSynthesis?.getVoices?.() ?? [];
  const spanishVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith("es"));
  const options = spanishVoices.length ? spanishVoices : voices;

  voiceSelect.innerHTML = "";
  for (const voice of options) {
    const option = document.createElement("option");
    option.value = voice.name;
    option.textContent = voice.name.replace(/\s*\(.+\)\s*/, "");
    voiceSelect.append(option);
  }
}

async function loadCameras() {
  if (!navigator.mediaDevices?.enumerateDevices) return;

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    cameras = devices.filter((device) => device.kind === "videoinput");
    const currentValue = cameraSelect.value;
    const preferredCamera =
      cameras.find((camera) => camera.deviceId === currentValue && !isPhoneLinkCamera(camera)) ??
      cameras.find((camera) => !isPhoneLinkCamera(camera)) ??
      cameras[0];

    cameraSelect.innerHTML = "";

    for (const [index, camera] of cameras.entries()) {
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.textContent = camera.label || `Camara ${index + 1}`;
      cameraSelect.append(option);
    }

    if (preferredCamera) {
      cameraSelect.value = currentValue || preferredCamera.deviceId;
      cameraStatus.textContent = `Camara: ${cameraSelect.selectedOptions[0]?.textContent ?? "lista"}`;
    }
  } catch (error) {
    console.error(error);
  }
}

function isPhoneLinkCamera(camera) {
  const label = camera.label.toLowerCase();
  return label.includes("enlace movil") || label.includes("phone link") || label.includes("mobile");
}

function bindVoiceUpdates() {
  const synth = window.speechSynthesis;
  if (!synth) {
    speechStatus.textContent = "Voz no disponible";
    return;
  }

  if (typeof synth.addEventListener === "function") {
    synth.addEventListener("voiceschanged", loadVoices);
  } else {
    synth.onvoiceschanged = loadVoices;
  }
}

function showEnvironmentHint() {
  const isLocalhost = ["localhost", "127.0.0.1", ""].includes(location.hostname);
  if (!window.isSecureContext && !isLocalhost) {
    cameraStatus.textContent = "Abrir con HTTPS";
  }
}

function renderPhraseButtons() {
  phraseGrid.innerHTML = "";

  for (const sign of signs) {
    const button = document.createElement("button");
    button.className = "phrase-button";
    button.type = "button";
    button.innerHTML = `<strong>${sign.phrase}</strong><span>${sign.sign} - camara</span>`;
    button.addEventListener("click", () => {
      spokenPhrase.textContent = sign.phrase;
      speak(sign.phrase);
    });
    phraseGrid.append(button);
  }
}

function renderGestureGuide() {
  guideList.innerHTML = "";

  for (const sign of signs) {
    const item = document.createElement("article");
    item.className = "guide-item";
    item.innerHTML = `<strong>${sign.sign}</strong><span class="guide-tag">Camara</span><span>${sign.how}</span>`;
    guideList.append(item);
  }
}
