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
  { phrase: "Hola", sign: "Palma abierta", gesture: "Open_Palm", how: "Pone la mano frente al pecho, palma mirando a la camara. Estira los 5 dedos y separalos un poco. Mantenela quieta 1 segundo." },
  { phrase: "Necesito ayuda", sign: "Puno cerrado", gesture: "Closed_Fist", how: "Pone la mano frente al pecho. Cerra todos los dedos fuerte, como haciendo un puno. Que no se vea ningun dedo estirado." },
  { phrase: "Si", sign: "Pulgar arriba", gesture: "Thumb_Up", how: "Cerra la mano en puno y deja solo el pulgar levantado hacia arriba. La una del pulgar tiene que mirar de costado." },
  { phrase: "No", sign: "Pulgar abajo", gesture: "Thumb_Down", how: "Cerra la mano en puno y deja solo el pulgar apuntando hacia abajo. Mantenelo en el centro de la camara." },
  { phrase: "Estoy bien", sign: "V de victoria", gesture: "Victory", how: "Estira solo indice y medio formando una V. Pulgar, anular y menique quedan cerrados." },
  { phrase: "Te quiero", sign: "Te quiero", gesture: "ILoveYou", how: "Estira pulgar, indice y menique. Dobla el dedo medio y el anular. Mantenelo quieto frente a la camara." },
  { phrase: "Quiero hablar", sign: "Dedo hacia arriba", gesture: "Pointing_Up", how: "Estira solo el dedo indice hacia arriba. Los otros dedos quedan cerrados en puno." },
  { phrase: "Gracias", sign: "Mano al menton hacia afuera", gesture: "THANKS", how: "Mano abierta. Toca el menton o la parte baja de la cara y empuja la mano hacia adelante." },
  { phrase: "Por favor", sign: "Mano en el pecho en circulo", gesture: "PLEASE", how: "Mano abierta sobre el centro del pecho. Hace un circulo lento sin sacar la mano de esa zona." },
  { phrase: "Perdon", sign: "Puno en el pecho", gesture: "SORRY", how: "Puno cerrado sobre el pecho. Mantenelo quieto o hace un circulo pequeno." },
  { phrase: "Tengo hambre", sign: "Mano hacia la boca", gesture: "HUNGRY", how: "Junta los dedos como pellizco y llevalos a la boca. La mano tiene que quedar cerca de la boca." },
  { phrase: "Tengo sed", sign: "Dedo cerca de la boca", gesture: "THIRSTY", how: "Estira solo el indice y acercalo a la boca o menton. Los otros dedos quedan cerrados." },
  { phrase: "Necesito ir al bano", sign: "Mano en B moviendose", gesture: "BATHROOM", how: "Mano vertical frente al pecho. Estira los dedos juntos y movela de lado a lado." },
  { phrase: "Me duele", sign: "Dedos apuntando al dolor", gesture: "PAIN", how: "Estira el indice y apunta a una parte del cuerpo: pecho, hombro, cara o brazo." },
  { phrase: "Llamen a mi familia", sign: "Gesto de llamar", gesture: "CALL_FAMILY", how: "Pulgar y menique abiertos como telefono. Ponelo cerca de la oreja y mantenelo ahi." },
  { phrase: "Llamen a emergencias", sign: "Gesto de telefono urgente", gesture: "CALL_EMERGENCY", how: "Mismo gesto de telefono cerca de la oreja, pero movelo rapido dos veces." },
  { phrase: "Estoy perdido", sign: "Manos buscando", gesture: "LOST", how: "Abri una o dos manos con palma hacia arriba, lejos del centro del pecho, como preguntando donde." },
  { phrase: "No entiendo", sign: "Mano cerca de la frente", gesture: "DONT_UNDERSTAND", how: "Lleva la mano cerca de la frente. Mejor si estiras el indice o abris la mano." },
  { phrase: "Repeti, por favor", sign: "Mano vuelve hacia mi", gesture: "REPEAT", how: "Pone la mano frente al pecho y movela hacia tu cuerpo, como trayendo algo hacia vos." },
  { phrase: "Mas despacio", sign: "Mano bajando lento", gesture: "SLOWER", how: "Palma abierta mirando hacia abajo. Baja la mano despacio desde el pecho." },
  { phrase: "Estoy cansado", sign: "Manos bajan desde hombros", gesture: "TIRED", how: "Pone la mano cerca del hombro y bajala hacia el pecho. Si usas las dos manos, mejor." },
  { phrase: "Tengo frio", sign: "Brazos temblando", gesture: "COLD", how: "Mano o puno cerca del pecho. Hace movimientos cortitos de izquierda a derecha, como temblando." },
  { phrase: "Tengo calor", sign: "Mano abanica la cara", gesture: "HOT", how: "Mano abierta cerca de la cara. Movela de lado a lado como abanico." },
  { phrase: "Quiero comer", sign: "Dedos hacia la boca", gesture: "EAT", how: "Junta los dedos y llevalos varias veces hacia la boca, como comiendo." },
  { phrase: "Quiero agua", sign: "Senia de agua", gesture: "WATER", how: "Cerca de la boca, levanta tres dedos o hace gesto de beber agua." },
  { phrase: "Quiero dormir", sign: "Mano baja por la cara", gesture: "SLEEP", how: "Mano abierta cerca de la cara. Bajala lentamente como cerrando los ojos." },
  { phrase: "Estoy esperando", sign: "Manos en espera", gesture: "WAITING", how: "Mano abierta frente al pecho, palma hacia arriba, quieta por un segundo." },
  { phrase: "Voy a casa", sign: "Mano hacia casa", gesture: "HOME", how: "Mano abierta o dedos juntos cerca del pecho. Movela hacia un costado." },
  { phrase: "Necesito escribir", sign: "Gesto de lapiz", gesture: "WRITE", how: "Hace pinza con pulgar e indice, como agarrando un lapiz. Movela poquito como escribiendo." },
  { phrase: "No puedo hablar", sign: "Mano frente a la boca", gesture: "CANT_SPEAK", how: "Mano abierta tapando la boca. Mantenela quieta medio segundo." }
];

