export function createVerity(scene, camera, BABYLON, setStatus) {
  const root = new BABYLON.TransformNode("verityCompanion", scene);
  const yellow = new BABYLON.StandardMaterial("verityYellow", scene);
  yellow.diffuseColor = BABYLON.Color3.FromHexString("#ffd83d");
  yellow.emissiveColor = BABYLON.Color3.FromHexString("#5a3d08");
  yellow.specularColor = new BABYLON.Color3(0.35, 0.3, 0.12);

  const dark = new BABYLON.StandardMaterial("verityFace", scene);
  dark.diffuseColor = BABYLON.Color3.FromHexString("#302b25");
  dark.emissiveColor = BABYLON.Color3.FromHexString("#17130f");

  const head = BABYLON.MeshBuilder.CreateSphere("verityHead", { diameter: 1.35, segments: 24 }, scene);
  head.parent = root;
  head.material = yellow;
  head.isPickable = false;

  const eyeL = BABYLON.MeshBuilder.CreateSphere("verityEyeLeft", { diameter: 0.13, segments: 12 }, scene);
  const eyeR = BABYLON.MeshBuilder.CreateSphere("verityEyeRight", { diameter: 0.13, segments: 12 }, scene);
  [eyeL, eyeR].forEach((eye, i) => {
    eye.parent = root;
    eye.material = dark;
    eye.position.set(i ? 0.24 : -0.24, 0.13, -0.61);
    eye.scaling.z = 0.45;
    eye.isPickable = false;
  });
  const smilePath = [];
  for (let i = 0; i <= 12; i++) {
    const x = -0.24 + i * 0.04;
    const y = -0.16 - Math.sin((i / 12) * Math.PI) * 0.12;
    smilePath.push(new BABYLON.Vector3(x, y, -0.64));
  }
  const smile = BABYLON.MeshBuilder.CreateTube("veritySmile", { path: smilePath, radius: 0.025, tessellation: 8 }, scene);
  smile.parent = root;
  smile.material = dark;
  smile.isPickable = false;

  const glow = BABYLON.MeshBuilder.CreateSphere("verityGlow", { diameter: 1.62, segments: 16 }, scene);
  glow.parent = root;
  glow.scaling.y = 0.18;
  glow.position.y = -0.77;
  const glowMat = new BABYLON.StandardMaterial("verityGlowMat", scene);
  glowMat.emissiveColor = BABYLON.Color3.FromHexString("#ffe27a");
  glowMat.alpha = 0.22;
  glowMat.disableLighting = true;
  glow.material = glowMat;
  glow.isPickable = false;

  root.position.copyFrom(camera.position);
  root.position.y -= 0.45;
  let hoverBaseY = root.position.y;
  let following = true;
  let mood = "happy";
  let messageTimer = 0;

  const panel = document.getElementById("verityPanel");
  const toggle = document.getElementById("verityToggle");
  const close = document.getElementById("verityClose");
  const form = document.getElementById("verityForm");
  const input = document.getElementById("verityInput");
  const messages = document.getElementById("verityMessages");
  const bubble = document.getElementById("verityBubble");

  function addMessage(text, who) {
    const item = document.createElement("div");
    item.className = "verity-message " + who;
    item.textContent = text;
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
  }
  function say(text) {
    bubble.textContent = text;
    bubble.classList.add("visible");
    messageTimer = 5;
    addMessage(text, "verity");
  }
  async function answer(raw) {
    const text = raw.trim().toLowerCase();
    if (!text) return;
    addMessage(raw.trim(), "user");
    if (text.includes("стой") || text.includes("останься")) {
      following = false;
      say("Хорошо! Подожду здесь 🙂");
    } else if (text.includes("следуй") || text.includes("иди за мной")) {
      following = true;
      say("Иду за тобой! ✨");
    } else if (text.includes("танц")) {
      mood = "dance";
      say("Уиии! Смотри мой танец! 😄");
    } else if (text.includes("помощ") || text.includes("что умеешь") || text === "помоги") {
      say("Я могу следовать за тобой, ждать, танцевать и подсказывать управление. Напиши «следуй за мной» или «стой».");
    } else if (text.includes("привет") || text.includes("здравств")) {
      say("Привет! Я Верити. Давай построим что-нибудь классное!");
    } else if (text.includes("как дела")) {
      say("Отлично! Здесь столько места для приключений 😁");
    } else if (text.includes("построй") || text.includes("строить")) {
      say("Выбери материал слева, наведи прицел на место и нажми ЛКМ. Я могу помочь советом!");
    } else {
      setStatus("Верити думает…");
      try {
        const response = await fetch("/api/verity", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: [{ role: "user", content: raw.trim() }] }) });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "AI service unavailable");
        if (typeof data.reply !== "string" || !data.reply.trim()) throw new Error("Empty model response");
        say(data.reply.trim().slice(0, 1800));
      } catch (error) {
        say(error.message.includes("AI binding") || error.message.includes("not configured")
          ? "Мой ИИ-модуль ещё не подключён к Cloudflare. Чат готов, но для настоящих ответов нужно включить Workers AI."
          : "Не удалось связаться с ИИ-сервисом. Проверь подключение и попробуй ещё раз.");
        setStatus("Верити AI недоступен");
      }
    }
  }

  toggle.addEventListener("click", () => {
    panel.classList.toggle("open");
    if (panel.classList.contains("open") && messages.childElementCount === 0) {
      say("Привет! Я Верити — твой 3D-компаньон. Чем займёмся?");
    }
  });
  close.addEventListener("click", () => panel.classList.remove("open"));
  form.addEventListener("submit", event => {
    event.preventDefault();
    const value = input.value;
    input.value = "";
    answer(value);
    input.focus();
  });

  function update(deltaSeconds) {
    const forward = camera.getDirection(BABYLON.Axis.Z);
    const right = camera.getDirection(BABYLON.Axis.X);
    forward.y = 0; right.y = 0;
    forward.normalize(); right.normalize();
    if (following) {
      const target = camera.position.add(forward.scale(2.0)).add(right.scale(1.35));
      target.y = Math.max(1.25, camera.position.y - 0.35);
      root.position = BABYLON.Vector3.Lerp(root.position, target, Math.min(1, deltaSeconds * 3.2));
      hoverBaseY = target.y;
    }
    const toCamera = camera.position.subtract(root.position);
    root.rotation.y = Math.atan2(-toCamera.x, -toCamera.z);
    const t = performance.now() * 0.001;
    root.position.y = hoverBaseY + Math.sin(t * (mood === "dance" ? 9 : 2.6)) * (mood === "dance" ? 0.12 : 0.055);
    root.rotation.z = mood === "dance" ? Math.sin(t * 9) * 0.22 : Math.sin(t * 2) * 0.035;
    if (mood === "dance" && Math.floor(t) % 4 === 0) mood = "happy";
    if (messageTimer > 0) {
      messageTimer -= deltaSeconds;
      if (messageTimer <= 0) bubble.classList.remove("visible");
    }
  }
  function dispose() {
    root.getChildMeshes().forEach(mesh => mesh.dispose());
    root.dispose();
    [toggle, close, form].forEach(el => el.replaceWith(el.cloneNode(true)));
  }
  return { update, dispose, say };
}
