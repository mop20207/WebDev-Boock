(() => {
"use strict";
const $=(s,r=document)=>r.querySelector(s),grid=$("#projectGrid"),detail=$("#projectDetail"),search=$("#projectSearch"),level=$("#projectLevel"),technology=$("#projectTechnology"),count=$("#projectResultCount");
let projects=[];
const names={principiante:"Principiante",intermedio:"Intermedio",avanzado:"Avanzado"};
const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function render(){
 const q=search.value.trim().toLocaleLowerCase("es");
 const shown=projects.filter(p=>(!level.value||p.level===level.value)&&(!technology.value||p.technologies.includes(technology.value))&&(!q||[p.title,p.description,...p.technologies].join(" ").toLocaleLowerCase("es").includes(q)));
 grid.replaceChildren();
 for(const p of shown){const card=document.createElement("article");card.className="project-card";card.innerHTML='<div class="project-card-top"><span class="project-level level-'+p.level+'">'+names[p.level]+'</span><span>'+p.minutes+' min aprox.</span></div><h2>'+escapeHTML(p.title)+'</h2><p>'+escapeHTML(p.description)+'</p><div class="project-tags">'+p.technologies.map(t=>'<span>'+escapeHTML(t)+'</span>').join("")+'</div><button class="project-open" data-project="'+escapeHTML(p.id)+'" type="button">Ver proyecto →</button>';grid.append(card);}
 count.textContent=shown.length+" de "+projects.length+" proyectos";
 if(!shown.length)grid.innerHTML='<p class="project-empty">No hay resultados. Probá otros filtros.</p>';
}
function openProject(id){
 const p=projects.find(x=>x.id===id);if(!p)return;
 grid.hidden=true;$(".project-controls").hidden=true;count.hidden=true;detail.hidden=false;
 detail.innerHTML='<button id="projectBack" type="button" class="project-back">← Volver a proyectos</button><div class="project-level level-'+p.level+'">'+names[p.level]+'</div><h2>'+escapeHTML(p.title)+'</h2><p>'+escapeHTML(p.description)+'</p><h3>Objetivos</h3><ul>'+p.goals.map(x=>'<li>'+escapeHTML(x)+'</li>').join("")+'</ul><h3>Tecnologías</h3><div class="project-tags">'+p.technologies.map(x=>'<span>'+escapeHTML(x)+'</span>').join("")+'</div><h3>Archivo de referencia</h3><pre><code>'+escapeHTML(p.files[0].code)+'</code></pre><h3>Construcción paso a paso</h3><ol>'+p.steps.map(x=>'<li>'+escapeHTML(x)+'</li>').join("")+'</ol><h3>Ampliaciones</h3><ul>'+p.extensions.map(x=>'<li>'+escapeHTML(x)+'</li>').join("")+'</ul>';
 detail.scrollIntoView({behavior:"smooth",block:"start"});
}
grid.addEventListener("click",e=>{const b=e.target.closest("[data-project]");if(b)openProject(b.dataset.project);});
detail.addEventListener("click",e=>{if(e.target.id==="projectBack"){detail.hidden=true;grid.hidden=false;$(".project-controls").hidden=false;count.hidden=false;}});
[search,level,technology].forEach(el=>el.addEventListener(el===search?"input":"change",render));
$("#clearProjectFilters").addEventListener("click",()=>{search.value="";level.value="";technology.value="";render();});
async function init(){try{const r=await fetch("../data/projects.json");if(!r.ok)throw Error("HTTP "+r.status);projects=(await r.json()).projects;[...new Set(projects.flatMap(p=>p.technologies))].sort().forEach(t=>{const o=document.createElement("option");o.value=t;o.textContent=t;technology.append(o);});$("#projectTotal").textContent=projects.length;render();}catch(e){count.textContent="No se pudo cargar la biblioteca: "+e.message;}}
init();
})();