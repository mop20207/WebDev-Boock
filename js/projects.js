(() => {
"use strict";
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const grid=$("#projectGrid"),detail=$("#projectDetail"),search=$("#projectSearch"),level=$("#projectLevel"),technology=$("#projectTechnology"),count=$("#projectResultCount");
const KEY="webdevbook.projects.v1",names={principiante:"Principiante",intermedio:"Intermedio",avanzado:"Avanzado"};
let projects=[],active=null,files=[],fileIndex=0,completed=readProgress();
function readProgress(){try{const v=JSON.parse(localStorage.getItem(KEY)||"[]");return new Set(Array.isArray(v)?v:[]);}catch{return new Set();}}
function saveProgress(){try{localStorage.setItem(KEY,JSON.stringify([...completed]));}catch{announce("No se pudo guardar el avance en este navegador.");}updateProgress();}
function announce(message){const status=$("#projectStatus");if(status)status.textContent=message;}
function updateProgress(){
 const n=projects.filter(p=>completed.has(p.id)).length;
 $("#projectProgressSummary").textContent=n+" de "+projects.length+" proyectos completados";
 $("#projectCompletedTotal").textContent=n;
 const btn=$("#projectComplete");if(btn&&active){const done=completed.has(active.id);btn.setAttribute("aria-pressed",String(done));btn.textContent=done?"✓ Proyecto completado":"Marcar proyecto como completado";}
}
function makeCard(p){
 const article=document.createElement("article");article.className="project-card";
 const top=document.createElement("div");top.className="project-card-top";
 const badge=document.createElement("span");badge.className="project-level level-"+p.level;badge.textContent=names[p.level];
 const mins=document.createElement("small");mins.textContent=p.minutes+" min aprox.";top.append(badge,mins);
 const title=document.createElement("h3");title.textContent=p.title;
 const desc=document.createElement("p");desc.textContent=p.description;
 const tags=document.createElement("div");tags.className="project-tags";p.technologies.forEach(t=>{const el=document.createElement("span");el.textContent=t;tags.append(el);});
 const footer=document.createElement("div");footer.className="project-card-footer";
 const status=document.createElement("small");status.textContent=completed.has(p.id)?"✓ Completado":p.files.length+" archivos";
 const btn=document.createElement("button");btn.type="button";btn.className="project-open";btn.dataset.project=p.id;btn.textContent="Abrir proyecto →";
 footer.append(status,btn);article.append(top,title,desc,tags,footer);return article;
}
function render(){
 const q=search.value.trim().toLocaleLowerCase("es"),lv=level.value,tech=technology.value;
 const visible=projects.filter(p=>(!lv||p.level===lv)&&(!tech||p.technologies.includes(tech))&&(!q||[p.title,p.description,...p.technologies,...p.goals].join(" ").toLocaleLowerCase("es").includes(q)));
 grid.replaceChildren();
 ["principiante","intermedio","avanzado"].forEach(group=>{
  const items=visible.filter(p=>p.level===group);if(!items.length)return;
  const heading=document.createElement("div");heading.className="project-level-heading";
  const h=document.createElement("h2");h.textContent=names[group];const small=document.createElement("span");small.textContent=items.length+" proyectos";heading.append(h,small);
  const cards=document.createElement("div");cards.className="project-grid";items.forEach(p=>cards.append(makeCard(p)));grid.append(heading,cards);
 });
 count.textContent=visible.length+" de "+projects.length+" proyectos";
 if(!visible.length){const p=document.createElement("p");p.className="project-empty";p.textContent="No hay proyectos con esos filtros.";grid.append(p);}
 updateProgress();
}
function listBlock(title,items,ordered=false){
 const section=document.createElement("section");section.className="project-info-block";
 const h=document.createElement("h3");h.textContent=title;const list=document.createElement(ordered?"ol":"ul");
 (items||[]).forEach(value=>{const li=document.createElement("li");li.textContent=value;list.append(li);});section.append(h,list);return section;
}
async function openProject(id){
 const p=projects.find(x=>x.id===id);if(!p)return;active=p;files=[];fileIndex=0;
 grid.hidden=true;$(".project-controls").hidden=true;count.hidden=true;detail.hidden=false;detail.replaceChildren();
 const loading=document.createElement("p");loading.textContent="Cargando archivos del proyecto…";detail.append(loading);detail.scrollIntoView({behavior:"smooth",block:"start"});
 try{
  files=await Promise.all(p.files.map(async f=>{const response=await fetch("../"+f.path);if(!response.ok)throw Error("No se pudo cargar "+f.path+" (HTTP "+response.status+").");return {...f,code:await response.text()};}));
  if(active?.id===id)renderDetail();
 }catch(error){detail.replaceChildren();const back=document.createElement("button");back.className="project-back";back.textContent="← Volver";back.addEventListener("click",showCatalog);const msg=document.createElement("p");msg.className="project-empty";msg.textContent=error.message;detail.append(back,msg);}
}
function renderDetail(){
 const p=active;detail.replaceChildren();
 const top=document.createElement("div");top.className="project-detail-top";
 const back=document.createElement("button");back.type="button";back.className="project-back";back.textContent="← Volver a proyectos";back.addEventListener("click",showCatalog);
 const badge=document.createElement("span");badge.className="project-level level-"+p.level;badge.textContent=names[p.level];top.append(back,badge);
 const title=document.createElement("h2");title.textContent=p.title;
 const intro=document.createElement("p");intro.className="project-detail-intro";intro.textContent=p.description;
 const tags=document.createElement("div");tags.className="project-tags";p.technologies.forEach(t=>{const span=document.createElement("span");span.textContent=t;tags.append(span);});
 const info=document.createElement("div");info.className="project-detail-grid";
 const goals=listBlock("Objetivos de aprendizaje",p.goals);
 const structure=document.createElement("section");structure.className="project-info-block";
 const sh=document.createElement("h3");sh.textContent="Estructura de archivos";const list=document.createElement("div");list.className="project-structure";
 p.files.forEach(f=>{const row=document.createElement("div");row.className="project-structure-item";const path=document.createElement("code");path.textContent=f.path.replace("projects/"+p.id+"/","");const desc=document.createElement("span");desc.textContent=f.description;row.append(path,desc);list.append(row);});
 structure.append(sh,list);info.append(goals,structure);
 const fileArea=document.createElement("section");fileArea.className="project-file-area";
 const fileTitle=document.createElement("h3");fileTitle.className="project-section-title";fileTitle.textContent="Código fuente comentado";
 const tabs=document.createElement("div");tabs.className="project-file-tabs";tabs.setAttribute("role","group");tabs.setAttribute("aria-label","Archivos del proyecto");
 files.forEach((f,i)=>{const b=document.createElement("button");b.type="button";b.className="project-file-tab";b.textContent=f.path.split("/").pop();b.setAttribute("aria-pressed",String(i===fileIndex));b.addEventListener("click",()=>{fileIndex=i;renderFilePanel();});tabs.append(b);});
 const panel=document.createElement("div");panel.id="projectFilePanel";fileArea.append(fileTitle,tabs,panel);
 const preview=document.createElement("section");preview.className="project-preview-wrap";
 if(p.preview){const h=document.createElement("h3");h.className="project-section-title";h.textContent="Vista previa interactiva";const btn=document.createElement("button");btn.type="button";btn.className="project-open";btn.textContent="▶ Ejecutar vista previa";btn.addEventListener("click",renderPreview);const note=document.createElement("p");note.className="project-preview-note";note.textContent="Se ejecuta en un iframe con sandbox. Los datos de prueba permanecen separados de WebDev Book.";preview.append(h,btn,note);}
 else{const note=document.createElement("p");note.className="project-preview-note";note.textContent="Este proyecto requiere Node.js y/o una base de datos. Consultá, copiá o descargá los archivos y ejecutalo en tu entorno local.";preview.append(note);}
 const sections=document.createElement("div");sections.className="project-detail-sections";sections.append(listBlock("Construcción paso a paso",p.steps,true),listBlock("Ampliaciones propuestas",p.extensions,true));
 const checks=listBlock("Criterios de comprobación",p.checks||[]);
 const progress=document.createElement("div");progress.className="project-progress-panel";
 const note=document.createElement("p");note.textContent=(p.notes||[]).join(" ");
 const complete=document.createElement("button");complete.type="button";complete.id="projectComplete";complete.className="project-complete";complete.addEventListener("click",()=>{if(completed.has(p.id))completed.delete(p.id);else completed.add(p.id);saveProgress();render();});
 progress.append(note,complete);
 detail.append(top,title,intro,tags,info,fileArea,preview,sections,checks,progress);renderFilePanel();updateProgress();
}
function renderFilePanel(){
 const panel=$("#projectFilePanel"),file=files[fileIndex];if(!panel||!file)return;panel.replaceChildren();
 const shell=document.createElement("div");shell.className="project-code-shell";
 const toolbar=document.createElement("div");toolbar.className="project-code-toolbar";
 const name=document.createElement("span");name.textContent=file.path;
 const actions=document.createElement("div");actions.className="project-code-actions";
 const copy=document.createElement("button");copy.type="button";copy.textContent="Copiar";
 copy.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(file.code);copy.textContent="Copiado";}catch{copy.textContent="Copiado no disponible";}});
 const download=document.createElement("button");download.type="button";download.textContent="Descargar";
 download.addEventListener("click",()=>{const url=URL.createObjectURL(new Blob([file.code],{type:"text/plain;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download=file.path.split("/").pop();a.click();URL.revokeObjectURL(url);});
 actions.append(copy,download);toolbar.append(name,actions);
 const pre=document.createElement("pre");pre.className="project-code-view";const code=document.createElement("code");code.textContent=file.code;pre.append(code);shell.append(toolbar,pre);panel.append(shell);
 $$(".project-file-tab").forEach((button,i)=>button.setAttribute("aria-pressed",String(i===fileIndex)));
}
function renderPreview(){
 const html=files.find(f=>f.path.endsWith("/index.html"))?.code,css=files.find(f=>f.path.endsWith("/styles.css"))?.code||"",js=files.find(f=>f.path.endsWith("/app.js"))?.code||"";
 if(!html)return;
 const safeJs=js.replace(/<\/script/gi,"<\\/script");
 const source=html.replace(/<link[^>]+href=["']styles\.css["'][^>]*>/i,"<style>"+css+"</style>").replace(/<script[^>]+src=["']app\.js["'][^>]*><\/script>/i,"<script>"+safeJs+"</script>");
 let frame=$("#projectPreviewFrame");if(!frame){frame=document.createElement("iframe");frame.id="projectPreviewFrame";frame.className="project-preview-frame";frame.title="Vista previa del proyecto";frame.setAttribute("sandbox","allow-scripts");$(".project-preview-wrap").append(frame);}frame.srcdoc=source;
}
function showCatalog(){active=null;files=[];detail.hidden=true;grid.hidden=false;$(".project-controls").hidden=false;count.hidden=false;render();grid.scrollIntoView({behavior:"smooth",block:"start"});}
search.addEventListener("input",render);level.addEventListener("change",render);technology.addEventListener("change",render);
$("#clearProjectFilters").addEventListener("click",()=>{search.value="";level.value="";technology.value="";render();});
grid.addEventListener("click",event=>{const button=event.target.closest("[data-project]");if(button)openProject(button.dataset.project);});
async function init(){try{const response=await fetch("../data/projects.json",{cache:"no-store"});if(!response.ok)throw Error("No se pudo cargar el catálogo (HTTP "+response.status+").");const data=await response.json();projects=Array.isArray(data.projects)?data.projects:[];if(!projects.length)throw Error("No hay proyectos publicados.");[...new Set(projects.flatMap(p=>p.technologies))].sort().forEach(tech=>{const option=document.createElement("option");option.value=tech;option.textContent=tech;technology.append(option);});$("#projectTotal").textContent=projects.length;render();}catch(error){count.textContent=error.message||"Error al cargar los proyectos.";}}
init();
})();