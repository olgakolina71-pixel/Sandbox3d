import { createVerity } from "./verity.js";

(() => {
  const canvas = document.getElementById("renderCanvas");
  const status = document.getElementById("status");
  const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0.55, 0.76, 0.91, 1);
  scene.collisionsEnabled = true;
  scene.gravity = new BABYLON.Vector3(0, -0.22, 0);

  const camera = new BABYLON.UniversalCamera("playerCamera", new BABYLON.Vector3(0, 3, -8), scene);
  camera.setTarget(new BABYLON.Vector3(0, 1, 0));
  camera.attachControl(canvas, true);
  camera.speed = 0.28;
  camera.angularSensibility = 3800;
  camera.minZ = 0.1;
  camera.applyGravity = true;
  camera.checkCollisions = true;
  camera.ellipsoid = new BABYLON.Vector3(0.38, 0.9, 0.38);
  camera.keysUp = [87, 38];
  camera.keysDown = [83, 40];
  camera.keysLeft = [65, 37];
  camera.keysRight = [68, 39];
  camera.inertia = 0.72;

  const hemi = new BABYLON.HemisphericLight("skyLight", new BABYLON.Vector3(0, 1, 0), scene);
  hemi.intensity = 0.82;
  const sun = new BABYLON.DirectionalLight("sun", new BABYLON.Vector3(-0.5, -1, 0.4), scene);
  sun.position = new BABYLON.Vector3(20, 35, -20);
  sun.intensity = 0.8;

  const mats = {};
  const colors = { grass: "#65a84c", stone: "#929ba8", wood: "#95613a", sand: "#d8bd78", brick: "#ad5947", neon: "#50f5d0" };
  Object.entries(colors).forEach(([key, hex]) => {
    const mat = new BABYLON.StandardMaterial(key + "Material", scene);
    mat.diffuseColor = BABYLON.Color3.FromHexString(hex);
    mat.specularColor = key === "neon" ? new BABYLON.Color3(0.8, 1, 1) : new BABYLON.Color3(0.12, 0.12, 0.12);
    if (key === "neon") { mat.emissiveColor = BABYLON.Color3.FromHexString("#1a8f7a"); }
    mats[key] = mat;
  });

  const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 80, height: 80 }, scene);
  ground.position.y = -0.51;
  ground.checkCollisions = true;
  const groundMat = new BABYLON.StandardMaterial("groundMaterial", scene);
  groundMat.diffuseColor = BABYLON.Color3.FromHexString("#547b4c");
  groundMat.specularColor = new BABYLON.Color3(0, 0, 0);
  ground.material = groundMat;

  const grid = BABYLON.MeshBuilder.CreateGround("grid", { width: 80, height: 80, subdivisions: 80 }, scene);
  grid.position.y = -0.495;
  const gridMat = new BABYLON.StandardMaterial("gridMaterial", scene);
  gridMat.diffuseColor = new BABYLON.Color3(0.22, 0.31, 0.22);
  gridMat.alpha = 0.18;
  gridMat.wireframe = true;
  grid.material = gridMat;
  grid.isPickable = false;

  const blocks = [];
  const blockSize = 1;
  let selectedMaterial = "grass";
  let mode = "build";
  let mobileAction = false;
  const keyState = {};
  const mobileMove = { forward: false, back: false, left: false, right: false };

  function makeBlock(x, y, z, materialName, initial = false) {
    const block = BABYLON.MeshBuilder.CreateBox("block", { size: blockSize }, scene);
    block.position.set(x, y, z);
    block.material = mats[materialName] || mats.grass;
    block.checkCollisions = true;
    block.isPickable = true;
    block.metadata = { materialName, userBlock: true };
    blocks.push(block);
    return block;
  }

  function addStarterBuild() {
    for (let x = -2; x <= 2; x++) {
      for (let z = 1; z <= 3; z++) makeBlock(x, 0, z, (x + z) % 3 === 0 ? "wood" : "grass", true);
    }
    makeBlock(0, 1, 2, "stone", true);
    makeBlock(0, 2, 2, "stone", true);
    makeBlock(-1, 1, 2, "wood", true);
    makeBlock(1, 1, 2, "wood", true);
  }
  addStarterBuild();

  function setStatus(message) { status.textContent = message; }
  const verity = createVerity(scene, camera, BABYLON, setStatus);
  function snap(v) { return Math.round(v / blockSize) * blockSize; }
  function performAction() {
    const ray = scene.createPickingRay(canvas.width / 2, canvas.height / 2, BABYLON.Matrix.Identity(), camera);
    const hit = scene.pickWithRay(ray, mesh => mesh === ground || (mesh.metadata && mesh.metadata.userBlock));
    if (!hit || !hit.hit || !hit.pickedPoint) { setStatus("Наведи прицел на землю или блок"); return; }
    if (mode === "remove") {
      const target = hit.pickedMesh;
      if (target && target.metadata && target.metadata.userBlock) {
        const i = blocks.indexOf(target); if (i >= 0) blocks.splice(i, 1);
        target.dispose(); setStatus("Блок удалён");
      } else setStatus("Здесь нет блока");
      return;
    }
    let p = hit.pickedPoint.clone();
    if (hit.pickedMesh !== ground && hit.getNormal) {
      const normal = hit.getNormal(true);
      if (normal) p.addInPlace(normal.scale(0.51));
    } else p.y = 0;
    const x = snap(p.x), y = Math.max(0, snap(p.y)), z = snap(p.z);
    if (BABYLON.Vector3.Distance(camera.position, new BABYLON.Vector3(x, y, z)) < 1.25) {
      setStatus("Слишком близко к игроку"); return;
    }
    const occupied = blocks.some(b => Math.abs(b.position.x-x)<0.1 && Math.abs(b.position.y-y)<0.1 && Math.abs(b.position.z-z)<0.1);
    if (!occupied) { makeBlock(x, y, z, selectedMaterial); setStatus("Блок установлен: " + selectedMaterial); }
  }

  canvas.addEventListener("pointerdown", event => {
    if (event.button === 0 && !event.isPrimary) return;
    if (event.button === 0 && !("ontouchstart" in window)) performAction();
  });
  canvas.addEventListener("contextmenu", e => e.preventDefault());
  document.getElementById("buildBtn").addEventListener("click", () => setMode("build"));
  document.getElementById("removeBtn").addEventListener("click", () => setMode("remove"));
  function setMode(next) {
    mode = next;
    document.getElementById("buildBtn").classList.toggle("active", mode === "build");
    document.getElementById("removeBtn").classList.toggle("active", mode === "remove");
    document.getElementById("mobileAction").textContent = mode === "build" ? "СТРОИТЬ" : "УДАЛИТЬ";
    setStatus(mode === "build" ? "Режим строительства" : "Режим удаления");
  }
  document.querySelectorAll(".material").forEach(btn => btn.addEventListener("click", () => {
    selectedMaterial = btn.dataset.material;
    document.querySelectorAll(".material").forEach(b => b.classList.toggle("selected", b === btn));
    setStatus("Материал: " + btn.textContent.trim());
  }));

  window.addEventListener("keydown", e => {
    keyState[e.code] = true;
    if (e.code === "Space") { e.preventDefault(); if (camera.position.y < 2.2) camera.cameraDirection.y += 0.16; }
    if (e.code === "KeyE") performAction();
  });
  window.addEventListener("keyup", e => { keyState[e.code] = false; });

  document.querySelectorAll("[data-move]").forEach(btn => {
    const dir = btn.dataset.move;
    const on = e => { e.preventDefault(); mobileMove[dir] = true; };
    const off = e => { e.preventDefault(); mobileMove[dir] = false; };
    btn.addEventListener("pointerdown", on);
    ["pointerup","pointercancel","pointerleave"].forEach(ev => btn.addEventListener(ev, off));
  });
  document.getElementById("jumpBtn").addEventListener("pointerdown", e => {
    e.preventDefault(); if (camera.position.y < 2.2) camera.cameraDirection.y += 0.16;
  });
  document.getElementById("mobileAction").addEventListener("click", performAction);

  function saveWorld() {
    const data = blocks.map(b => ({ x:b.position.x, y:b.position.y, z:b.position.z, material:b.metadata.materialName }));
    localStorage.setItem("miniSandboxWorld", JSON.stringify(data));
    setStatus("Мир сохранён на этом устройстве");
  }
  function loadWorld() {
    const raw = localStorage.getItem("miniSandboxWorld");
    if (!raw) return false;
    try {
      const data = JSON.parse(raw);
      if (!Array.isArray(data)) return false;
      blocks.splice(0).forEach(b => b.dispose());
      data.forEach(b => makeBlock(Number(b.x)||0, Number(b.y)||0, Number(b.z)||0, colors[b.material] ? b.material : "grass"));
      return true;
    } catch { return false; }
  }
  document.getElementById("saveBtn").addEventListener("click", saveWorld);
  document.getElementById("resetBtn").addEventListener("click", () => {
    if (!confirm("Удалить постройки и вернуть начальный мир?")) return;
    blocks.splice(0).forEach(b => b.dispose());
    localStorage.removeItem("miniSandboxWorld");
    addStarterBuild(); setStatus("Мир сброшен");
  });
  if (loadWorld()) setStatus("Сохранённый мир загружен");

  let previousFrame = performance.now();
  engine.runRenderLoop(() => {
    const now = performance.now();
    const deltaSeconds = Math.min((now - previousFrame) / 1000, 0.05);
    previousFrame = now;
    verity.update(deltaSeconds);
    const forward = (mobileMove.forward ? 1 : 0) - (mobileMove.back ? 1 : 0);
    const side = (mobileMove.right ? 1 : 0) - (mobileMove.left ? 1 : 0);
    if (forward || side) {
      const f = camera.getDirection(BABYLON.Axis.Z);
      const r = camera.getDirection(BABYLON.Axis.X);
      f.y = 0; r.y = 0; f.normalize(); r.normalize();
      camera.cameraDirection.addInPlace(f.scale(forward * 0.035)).addInPlace(r.scale(side * 0.035));
    }
    scene.render();
  });
  window.addEventListener("resize", () => engine.resize());
  setStatus("Мир готов — строй и исследуй!");
})();