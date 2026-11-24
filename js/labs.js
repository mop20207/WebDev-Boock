(() => {
  "use strict";
  const $ = selector => document.querySelector(selector);
  const grid = $("#labsGrid");
  const toast = message => {
    const el = $("#labsToast");
    el.textContent = message;
    el.classList.add("is-visible");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove("is-visible"), 2800);
  };
  const bytes = value => value < 1024 * 1024
    ? (value / 1024).toFixed(0) + " KiB"
    : (value / (1024 * 1024)).toFixed(2) + " MiB";

  const fallback = [
    ["lab-frontend","Frontend","HTML, CSS, JavaScript, TypeScript, React, Vue y Web Components.","Prácticas visuales y de componentes."],
    ["lab-backend","Backend","Node.js, Astro, APIs, Testing y Docker.","Simuladores y validadores educativos."],
    ["lab-databases","Bases de datos","SQL/PostgreSQL y MongoDB.","PGlite y simulación documental en memoria."],
    ["lab-terminal","Terminal","Comandos y administración de archivos.","Terminal virtual segura y aislada."],
    ["lab-games","Lógica de videojuegos","Movimiento, colisiones, puntuación y oleadas.","Ejercicios deterministas de juegos 2D."]
  ];
  let manifest;

  function make(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  async function renderCard(entry,index) {
    const status = await window.WebDevLabs.getPackageStatus(entry.id);
    const installed = Boolean(status.installed);
    const upToDate = status.state === "installed";
    const title = fallback.find(x=>x[0]===entry.id)?.[1] || entry.title;
    const card=make("article","lab-card");
    const top=make("div","lab-card-top");
    top.append(make("span","lab-card-index","LABORATORIO 0"+(index+1)));
    top.append(make("span","lab-card-state"+(upToDate?" is-installed":""),upToDate?"INSTALADO":status.state==="update"?"ACTUALIZACIÓN DISPONIBLE":installed?"COPIA LOCAL":"DESCARGABLE"));
    const heading=make("h3","",title);
    const description=make("p","",entry.description);
    const meta=make("div","lab-card-meta");
    meta.append(make("span","",bytes(entry.sizeBytes)));
    meta.append(make("span","",entry.challengeCount+" ejercicios"));
    meta.append(make("span","",entry.technologyCount+" tecnologías"));
    const runners=make("p","lab-runner-list","Motores: "+entry.runnerTypes.join(" · "));
    const progress=make("div","lab-progress");
    progress.hidden=true;
    const fill=make("i");
    progress.append(fill);
    const actions=make("div","lab-card-actions");

    if(installed){
      const open=make("a","primary","Abrir laboratorio →");
      open.href="challenges.html?lab="+encodeURIComponent(entry.id);
      actions.append(open);
    }
    if(!upToDate){
      const install=make("button","primary",status.state==="update"?"Actualizar":"Descargar");
      install.type="button";
      install.addEventListener("click",async()=>{
        install.disabled=true;progress.hidden=false;fill.style.width="0%";
        try{
          await window.WebDevLabs.downloadLab(entry.id,{onProgress(p){
            fill.style.width=p.percent+"%";
            install.textContent=p.total>0?"Descargando "+p.percent+"%":"Descargando…";
          }});
          toast(title+" quedó instalado y disponible sin conexión.");
          await refresh();
        }catch(error){
          install.disabled=false;install.textContent=status.state==="update"?"Actualizar":"Reintentar";
          progress.hidden=true;toast(error?.message||"No se pudo instalar el laboratorio.");
        }
      });
      actions.append(install);
    }
    if(installed){
      const remove=make("button","remove","Quitar");
      remove.type="button";
      remove.addEventListener("click",async()=>{
        if(!confirm("¿Quitar "+title+" del almacenamiento local? Tu progreso, favoritos y proyectos no se borrarán."))return;
        remove.disabled=true;
        try{
          await window.WebDevLabs.removeLab(entry.id);
          toast(title+" se quitó del dispositivo.");
          await refresh();
        }catch(error){remove.disabled=false;toast(error?.message||"No se pudo quitar el laboratorio.");}
      });
      actions.append(remove);
    }

    card.append(top,heading,description,meta,runners,progress,actions);
    return card;
  }

  async function refresh(){
    const button=$("#labsRefresh");
    button.disabled=true;
    button.textContent="Consultando…";
    try{
      manifest=await window.WebDevLabs.getManifest();
      const cards=await Promise.all(manifest.packages.map((entry,index)=>renderCard(entry,index)));
      grid.replaceChildren(...cards);
      $("#labsManifestVersion").textContent="Manifiesto "+manifest.manifestVersion.slice(0,12);
      $("#labsGlobalStatus").textContent="Paquetes verificados y listos para administrar.";
      $("#labsChallenges").textContent=manifest.packages.reduce((sum,item)=>sum+item.challengeCount,0);
      const installed=await window.WebDevLabs.listInstalled();
      $("#labsInstalled").textContent=installed.length;
      $("#labsTotal").textContent=manifest.packages.length;
      $("#labsEmpty").hidden=cards.length>0;
    }catch(error){
      grid.replaceChildren(make("p","labs-loading",error?.message||"No se pudo cargar el manifiesto."));
      $("#labsGlobalStatus").textContent="No se pudo consultar el catálogo.";
      toast("No se pudo consultar los laboratorios. Las copias locales instaladas se conservan.");
    }finally{
      button.disabled=false;
      button.textContent="↻ Comprobar";
    }
  }

  document.addEventListener("DOMContentLoaded",()=>{
    $("#labsRefresh").addEventListener("click",refresh);
    window.addEventListener("webdev:labs-changed",refresh);
    refresh();
  },{once:true});
})();