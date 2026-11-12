const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
export function createMultiplayer({scene,camera,BABYLON,onBlockAdd,onBlockRemove,onWorldSync,onStatus}) {
  const toggle=document.getElementById("roomToggle"), panel=document.getElementById("roomPanel");
  const close=document.getElementById("roomClose"), join=document.getElementById("roomJoin");
  const roomInput=document.getElementById("roomName"), nameInput=document.getElementById("playerName");
  const status=document.getElementById("roomStatus"), list=document.getElementById("playerList");
  const chat=document.getElementById("roomChat"), chatForm=document.getElementById("roomChatForm"), chatInput=document.getElementById("roomChatInput");
  let socket=null, playerId=null, room="", lastSent=0, lastPosition=null;
  const remotes=new Map();
  const sayStatus=text=>{status.textContent=text;onStatus?.(text)};
  const send=data=>{if(socket?.readyState===WebSocket.OPEN)socket.send(JSON.stringify(data))};
  function addChat(name,message){const row=document.createElement("div");row.className="room-chat-line";const strong=document.createElement("b");strong.textContent=name+": ";row.append(strong,document.createTextNode(message));chat.appendChild(row);chat.scrollTop=chat.scrollHeight;while(chat.children.length>40)chat.firstChild.remove()}
  function makeRemote(p){if(!p?.playerId||p.playerId===playerId)return;removeRemote(p.playerId);const root=new BABYLON.TransformNode("remote_"+p.playerId,scene);const body=BABYLON.MeshBuilder.CreateCapsule("avatarBody",{height:1.35,radius:0.32},scene);body.parent=root;body.position.y=0.72;const head=BABYLON.MeshBuilder.CreateSphere("avatarHead",{diameter:0.48,segments:12},scene);head.parent=root;head.position.y=1.55;const mat=new BABYLON.StandardMaterial("remoteMat_"+p.playerId,scene);mat.diffuseColor=new BABYLON.Color3(0.28,0.72,0.95);body.material=mat;head.material=mat;root.position.set(Number(p.x)||0,Number(p.y)||2,Number(p.z)||0);remotes.set(p.playerId,{root,target:root.position.clone(),name:p.name||"Игрок"})}
  function removeRemote(id){const p=remotes.get(id);if(!p)return;p.root.getChildMeshes().forEach(m=>m.dispose());p.root.dispose();remotes.delete(id)}
  function receive(event){let d;try{d=JSON.parse(event.data)}catch{return}
    if(d.type==="room:welcome"){playerId=d.playerId;(d.players||[]).forEach(makeRemote);list.textContent="Игроков: "+(remotes.size+1);if(Array.isArray(d.blocks))onWorldSync?.(d.blocks);else send({type:"world:init",blocks:window.__miniSandboxGetBlocks?.()||[]});sayStatus("Подключено к комнате «"+room+"»")}
    if(d.type==="player:join"){makeRemote(d.player);list.textContent="Игроков: "+(remotes.size+1)}
    if(d.type==="player:move"){const p=remotes.get(d.playerId);if(p&&d.position)p.target.set(d.position.x,d.position.y,d.position.z)}
    if(d.type==="player:leave"){removeRemote(d.playerId);list.textContent="Игроков: "+(remotes.size+1)}
    if(d.type==="block:add")onBlockAdd?.(d.block);
    if(d.type==="block:remove")onBlockRemove?.(d.block);
    if(d.type==="chat")addChat(d.name||"Игрок",d.message||"");
    if(d.type==="room:full")sayStatus("Комната заполнена (лимит "+d.limit+")");
    if(d.type==="world:sync"&&Array.isArray(d.blocks))onWorldSync?.(d.blocks);
  }
  function connect(){disconnect();room=(roomInput.value.trim().toLowerCase().replace(/[^a-z0-9_-]/g,"").slice(0,24)||"main");roomInput.value=room;const name=(nameInput.value.trim().slice(0,18)||"Игрок");nameInput.value=name;
    const scheme=location.protocol==="https:"?"wss:":"ws:";socket=new WebSocket(scheme+"//"+location.host+"/api/room/"+encodeURIComponent(room)+"?name="+encodeURIComponent(name));
    sayStatus("Подключение…");socket.addEventListener("open",()=>{join.textContent="Отключиться";sayStatus("Соединение установлено")});socket.addEventListener("message",receive);socket.addEventListener("close",()=>{join.textContent="Подключиться";sayStatus("Отключено")});socket.addEventListener("error",()=>sayStatus("Ошибка соединения. Проверьте публикацию сервера."))}
  function disconnect(){if(socket){socket.close();socket=null}for(const id of [...remotes.keys()])removeRemote(id);playerId=null;list.textContent="Игроков: 0"}
  toggle.addEventListener("click",()=>panel.classList.toggle("open"));close.addEventListener("click",()=>panel.classList.remove("open"));
  join.addEventListener("click",()=>socket&&socket.readyState<2?disconnect():connect());
  chatForm.addEventListener("submit",e=>{e.preventDefault();const message=chatInput.value.trim();if(message){send({type:"chat",message});chatInput.value=""}});
  function update(dt){const now=performance.now();if(socket?.readyState===WebSocket.OPEN&&now-lastSent>100){const p=camera.position;if(!lastPosition||BABYLON.Vector3.DistanceSquared(p,lastPosition)>0.01){send({type:"player:move",position:{x:p.x,y:p.y,z:p.z}});lastPosition=p.clone()}lastSent=now}
    for(const p of remotes.values())p.root.position=BABYLON.Vector3.Lerp(p.root.position,p.target,Math.min(1,dt*10))}
  return {update,sendBlockAdd:block=>send({type:"block:add",block}),sendBlockRemove:block=>send({type:"block:remove",block}),disconnect};
}