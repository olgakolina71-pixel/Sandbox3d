import { createVerity } from "./verity.js";
import { createMultiplayer } from "./multiplayer.js";
import { importGlbFile } from "./assetLibrary.js";

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
  function makeSurfaceTexture(name, base, size = 512) {
    const texture = new BABYLON.DynamicTexture(name, { width: size, height: size }, scene, false);
    const ctx = texture.getContext();
    ctx.fillStyle = base; ctx.fillRect(0, 0, size, size);
    let seed = name.split("").reduce((n, c) => n + c.charCodeAt(0), 193);
    const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    if (name.startsWith("grass")) {
      for (let i=0;i<5200;i++) { const x=rand()*size,y=rand()*size,r=1+rand()*3.5;ctx.fillStyle=rand()>.5?"rgba(202,235,126,.22)":"rgba(20,66,31,.24)";ctx.beginPath();ctx.ellipse(x,y,r,r*1.8,rand()*3,0,Math.PI*2);ctx.fill(); }
      for(let i=0;i<80;i++){const x=rand()*size,y=rand()*size;ctx.strokeStyle="rgba(32,91,40,.25)";ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+rand()*10-5,y-5-rand()*12);ctx.stroke();}
    } else if (name.startsWith("stone")) {
      for(let i=0;i<3600;i++){const x=rand()*size,y=rand()*size,r=1+rand()*5;ctx.fillStyle=rand()>.5?"rgba(255,255,255,.13)":"rgba(25,35,48,.16)";ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
      for(let i=0;i<24;i++){let x=rand()*size,y=rand()*size;ctx.strokeStyle="rgba(35,45,58,.22)";ctx.lineWidth=1+rand()*2;ctx.beginPath();ctx.moveTo(x,y);for(let j=0;j<4;j++){x+=rand()*38-19;y+=rand()*38-19;ctx.lineTo(x,y);}ctx.stroke();}
    } else if (name.startsWith("wood")) {
      for(let i=0;i<100;i++){const y=rand()*size;ctx.strokeStyle=rand()>.5?"rgba(47,24,9,.25)":"rgba(255,208,143,.2)";ctx.lineWidth=1+rand()*4;ctx.beginPath();ctx.moveTo(0,y);ctx.bezierCurveTo(size*.3,y-10,size*.7,y+12,size,y+rand()*8-4);ctx.stroke();}
      for(let i=0;i<14;i++){const x=rand()*size,y=rand()*size;ctx.strokeStyle="rgba(45,22,9,.3)";ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,8+rand()*22,3+rand()*8,0,0,Math.PI*2);ctx.stroke();}
    } else if (name.startsWith("sand")) {
      for(let i=0;i<160;i++){const y=rand()*size;ctx.strokeStyle=rand()>.5?"rgba(255,244,199,.25)":"rgba(130,96,48,.14)";ctx.lineWidth=1+rand()*3;ctx.beginPath();ctx.moveTo(0,y);ctx.bezierCurveTo(size*.3,y-18,size*.7,y+18,size,y+rand()*8-4);ctx.stroke();}
      for(let i=0;i<4200;i++){ctx.fillStyle=rand()>.5?"rgba(255,255,255,.15)":"rgba(112,83,44,.12)";ctx.fillRect(rand()*size,rand()*size,1+rand()*2,1+rand()*2);}
    } else if (name.startsWith("brick")) {
      const w=size/4,h=size/8;
      for(let y=0;y<size;y+=h){const offset=(Math.round(y/h)%2)*w/2;for(let x=-w;x<size+w;x+=w){ctx.fillStyle="rgba(55,20,16,.34)";ctx.fillRect(x+offset,y,w-3,h-3);ctx.fillStyle="rgba(255,193,153,.14)";ctx.fillRect(x+offset+2,y+2,w-8,2);}}
      for(let i=0;i<1000;i++){ctx.fillStyle=rand()>.5?"rgba(255,220,185,.10)":"rgba(55,20,15,.10)";ctx.fillRect(rand()*size,rand()*size,2+rand()*8,1+rand()*3);}
    } else {
      ctx.strokeStyle="rgba(220,255,249,.5)";ctx.lineWidth=3;
      for(let i=0;i<12;i++){const x=rand()*size,y=rand()*size;ctx.strokeRect(x,y,18+rand()*54,18+rand()*54);}
      for(let i=0;i<70;i++){ctx.fillStyle="rgba(255,255,255,.7)";ctx.fillRect(rand()*size,rand()*size,2+rand()*5,2+rand()*5);}
    }
    texture.update(); texture.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE; texture.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
    texture.anisotropicFilteringLevel = 8;
    return texture;
  }
  function makeNormalMap(sourceTexture, name) {
    const size = 128, normal = new BABYLON.DynamicTexture(name, {width:size,height:size}, scene, false);
    const src = sourceTexture.getContext().getImageData(0,0,sourceTexture.getSize().width,sourceTexture.getSize().height);
    const dst = normal.getContext().createImageData(size,size);
    const sw=sourceTexture.getSize().width, sh=sourceTexture.getSize().height;
    const lum=(x,y)=>{const i=(Math.max(0,Math.min(sh-1,y))*sw+Math.max(0,Math.min(sw-1,x)))*4;return (src.data[i]*.3+src.data[i+1]*.59+src.data[i+2]*.11)/255;};
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){const sx=Math.floor(x/size*sw),sy=Math.floor(y/size*sh),dx=(lum(sx+2,sy)-lum(sx-2,sy))*2,dy=(lum(sx,sy+2)-lum(sx,sy-2))*2;let nx=-dx,ny=-dy,nz=1.0,len=Math.hypot(nx,ny,nz);const i=(y*size+x)*4;dst.data[i]=(nx/len*.5+.5)*255;dst.data[i+1]=(ny/len*.5+.5)*255;dst.data[i+2]=(nz/len*.5+.5)*255;dst.data[i+3]=255;}
    normal.getContext().putImageData(dst,0,0);normal.update();return normal;
  }
  Object.entries(colors).forEach(([key, hex]) => {
    const albedo = makeSurfaceTexture(key + "Surface", hex);
    const mat = new BABYLON.PBRMaterial(key + "Material", scene);
    mat.albedoTexture = albedo;
    mat.bumpTexture = makeNormalMap(albedo, key + "Normal");
    mat.roughness = key === "neon" ? 0.28 : key === "wood" ? 0.72 : 0.9;
    mat.metallic = key === "neon" ? 0.35 : 0.02;
    mat.useRoughnessFromMetallicTextureAlpha = false;
    if (key === "neon") { mat.emissiveColor = BABYLON.Color3.FromHexString("#168f7c"); mat.emissiveIntensity = 0.65; }
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
  const undoStack = [];
  const redoStack = [];
  const HISTORY_LIMIT = 100;
  let multiplayer = null;
  const blockSize = 1;
  let selectedMaterial = "grass";
  let mode = "build";
  let mobileAction = false;
  const keyState = {};
  const mobileMove = { forward: false, back: false, left: false, right: false };

  function rememberAction(action) { undoStack.push(action); if (undoStack.length > HISTORY_LIMIT) undoStack.shift(); redoStack.length = 0; updateHistoryButtons(); }
  function updateHistoryButtons() { const undo=document.getElementById("undoBtn"), redo=document.getElementById("redoBtn"); if(undo) undo.disabled=!undoStack.length; if(redo) redo.disabled=!redoStack.length; }
  function removeBlockAt(x,y,z) { const target=blocks.find(b=>Math.abs(b.position.x-x)<0.01&&Math.abs(b.position.y-y)<0.01&&Math.abs(b.position.z-z)<0.01); if(!target)return false; blocks.splice(blocks.indexOf(target),1); target.dispose(); return true; }
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
  window.__miniSandboxGetBlocks = () => blocks.map(b => ({x:b.position.x,y:b.position.y,z:b.position.z,material:b.metadata.materialName}));
  multiplayer = createMultiplayer({ scene, camera, BABYLON, onStatus: setStatus,
    onBlockAdd: b => { const exists=blocks.some(v=>v.position.x===b.x&&v.position.y===b.y&&v.position.z===b.z); if(!exists)makeBlock(b.x,b.y,b.z,b.material); },
    onBlockRemove: b => { const target=blocks.find(v=>v.position.x===b.x&&v.position.y===b.y&&v.position.z===b.z); if(target){blocks.splice(blocks.indexOf(target),1);target.dispose()} },
    onWorldSync: data => { blocks.splice(0).forEach(b=>b.dispose()); data.forEach(b=>makeBlock(b.x,b.y,b.z,b.material)); }
  });

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
        multiplayer.sendBlockRemove({x:target.position.x,y:target.position.y,z:target.position.z,material:target.metadata.materialName});
        rememberAction({type:"remove",x:target.position.x,y:target.position.y,z:target.position.z,material:target.metadata.materialName});
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
    if (!occupied) { makeBlock(x, y, z, selectedMaterial); rememberAction({type:"add",x,y,z,material:selectedMaterial}); multiplayer.sendBlockAdd({x,y,z,material:selectedMaterial}); setStatus("Блок установлен: " + selectedMaterial); }
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
  function selectMaterial(name) {
    selectedMaterial = name;
    document.querySelectorAll(".material").forEach(b => b.classList.toggle("selected", b.dataset.material === name));
    document.querySelectorAll(".hotbar-slot").forEach(b => b.classList.toggle("active", b.dataset.hotbar === name));
    setStatus("Материал: " + name);
  }
  document.querySelectorAll(".material").forEach(btn => btn.addEventListener("click", () => selectMaterial(btn.dataset.material)));
  document.querySelectorAll(".hotbar-slot").forEach(btn => btn.addEventListener("click", () => selectMaterial(btn.dataset.hotbar)));
  window.addEventListener("keydown", e => { const n = Number(e.key); if (n >= 1 && n <= 6) { const slot = document.querySelector(`.hotbar-slot[data-hotbar="${["grass","stone","wood","sand","brick","neon"][n-1]}"]`); if (slot) selectMaterial(slot.dataset.hotbar); } });

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

  function applyHistory(action, undo) {
    const shouldExist = (action.type === "add") !== undo;
    if (shouldExist) {
      const exists=blocks.some(b=>Math.abs(b.position.x-action.x)<0.01&&Math.abs(b.position.y-action.y)<0.01&&Math.abs(b.position.z-action.z)<0.01);
      if(!exists){makeBlock(action.x,action.y,action.z,action.material);multiplayer.sendBlockAdd({x:action.x,y:action.y,z:action.z,material:action.material});}
    } else if(removeBlockAt(action.x,action.y,action.z)) {
      multiplayer.sendBlockRemove({x:action.x,y:action.y,z:action.z,material:action.material});
    }
  }
  function undoAction() { const action=undoStack.pop(); if(!action)return; applyHistory(action,true); redoStack.push(action); updateHistoryButtons(); setStatus("Действие отменено"); }
  function redoAction() { const action=redoStack.pop(); if(!action)return; applyHistory(action,false); undoStack.push(action); updateHistoryButtons(); setStatus("Действие повторено"); }

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


  document.getElementById("undoBtn").addEventListener("click",undoAction);
  document.getElementById("redoBtn").addEventListener("click",redoAction);
  window.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="z"){e.preventDefault();undoAction();}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="y"){e.preventDefault();redoAction();}});
  function currentWorldPayload() {
    return { format: "mini-sandbox-world", version: 1, createdAt: new Date().toISOString(), blocks: blocks.map(b => ({ x:b.position.x, y:b.position.y, z:b.position.z, material:b.metadata.materialName })) };
  }
  function encodeWorldForUrl(payload) {
    const bytes = new TextEncoder().encode(JSON.stringify(payload));
    let binary = "";
    bytes.forEach(byte => binary += String.fromCharCode(byte));
    return btoa(binary).replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=+$/g, "");
  }
  function decodeWorldFromUrl(value) {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64 + "=".repeat((4 - base64.length % 4) % 4));
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  }
  async function shareWorld() {
    const payload = currentWorldPayload();
    if (payload.blocks.length > 1800) { setStatus("Мир большой для ссылки — используй экспорт JSON"); return; }
    const url = new URL(location.href);
    url.hash = "world=" + encodeWorldForUrl(payload);
    try {
      if (navigator.share) await navigator.share({ title: "Мой мир MINI SANDBOX 3D", text: "Посмотри мою постройку!", url: url.href });
      else { await navigator.clipboard.writeText(url.href); setStatus("Ссылка на мир скопирована"); }
    } catch (error) {
      if (error.name !== "AbortError") setStatus("Не удалось поделиться ссылкой — попробуй экспорт JSON");
    }
  }
  function loadSharedWorldFromUrl() {
    const match = location.hash.match(/(?:^#|&)world=([^&]+)/);
    if (!match) return false;
    try {
      const payload = decodeWorldFromUrl(match[1]);
      const data = Array.isArray(payload) ? payload : payload.blocks;
      if (!Array.isArray(data) || data.length > 10000) throw new Error("Неверный формат");
      const safe = data.filter(b => b && [b.x,b.y,b.z].every(v => Number.isFinite(Number(v)) && Math.abs(Number(v)) <= 500) && Math.abs(Number(b.y)) <= 200)
        .map(b => ({x:Number(b.x),y:Number(b.y),z:Number(b.z),material:colors[b.material]?b.material:"grass"}));
      blocks.splice(0).forEach(b => b.dispose());
      safe.forEach(b => makeBlock(b.x,b.y,b.z,b.material));
      history.replaceState(null, "", location.pathname + location.search);
      setStatus("Загружен мир по ссылке: " + safe.length + " блоков");
      return true;
    } catch (error) {
      setStatus("Ссылка на мир повреждена или устарела");
      history.replaceState(null, "", location.pathname + location.search);
      return false;
    }
  }
  document.getElementById("shareWorldBtn").addEventListener("click", shareWorld);
  async function checkForUpdates() {
    const feed = document.getElementById("updateFeed");
    if (!feed) return;
    try {
      const response = await fetch("./version.json", { cache: "no-store" });
      if (!response.ok) throw new Error("Не удалось получить версию");
      const info = await response.json();
      feed.innerHTML = "";
      const heading = document.createElement("strong");
      heading.textContent = "Версия " + (info.version || "—");
      const summary = document.createElement("p");
      summary.textContent = info.summary || "Обновления MINI SANDBOX 3D";
      const list = document.createElement("ul");
      (Array.isArray(info.changes) ? info.changes : []).slice(0, 5).forEach(change => {
        const item = document.createElement("li"); item.textContent = change; list.append(item);
      });
      feed.append(heading, summary, list);
    } catch {
      feed.textContent = "Лента обновлений временно недоступна.";
    }
  }

  function exportWorldFile() {
    const payload={format:"mini-sandbox-world",version:1,createdAt:new Date().toISOString(),blocks:blocks.map(b=>({x:b.position.x,y:b.position.y,z:b.position.z,material:b.metadata.materialName}))};
    const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}));
    const a=document.createElement("a");a.href=url;a.download="mini-sandbox-world.json";a.click();URL.revokeObjectURL(url);setStatus("Файл мира экспортирован");
  }
  async function importWorldFile(file) {
    if(!file||file.size>2*1024*1024)throw new Error("Файл мира должен быть меньше 2 МБ");
    const parsed=JSON.parse(await file.text());const data=Array.isArray(parsed)?parsed:parsed.blocks;
    if(!Array.isArray(data)||data.length>10000)throw new Error("Некорректный файл или слишком много блоков");
    const safe=data.filter(b=>b&&[b.x,b.y,b.z].every(v=>Number.isFinite(Number(v)))&&Math.abs(Number(b.x))<=500&&Math.abs(Number(b.y))<=200&&Math.abs(Number(b.z))<=500).map(b=>({x:Number(b.x),y:Number(b.y),z:Number(b.z),material:colors[b.material]?b.material:"grass"}));
    blocks.splice(0).forEach(b=>b.dispose());safe.forEach(b=>makeBlock(b.x,b.y,b.z,b.material));undoStack.length=0;redoStack.length=0;updateHistoryButtons();saveWorld();setStatus("Импортировано блоков: "+safe.length);
  }
  document.getElementById("exportWorldBtn").addEventListener("click",exportWorldFile);
  const worldFileInput=document.getElementById("worldFileInput");
  document.getElementById("importWorldBtn").addEventListener("click",()=>worldFileInput.click());
  worldFileInput.addEventListener("change",async()=>{try{await importWorldFile(worldFileInput.files[0]);}catch(error){setStatus("Импорт не выполнен: "+error.message);}finally{worldFileInput.value="";}});

  const importModelBtn = document.getElementById("importModelBtn");
  const modelFileInput = document.getElementById("modelFileInput");
  importModelBtn.addEventListener("click", () => modelFileInput.click());
  modelFileInput.addEventListener("change", async () => {
    const file = modelFileInput.files && modelFileInput.files[0];
    if (!file) return;
    importModelBtn.disabled = true;
    importModelBtn.textContent = "Загрузка модели…";
    try {
      const model = await importGlbFile(file, scene, BABYLON, camera);
      setStatus("3D-модель добавлена: " + file.name);
      model.root.metadata = { importedModel: true, localOnly: true };
    } catch (error) {
      console.error("Model import failed:", error);
      setStatus("Не удалось загрузить модель: " + (error.message || "ошибка формата"));
    } finally {
      importModelBtn.disabled = false;
      importModelBtn.textContent = "⬆ Импортировать 3D-модель";
      modelFileInput.value = "";
    }
  });

  const hub = document.getElementById("hubModal");
  const hubContent = document.getElementById("hubContent");
  const hubTitle = document.getElementById("hubTitle");
  const hubTabs = [...document.querySelectorAll("[data-hub-tab]")];
  function openHub(tab = "home") {
    hub.classList.add("open"); hub.setAttribute("aria-hidden","false"); showHubTab(tab);
    document.exitPointerLock?.();
  }
  function closeHub() { hub.classList.remove("open"); hub.setAttribute("aria-hidden","true"); }
  function showHubTab(tab) {
    hubTabs.forEach(b=>b.classList.toggle("active",b.dataset.hubTab===tab));
    const titles={home:"Главное меню",worlds:"Мои миры",shop:"Магазин",settings:"Настройки"};
    hubTitle.textContent=titles[tab]||titles.home;
    if(tab==="home") { hubContent.innerHTML=`<div class="hub-hero"><div class="hub-hero-main"><h3>Твой мир. Твои правила.</h3><p>Строй, исследуй и создавай собственные пространства вместе с друзьями.</p><button class="hub-primary" data-hub-action="resume">▶ Продолжить игру</button></div><div class="hub-side-card"><div class="hub-stat"><span>Режим</span><b>Creative</b></div><div class="hub-stat"><span>Материалы</span><b>6 видов</b></div><div class="hub-stat"><span>Сохранение</span><b>На устройстве</b></div><button class="hub-secondary" data-hub-action="worlds">Открыть мои миры</button></div></div><section class="update-feed"><h3>Последние обновления</h3><div id="updateFeed">Проверяем версию…</div><a href="https://github.com/olgakolina71-pixel/Sandbox3d/issues" target="_blank" rel="noopener">Сообщить об ошибке / предложить идею ↗</a></section>`; checkForUpdates(); }
    if(tab==="worlds") hubContent.innerHTML=`<div class="hub-card-grid"><article class="hub-card"><div class="hub-card-art"></div><h3>Мой мир</h3><p>Локальное сохранение на этом устройстве</p><button class="hub-secondary" data-hub-action="load">Загрузить мир</button></article><article class="hub-card"><div class="hub-card-art" style="background:linear-gradient(135deg,#6c8ea8,#263f62)"></div><h3>Новый мир</h3><p>Начать чистую творческую площадку</p><button class="hub-secondary" data-hub-action="new">Создать мир</button></article></div>`;
    if(tab==="shop") hubContent.innerHTML=`<div class="hub-card-grid"><article class="hub-card"><div class="hub-card-art" style="background:linear-gradient(135deg,#6eaa5a,#315b3b)"></div><h3>Nature Pack</h3><p>Трава и природные оттенки</p><button class="hub-secondary" data-store-material="grass">Выбрать</button></article><article class="hub-card"><div class="hub-card-art" style="background:linear-gradient(135deg,#aab8c7,#566577)"></div><h3>Stoneworks</h3><p>Камень для крепостей и дорог</p><button class="hub-secondary" data-store-material="stone">Выбрать</button></article><article class="hub-card"><div class="hub-card-art" style="background:linear-gradient(135deg,#f4d078,#8f5b35)"></div><h3>Woodland</h3><p>Тёплые деревянные блоки</p><button class="hub-secondary" data-store-material="wood">Выбрать</button></article><article class="hub-card"><div class="hub-card-art" style="background:linear-gradient(135deg,#e5c98c,#a47d4e)"></div><h3>Desert</h3><p>Песочные материалы</p><button class="hub-secondary" data-store-material="sand">Выбрать</button></article><article class="hub-card"><div class="hub-card-art" style="background:linear-gradient(135deg,#dc8d75,#783e39)"></div><h3>Brick Set</h3><p>Кирпич для построек</p><button class="hub-secondary" data-store-material="brick">Выбрать</button></article><article class="hub-card"><div class="hub-card-art" style="background:linear-gradient(135deg,#adfff0,#0b9e86)"></div><h3>Neon Lab</h3><p>Светящиеся акценты</p><button class="hub-secondary" data-store-material="neon">Выбрать</button></article></div><p style="margin:12px 2px 0;color:#829ab6;font-size:10px">Это бесплатная витрина материалов — покупки и платежи не подключены.</p>`;
    if(tab==="settings") hubContent.innerHTML=`<div class="hub-setting"><div>Скорость движения<small>Регулирует скорость игрока</small></div><b id="speedValue">0.28</b><input id="speedRange" type="range" min="0.12" max="0.65" step="0.01" value="0.28"></div><div class="hub-setting"><div>Угол обзора<small>Ширина обзора камеры</small></div><b id="fovValue">0.80</b><input id="fovRange" type="range" min="0.55" max="1.25" step="0.01" value="0.80"></div><div class="hub-setting"><div>Качество рендера<small>Баланс качества и производительности</small></div><select id="qualitySelect" style="background:#102338;color:#eaf5ff;border:1px solid #ffffff22;border-radius:8px;padding:8px"><option value="1">Высокое</option><option value="1.5">Сбалансированное</option><option value="2">Производительность</option></select></div>`;
    if(tab==="settings") {
      const speed=document.getElementById("speedRange"), fov=document.getElementById("fovRange"), quality=document.getElementById("qualitySelect");
      speed.value=camera.speed;document.getElementById("speedValue").textContent=Number(camera.speed).toFixed(2);
      fov.value=camera.fov;document.getElementById("fovValue").textContent=Number(camera.fov).toFixed(2);
      speed.addEventListener("input",()=>{camera.speed=Number(speed.value);document.getElementById("speedValue").textContent=Number(speed.value).toFixed(2)});
      fov.addEventListener("input",()=>{camera.fov=Number(fov.value);document.getElementById("fovValue").textContent=Number(fov.value).toFixed(2)});
      quality.addEventListener("change",()=>engine.setHardwareScalingLevel(Number(quality.value)));
    }
  }
  hubTabs.forEach(b=>b.addEventListener("click",()=>showHubTab(b.dataset.hubTab)));
  document.querySelectorAll("[data-hub-close]").forEach(b=>b.addEventListener("click",closeHub));
  document.getElementById("menuBtn").addEventListener("click",()=>openHub("home"));
  document.getElementById("worldsBtn").addEventListener("click",()=>openHub("worlds"));
  document.getElementById("shopBtn").addEventListener("click",()=>openHub("shop"));
  document.getElementById("settingsBtn").addEventListener("click",()=>openHub("settings"));
  hubContent.addEventListener("click",e=>{
    const action=e.target.closest("[data-hub-action]")?.dataset.hubAction;
    const material=e.target.closest("[data-store-material]")?.dataset.storeMaterial;
    if(action==="resume") closeHub();
    if(action==="worlds") showHubTab("worlds");
    if(action==="load"){if(loadWorld())setStatus("Мир загружен");else setStatus("Сохранённого мира пока нет");closeHub();}
    if(action==="new"){if(confirm("Создать новый мир? Текущая постройка будет сброшена.")){blocks.splice(0).forEach(b=>b.dispose());addStarterBuild();localStorage.removeItem("miniSandboxWorld");setStatus("Новый мир создан");closeHub();}}
    if(material){selectMaterial(material);closeHub();}
  });

  document.getElementById("saveBtn").addEventListener("click", saveWorld);
  document.getElementById("resetBtn").addEventListener("click", () => {
    if (!confirm("Удалить постройки и вернуть начальный мир?")) return;
    blocks.splice(0).forEach(b => b.dispose());
    localStorage.removeItem("miniSandboxWorld");
    addStarterBuild(); setStatus("Мир сброшен");
  });
  if (!loadSharedWorldFromUrl() && loadWorld()) setStatus("Сохранённый мир загружен");

  let previousFrame = performance.now();
  engine.runRenderLoop(() => {
    const now = performance.now();
    const deltaSeconds = Math.min((now - previousFrame) / 1000, 0.05);
    previousFrame = now;
    verity.update(deltaSeconds);
    multiplayer.update(deltaSeconds);
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