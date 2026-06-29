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
const micButton = document.querySelector("#micButton");
const transcriptText = document.querySelector("#transcriptText");
const micStatus = document.querySelector("#micStatus");
const spokenPhrase = document.querySelector("#spokenPhrase");
const cameraStatus = document.querySelector("#cameraStatus");
const modelStatus = document.querySelector("#modelStatus");
const speechStatus = document.querySelector("#speechStatus");

const signs = [
  {
    phrase: "Hola",
    sign: "Hola",
    gesture: "HELLO",
    how: "Mostra la palma abierta frente a la camara y movela apenas de lado a lado."
  },
  {
    phrase: "Adios",
    sign: "Adios",
    gesture: "GOODBYE",
    how: "Mostra la palma abierta y movela de lado a lado como despidiendote."
  },
  {
    phrase: "Necesito ayuda",
    sign: "Necesito ayuda",
    gesture: "NEED_HELP",
    how: "Hace un puno cerca del pecho y mantenelo quieto un segundo."
  },
  {
    phrase: "Estoy perdido",
    sign: "Estoy perdido",
    gesture: "LOST",
    how: "Abri la mano lejos del centro del pecho, como preguntando donde estas."
  },
  {
    phrase: "Donde queda",
    sign: "Donde queda",
    gesture: "WHERE_PLACE",
    how: "Estira el indice y movelo de lado a lado frente al pecho."
  },
  {
    phrase: "Donde es",
    sign: "Donde es",
    gesture: "WHERE_IS",
    how: "Estira el indice cerca del pecho y subilo un poco, como preguntando ubicacion."
  },
  {
    phrase: "Ayuda",
    sign: "Ayuda",
    gesture: "HELP",
    how: "Hace un puno frente al pecho y levantalo un poco."
  },
  {
    phrase: "No entiendo",
    sign: "No entiendo",
    gesture: "DONT_UNDERSTAND",
    how: "Lleva el indice o la mano cerca de la frente y separala un poco."
  },
  {
    phrase: "Si",
    sign: "Si",
    gesture: "YES",
    how: "Pulgar arriba, mano cerrada, mantenelo quieto frente a la camara."
  },
  {
    phrase: "No",
    sign: "No",
    gesture: "NO",
    how: "Pulgar abajo, mano cerrada, mantenelo quieto frente a la camara."
  },
  {
    phrase: "Estoy bien",
    sign: "Estoy bien",
    gesture: "OK",
    how: "Hace una V con indice y medio, o pulgar arriba si queres una deteccion mas facil."
  },
  {
    phrase: "Gracias",
    sign: "Gracias",
    gesture: "THANKS",
    how: "Mano abierta cerca del menton o boca, movela hacia adelante."
  },
  {
    phrase: "Gracias",
    sign: "Gracias",
    gesture: "THANKS",
    how: "Mano abierta cerca del menton o boca, movela hacia adelante."
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
let recognition;
let listening = false;
let finalTranscript = "";

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
micButton.addEventListener("click", toggleMicrophone);
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

  if (!detectedGesture || detectedGesture.score < 0.84) {
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

  modelStatus.textContent = `${sign.sign} ${stableGestureCount}/7`;
  if (stableGestureCount < 7) return;

  spokenPhrase.textContent = sign.phrase;
  if (autoSpeak.checked) speak(sign.phrase);
}

function getDetectedGesture(result, poseResult) {
  const landmarks = result?.landmarks?.[0];
  if (!landmarks) return undefined;

  const pose = poseResult?.landmarks?.[0];
  const customGesture = getCustomGesture(landmarks, pose);
  if (customGesture) return customGesture;

  return undefined;
}

function getCustomGesture(landmarks, pose) {
  const fingers = getFingerState(landmarks);
  const count = Object.values(fingers).filter(Boolean).length;
  const center = getHandCenter(landmarks);
  const motion = getHandMotion(center);
  const zones = getBodyZones(pose);
  const nearMouth = zones.mouth && distance(center, zones.mouth) < 0.15;
  const nearForehead = zones.forehead && distance(center, zones.forehead) < 0.18;
  const nearChest = zones.chest && distance(center, zones.chest) < 0.25;

  if (isThumbUp(landmarks, fingers)) return gesture("YES", 0.9);
  if (isThumbDown(landmarks, fingers)) return gesture("NO", 0.9);
  if (isVictory(fingers)) return gesture("OK", 0.88);
  if (nearChest && count === 0 && motion.up) return gesture("HELP", 0.86);
  if (nearChest && count === 0 && !motion.active) return gesture("NEED_HELP", 0.86);
  if (nearForehead && fingers.index && count <= 2) return gesture("DONT_UNDERSTAND", 0.86);
  if (nearMouth && count >= 4 && motion.outward) return gesture("THANKS", 0.86);

  return undefined;
}

function gesture(categoryName, score = 0.86) {
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
    active: Math.abs(dx) > 0.04 || Math.abs(dy) > 0.04,
    up: dy < -0.035,
    down: dy > 0.035,
    side: Math.abs(dx) > 0.035,
    outward: Math.abs(dx) > 0.035 || Math.abs(dy) > 0.035,
    towardCenter: Math.abs(last.x - 0.5) < Math.abs(first.x - 0.5) - 0.025
  };
}

function isThumbUp(landmarks, fingers) {
  return fingers.thumb && !fingers.index && !fingers.middle && !fingers.ring && !fingers.pinky && landmarks[4].y < landmarks[2].y - 0.04;
}

function isThumbDown(landmarks, fingers) {
  return fingers.thumb && !fingers.index && !fingers.middle && !fingers.ring && !fingers.pinky && landmarks[4].y > landmarks[2].y + 0.04;
}

function isVictory(fingers) {
  return fingers.index && fingers.middle && !fingers.ring && !fingers.pinky;
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

function toggleMicrophone() {
  if (listening) {
    recognition?.stop();
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    micStatus.textContent = "Microfono no soportado";
    transcriptText.textContent = "Este navegador no soporta transcripcion por voz. Proba con Chrome en Android.";
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "es-AR";
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onstart = () => {
    listening = true;
    micButton.classList.add("listening");
    micStatus.textContent = "Escuchando";
  };

  recognition.onresult = (event) => {
    let interimTranscript = "";

    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const text = event.results[index][0].transcript.trim();
      if (event.results[index].isFinal) {
        finalTranscript = `${finalTranscript} ${text}`.trim();
      } else {
        interimTranscript = `${interimTranscript} ${text}`.trim();
      }
    }

    transcriptText.textContent = [finalTranscript, interimTranscript].filter(Boolean).join(" ");
  };

  recognition.onerror = () => {
    micStatus.textContent = "Error de microfono";
  };

  recognition.onend = () => {
    listening = false;
    micButton.classList.remove("listening");
    micStatus.textContent = "Microfono apagado";
  };

  recognition.start();
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