const phraseMap = Object.fromEntries(
  signs.filter((sign) => sign.gesture).map((sign) => [sign.gesture, sign.phrase])
);

const signLabelMap = Object.fromEntries(
  signs.filter((sign) => sign.gesture).map((sign) => [sign.gesture, sign.sign])
);

let stream;
let recognizer;
let poseLandmarker;
let lastVideoTime = -1;
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
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    : {
        facingMode: "user",
        width: { ideal: 1280 },
        height: { ideal: 720 }
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
      numHands: 2,
      minHandDetectionConfidence: 0.72,
      minHandPresenceConfidence: 0.72,
      minTrackingConfidence: 0.72
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
      minPoseDetectionConfidence: 0.65,
      minPosePresenceConfidence: 0.65,
      minTrackingConfidence: 0.65
    });
  }

  modelStatus.textContent = "IA mano + cuerpo";
}

function loop() {
  if (!running) return;
  resizeCanvas();

  if (video.currentTime !== lastVideoTime && (recognizer || poseLandmarker)) {
    lastVideoTime = video.currentTime;
    const now = performance.now();
    const gestureResult = recognizer?.recognizeForVideo(video, now);
    const poseResult = poseLandmarker?.detectForVideo(video, now);
    drawResult(gestureResult, poseResult);
    handleGesture(gestureResult, poseResult);
  }

  requestAnimationFrame(loop);
}

function resizeCanvas() {
  const width = video.videoWidth || canvas.clientWidth;
  const height = video.videoHeight || canvas.clientHeight;
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}

