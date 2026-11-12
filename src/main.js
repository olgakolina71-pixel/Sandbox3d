import { createVerity } from "./verity.js";
import { createMultiplayer } from "./multiplayer.js";

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
  let multiplayer = null;
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
    if (!occupied) { makeBlock(x, y, z, selectedMaterial); multiplayer.sendBlockAdd({x,y,z,material:selectedMaterial}); setStatus("Блок установлен: " + selectedMaterial); }
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