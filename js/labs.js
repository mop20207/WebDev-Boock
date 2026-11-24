(() => {
"use strict";
const $=id=>document.getElementById(id);
let labs=[],filter="all",query="",statuses=new Map();
function toast(message){const el=$("labsToast");el.textContent=message;el.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove("show"),3000);}
function fmt(bytes){if(!Number.isFinite(bytes))return "—";return bytes<1024*1024?(bytes/1024).toFixed(1)+" KiB":(bytes/1048576).toFixed(2)+" MiB";}
function render(){
 const grid=$("labGrid"),q=query.trim().toLocaleLowerCase("es");
 const shown=labs.filter(l=>{const st=statuses.get(l.id)||{};const installed=["installed","update","corrupt"].includes(st.state);const match=filter==="all"||(filter==="installed"&&installed)||(filter==="available"&&!installed);return match&&(!q||[l.title,l.subtitle,l.description,...l.technologies].join(" ").toLocaleLowerCase("es").includes(q));});
 grid.replaceChildren();
 if(!shown.length){const p=document.createElement("p");p.className="labs-empty";p.textContent="No hay laboratorios que coincidan con el filtro.";grid.append(p);}
 for(const lab of shown){
  const st=statuses.get(lab.id)||{},entry=st.entry,installed=["installed","update","corrupt"].includes(st.state);
  const card=document.createElement("article");card.className="lab-card";card.style.setProperty("--lab-accent",lab.accent||"#78a3ef");
  const head=document.createElement("div");head.className="lab-card-head";
  const icon=document.createElement("span");icon.className="lab-icon";icon.textContent=lab.icon||"⚗";
  const state=document.createElement("span");state.className="lab-state"+(installed?" installed":"");state.textContent=st.state==="installed"?"INSTALADO":st.state==="update"?"ACTUALIZACIÓN":st.state==="corrupt"?"REPARAR":"NO INSTALADO";head.append(icon,state);
  const title=document.createElement("h3");title.textContent=lab.title;
  const subtitle=document.createElement("div");subtitle.className="lab-subtitle";subtitle.textContent=lab.subtitle||"PRÁCTICA GUIADA";
  const desc=document.createElement("p");desc.textContent=lab.description;
  const tech=document.createElement("div");tech.className="lab-techs";(lab.technologies||[]).forEach(t=>{const tag=document.createElement("span");tag.textContent=t;tech.append(tag);});
  const meta=document.createElement("div");meta.className="lab-meta";
  const count=document.createElement("span");count.textContent=(lab.challengeCount||entry?.challengeCount||0)+" retos";
  const size=document.createElement("span");size.textContent=entry?fmt(entry.sizeBytes):"Paquete descargable";meta.append(count,size);
  const progress=document.createElement("div");progress.className="lab-progress";const fill=document.createElement("i");progress.append(fill);
  const actions=document.createElement("div");actions.className="lab-actions";
  if(installed && st.state!=="corrupt"){
   const open=document.createElement("a");open.className="lab-open";open.href="challenges.html?lab="+encodeURIComponent(lab.id);open.textContent="Abrir laboratorio →";actions.append(open);
  }
  if(!installed || st.state==="update" || st.state==="corrupt"){
   const install=document.createElement("button");install.className="lab-primary";install.type="button";install.textContent=st.state==="update"?"↻ Actualizar":st.state==="corrupt"?"Reparar paquete":"↓ Descargar laboratorio";install.addEventListener("click",async()=>{install.disabled=true;install.textContent="Descargando…";try{await WebDevLabs.download(lab.id,{onProgress:p=>{fill.style.width=p.percent+"%";}});await refreshOne(lab.id);toast(lab.title+" quedó instalado y verificado.");}catch(e){toast(e.message||"No se pudo instalar el laboratorio.");}finally{install.disabled=false;install.textContent="↓ Descargar laboratorio";fill.style.width="0";}});actions.append(install);
  }
  if(installed){
   const remove=document.createElement("button");remove.className="lab-danger";remove.type="button";remove.textContent="Quitar";remove.addEventListener("click",async()=>{if(!confirm("¿Quitar "+lab.title+" del dispositivo? El progreso de los retos se conservará."))return;remove.disabled=true;try{await WebDevLabs.remove(lab.id);await refreshOne(lab.id);toast("Laboratorio quitado. Tu progreso sigue guardado.");}catch(e){toast(e.message);}finally{remove.disabled=false;}});actions.append(remove);
  }
  card.append(head,title,subtitle,desc,tech,meta,progress,actions);grid.append(card);
 }
 $("installedLabs").textContent=String([...statuses.values()].filter(s=>["installed","update","corrupt"].includes(s.state)).length);
}
async function refreshOne(id){statuses.set(id,await WebDevLabs.getStatus(id));render();}
async function init(){
 try{const [catalog,manifest]=await Promise.all([WebDevLabs.getCatalog(),WebDevLabs.getManifest()]);labs=catalog.labs;$("totalLabs").textContent=labs.length;$("totalChallenges").textContent=String(manifest.packages.reduce((n,p)=>n+p.challengeCount,0));await Promise.all(labs.map(async l=>statuses.set(l.id,await WebDevLabs.getStatus(l.id))));render();}
 catch(e){$("labGrid").textContent=e.message||"No se pudo cargar el catálogo de laboratorios.";}
}
document.querySelectorAll("[data-lab-filter]").forEach(btn=>btn.addEventListener("click",()=>{filter=btn.dataset.labFilter;document.querySelectorAll("[data-lab-filter]").forEach(b=>{const active=b===btn;b.classList.toggle("is-active",active);b.setAttribute("aria-pressed",String(active));});render();}));
$("labSearch").addEventListener("input",e=>{query=e.target.value||"";render();});
window.addEventListener("webdev:labs-changed",e=>refreshOne(e.detail.id));
document.addEventListener("DOMContentLoaded",init,{once:true});
})();