function drawResult(result, poseResult) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.scale(-1, 1);
  ctx.translate(-canvas.width, 0);

  for (const pose of poseResult?.landmarks ?? []) {
    for (const point of pose) {
      ctx.beginPath();
      ctx.arc(point.x * canvas.width, point.y * canvas.height, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#0ea5e9";
      ctx.fill();
    }
  }

  for (const landmarks of result?.landmarks ?? []) {
    for (const point of landmarks) {
      ctx.beginPath();
      ctx.arc(point.x * canvas.width, point.y * canvas.height, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#16a34a";
      ctx.fill();
    }
  }

  ctx.restore();
}

function handleGesture(result, poseResult) {
  const detectedGesture = getDetectedGesture(result, poseResult);
  const hasBody = !poseLandmarker || (poseResult?.landmarks?.[0]?.length ?? 0) > 0;

  if (!hasBody) {
    modelStatus.textContent = "Mostra torso y manos";
    return;
  }

  if (!detectedGesture || detectedGesture.score < 0.82) {
    stableGestureName = "";
    stableGestureCount = 0;
    return;
  }

  const phrase = phraseMap[detectedGesture.categoryName];
  if (!phrase) return;

  if (stableGestureName === detectedGesture.categoryName) {
    stableGestureCount += 1;
  } else {
    stableGestureName = detectedGesture.categoryName;
    stableGestureCount = 1;
  }

  const signLabel = signLabelMap[detectedGesture.categoryName] ?? detectedGesture.categoryName;
  modelStatus.textContent = `${signLabel} ${stableGestureCount}/5 ${Math.round(detectedGesture.score * 100)}%`;

  if (stableGestureCount < 5) return;

  spokenPhrase.textContent = phrase;

  if (autoSpeak.checked) {
    speak(phrase);
  }
}

function getDetectedGesture(result, poseResult) {
  const topGesture = result?.gestures?.[0]?.[0];
  const landmarks = result?.landmarks?.[0];
  const pose = poseResult?.landmarks?.[0];
  if (!landmarks) return undefined;

  if (isReliableBuiltInGesture(topGesture)) return topGesture;

  const customGesture = getCustomGesture(landmarks, pose);
  if (customGesture) return customGesture;

  if (topGesture?.score >= 0.82) return topGesture;

  const fingerState = getFingerState(landmarks);
  const extendedCount = Object.values(fingerState).filter(Boolean).length;

  if (extendedCount >= 4 && fingerState.index && fingerState.middle && fingerState.ring && fingerState.pinky) {
    return { categoryName: "Open_Palm", score: 0.86 };
  }

  if (fingerState.thumb && fingerState.index && fingerState.pinky && !fingerState.middle && !fingerState.ring) {
    return { categoryName: "ILoveYou", score: 0.86 };
  }

  return undefined;
}

function isReliableBuiltInGesture(gestureResult) {
  if (!gestureResult || gestureResult.score < 0.84) return false;
  return ["Closed_Fist", "Thumb_Up", "Thumb_Down", "Victory", "Pointing_Up"].includes(
    gestureResult.categoryName
  );
}

function getCustomGesture(landmarks, pose) {
  const fingers = getFingerState(landmarks);
  const count = Object.values(fingers).filter(Boolean).length;
  const center = getHandCenter(landmarks);
  const motion = getHandMotion(center);
  const zones = getBodyZones(pose);
  const nearMouth = zones.mouth && distance(center, zones.mouth) < 0.13;
  const nearFace = zones.face && distance(center, zones.face) < 0.18;
  const nearForehead = zones.forehead && distance(center, zones.forehead) < 0.16;
  const nearEar = zones.ear && distance(center, zones.ear) < 0.16;
  const nearChest = zones.chest && distance(center, zones.chest) < 0.22;
  const nearShoulder = zones.shoulder && distance(center, zones.shoulder) < 0.18;
  const farSide = Math.abs(center.x - 0.5) > 0.24;

  if (nearEar && fingers.thumb && fingers.pinky && !fingers.middle && !fingers.ring) {
    return motion.fast ? gesture("CALL_EMERGENCY") : gesture("CALL_FAMILY");
  }

  if (nearMouth && count >= 4) return gesture("CANT_SPEAK");
  if (nearMouth && fingers.index && !fingers.middle && !fingers.ring) return gesture("THIRSTY");
  if (nearMouth && fingers.thumb && fingers.index && fingers.middle && !fingers.ring) return gesture("WATER");
  if (nearMouth && count <= 2) return motion.active ? gesture("EAT") : gesture("HUNGRY");
  if (nearFace && count >= 4 && motion.down) return gesture("SLEEP");
  if (nearFace && count >= 4 && motion.side) return gesture("HOT");
  if (nearForehead) return gesture("DONT_UNDERSTAND");

  if (nearShoulder && motion.down) return gesture("TIRED");

  if (nearChest && count === 0) return motion.side ? gesture("COLD") : gesture("SORRY");
  if (nearChest && count >= 4 && motion.circleLike) return gesture("PLEASE");
  if (nearChest && count >= 4 && motion.down) return gesture("SLOWER");
  if (nearChest && count >= 4 && motion.towardCenter) return gesture("REPEAT");
  if (nearChest && count >= 4 && motion.side) return gesture("HOME");
  if (nearChest && count >= 4 && !motion.active) return gesture("WAITING");

  if (count >= 4 && farSide) return gesture("LOST");
  if (fingers.index && !fingers.middle && !fingers.ring && !nearMouth) return gesture("PAIN");
  if (fingers.thumb && fingers.index && !fingers.middle && !fingers.ring && motion.active) return gesture("WRITE");
  if (count >= 4 && motion.side) return gesture("BATHROOM");

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
  if (handMotionHistory.length > 10) handMotionHistory.shift();

  const first = handMotionHistory[0] ?? center;
  const last = handMotionHistory[handMotionHistory.length - 1] ?? center;
  const dx = last.x - first.x;
  const dy = last.y - first.y;
  const spreadX = Math.max(...handMotionHistory.map((point) => point.x)) - Math.min(...handMotionHistory.map((point) => point.x));
  const spreadY = Math.max(...handMotionHistory.map((point) => point.y)) - Math.min(...handMotionHistory.map((point) => point.y));

  return {
    active: spreadX > 0.035 || spreadY > 0.035,
    fast: spreadX > 0.08 || spreadY > 0.08,
    side: Math.abs(dx) > 0.045,
    down: dy > 0.045,
    towardCenter: Math.abs(last.x - 0.5) < Math.abs(first.x - 0.5) - 0.025,
    circleLike: spreadX > 0.025 && spreadY > 0.025
  };
}

function getBodyZones(pose) {
  if (!pose) return {};

  const nose = pose[0];
  const mouthLeft = pose[9];
  const mouthRight = pose[10];
  const leftShoulder = pose[11];
  const rightShoulder = pose[12];
  const leftEar = pose[7];
  const rightEar = pose[8];
  const mouth = midpoint(mouthLeft, mouthRight) || nose;
  const shoulder = midpoint(leftShoulder, rightShoulder);
  const chest = shoulder ? { x: shoulder.x, y: shoulder.y + 0.16 } : undefined;
  const face = nose;
  const forehead = nose ? { x: nose.x, y: nose.y - 0.08 } : undefined;
  const ear = nearestToHand([leftEar, rightEar]);

  return { mouth, shoulder, chest, face, forehead, ear };
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
  const thumbTip = landmarks[4];
  const thumbIp = landmarks[3];
  const indexTip = landmarks[8];
  const indexPip = landmarks[6];
  const middleTip = landmarks[12];
  const middlePip = landmarks[10];
  const ringTip = landmarks[16];
  const ringPip = landmarks[14];
  const pinkyTip = landmarks[20];
  const pinkyPip = landmarks[18];

  return {
    thumb: Math.abs(thumbTip.x - wrist.x) > Math.abs(thumbIp.x - wrist.x) + 0.035,
    index: indexTip.y < indexPip.y - 0.025,
    middle: middleTip.y < middlePip.y - 0.025,
    ring: ringTip.y < ringPip.y - 0.025,
    pinky: pinkyTip.y < pinkyPip.y - 0.025
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
    } else {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "Sin camaras";
      cameraSelect.append(option);
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
    button.innerHTML = `<strong>${sign.phrase}</strong><span>${sign.sign}${sign.gesture ? " - camara" : " - boton"}</span>`;
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
    item.innerHTML = `<strong>${sign.sign}</strong><span class="guide-tag">${sign.gesture ? "Camara" : "Boton"}</span><span>${sign.how}</span>`;
    guideList.append(item);
  }
}
