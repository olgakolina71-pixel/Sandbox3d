const STARTER_SCRIPT = `# MiniScript — первый сценарий
# block x y z material
block 0 1 0 neon
block 2 1 0 stone
block -2 1 0 wood
say Привет из MiniScript!`;
export function initNextGen({setStatus}) {
  const game=document.getElementById("game");
  const top=document.querySelector(".topbar");
  if(!game||!top)return;
  const switcher=document.createElement("nav");
  switcher.className="nextgen-switch";
  switcher.setAttribute("aria-label","Режим приложения");
  switcher.innerHTML='<button type="button" data-mode="game">▶ ИГРА</button><button type="button" data-mode="studio" class="active">▣ СТУДИЯ</button>';
  top.insertAdjacentElement("afterend",switcher);
  const studio=document.createElement("section");
  studio.className="nextgen-studio";
  studio.innerHTML='<h3>MiniScript Studio</h3><p>Пиши команды, чтобы создавать объекты в своём мире. Координаты — целые числа от -80 до 80.</p><textarea spellcheck="false" aria-label="Код MiniScript"></textarea><button type="button" data-run>▶ Запустить сценарий</button><output class="nextgen-output" aria-live="polite">Готово к запуску.</output>';
  game.appendChild(studio);
  const editor=studio.querySelector("textarea"), output=studio.querySelector("output");
  editor.value=STARTER_SCRIPT;
  function setMode(mode){
    const isStudio=mode==="studio";
    game.dataset.appMode=isStudio?"studio":"game";
    switcher.querySelectorAll("button").forEach(b=>b.classList.toggle("active",b.dataset.mode===mode));
    studio.classList.toggle("open",isStudio);
    setStatus(isStudio?"Режим студии — создавай свой мир":"Режим игры — исследуй мир");
  }
  switcher.addEventListener("click",e=>{const b=e.target.closest("[data-mode]");if(b)setMode(b.dataset.mode);});
  studio.querySelector("[data-run]").addEventListener("click",()=>{
    const lines=editor.value.split(/\r?\n/), logs=[];let created=0;
    for(let i=0;i<lines.length;i++){
      const line=lines[i].trim();if(!line||line.startsWith("#"))continue;
      const [command,...args]=line.split(/\s+/);
      if(command==="block"){
        if(args.length!==4){logs.push("Строка "+(i+1)+": block x y z material");continue;}
        const [x,y,z]=args.slice(0,3).map(Number), material=args[3];
        if(![x,y,z].every(Number.isInteger)||!["grass","stone","wood","sand","brick","neon"].includes(material)){logs.push("Строка "+(i+1)+": неверные координаты или материал");continue;}
        if(window.__miniSandboxAddBlock?.(x,y,z,material))created++;else logs.push("Строка "+(i+1)+": место занято или координаты вне мира");
      }else if(command==="clear"){
        window.__miniSandboxClearBlocks?.();logs.push("Локальные блоки очищены");
      }else if(command==="say"){
        logs.push(args.join(" ").slice(0,160));
      }else{
        logs.push("Строка "+(i+1)+": неизвестная команда "+command);
      }
    }
    output.textContent="Создано блоков: "+created+(logs.length?"\n"+logs.join("\n"):"");
    setStatus("MiniScript выполнен — блоков: "+created);
  });
  setMode("studio");
}
