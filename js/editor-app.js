(()=>{"use strict";
const $=id=>document.getElementById(id),KEY="webdev-editor-project-v1";
const starter={
 "index.html":`<!doctype html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mi proyecto</title></head>
<body>
  <main class="card">
    <span class="tag">MI PRIMER PROYECTO</span>
    <h1>¡Hola, mundo!</h1>
    <p>Estoy creando mi primera página con WebDev Book.</p>
    <button id="saludar">Haz clic aquí</button>
    <p id="mensaje"></p>
  </main>
</body>
</html>`,
 "style.css":`* { box-sizing: border-box; }
body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #101827;
  color: #edf3ff;
  font-family: Arial, sans-serif;
}
.card { text-align: center; padding: 40px; }
h1 { color: #82a5ff; font-size: 42px; }
.tag { color: #70d6ad; font-size: 11px; letter-spacing: 2px; }
button {
  border: 0; border-radius: 8px; padding: 12px 18px;
  background: #5279e8; color: white; cursor: pointer;
}`,
 "script.js":`document.querySelector("#saludar").addEventListener("click", () => {
  document.querySelector("#mensaje").textContent = "¡Tu JavaScript está funcionando!";
  console.log("Botón presionado correctamente");
});`,
 "datos.json":`{
  "proyecto": "Mi primera página",
  "lenguajes": ["HTML", "CSS", "JavaScript"]
}`
};
let files={},folders=new Set(),collapsed=new Set(),active="",editor=null,models={},timer=null,localDB=null,saveTimer=null,storageMode="indexeddb",projectId="main",projectName="Mi proyecto",projectCatalog=[],settings={fontSize:13,theme:"dark",wrap:"on",keys:true},dialogMode="",dialogTarget="",modifierCtrl=false,modifierAlt=false;
const langFor=name=>({html:"html",htm:"html",css:"css",js:"javascript",mjs:"javascript",json:"json",svg:"xml",xml:"xml",md:"markdown",txt:"plaintext"}[name.split(".").pop().toLowerCase()]||"plaintext");
const iconFor=name=>({html:"5",htm:"5",css:"#",js:"JS",mjs:"JS",json:"{}",svg:"◇"}[name.split(".").pop().toLowerCase()]||"·");
const escapeHtml=s=>s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function toast(msg){$("toast").textContent=msg;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),2100)}
function openLocalDB(){
 return new Promise((resolve,reject)=>{
  if(!("indexedDB" in window))return reject(new Error("IndexedDB no disponible"));
  const request=indexedDB.open("WebDevBookEditor",1);
  request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains("projects"))db.createObjectStore("projects");};
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error||new Error("No se pudo abrir la base local"));
  request.onblocked=()=>reject(new Error("La base local está bloqueada"));
 });
}
function readLocalProject(db,id){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction("projects","readonly"),req=tx.objectStore("projects").get(id);
  req.onsuccess=()=>resolve(req.result||null);
  req.onerror=()=>reject(req.error);
 });
}
function listLocalProjects(db){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction("projects","readonly"),req=tx.objectStore("projects").getAllKeys();
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(req.error);
 });
}
function writeLocalProject(db,id,snapshot){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction("projects","readwrite");
  tx.objectStore("projects").put(snapshot,id);
  tx.oncomplete=()=>resolve();
  tx.onerror=()=>reject(tx.error||new Error("No se pudo guardar"));
  tx.onabort=()=>reject(tx.error||new Error("Guardado cancelado"));
 });
}
function deleteLocalProject(db,id){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction("projects","readwrite");
  tx.objectStore("projects").delete(id);
  tx.oncomplete=resolve;
  tx.onerror=()=>reject(tx.error);
 });
}
function readFallback(id){
 try{return JSON.parse(localStorage.getItem("webdev-project-"+id)||(id==="main"?localStorage.getItem(KEY):"null"));}catch(e){return null;}
}
function updateCatalog(){
 try{localStorage.setItem("webdev-project-catalog",JSON.stringify(projectCatalog));localStorage.setItem("webdev-project-active",projectId);}catch(e){}
}
async function loadLocalFiles(){
 try{localDB=await openLocalDB();storageMode="indexeddb";}catch(e){storageMode="localstorage";}
 try{projectCatalog=JSON.parse(localStorage.getItem("webdev-project-catalog")||"[]");if(!Array.isArray(projectCatalog))projectCatalog=[];}catch(e){projectCatalog=[];}
 if(localDB){
  const ids=await listLocalProjects(localDB);
  for(const id of ids){if(!projectCatalog.some(p=>p.id===id)){const record=await readLocalProject(localDB,id);projectCatalog.push({id,name:record?.name||"Mi proyecto"});}}
 }
 if(!projectCatalog.length)projectCatalog=[{id:"main",name:"Mi proyecto"}];
 const preferred=localStorage.getItem("webdev-project-active")||"main";
 projectId=projectCatalog.some(p=>p.id===preferred)?preferred:projectCatalog[0].id;
 let record=localDB?await readLocalProject(localDB,projectId):readFallback(projectId);
 if(!record&&projectId==="main"){
  const legacy=readFallback("main");
  if(legacy)record=legacy.files?legacy:{files:legacy,name:"Mi proyecto",folders:[]};
 }
 if(!record)record={name:projectCatalog.find(p=>p.id===projectId)?.name||"Mi proyecto",files:{...starter},folders:[]};
 files=record.files&&typeof record.files==="object"?record.files:{...starter};
 folders=new Set(Array.isArray(record.folders)?record.folders:[]);
 projectName=record.name||projectCatalog.find(p=>p.id===projectId)?.name||"Mi proyecto";
 if(!Object.keys(files).length)files={"index.html":starter["index.html"]};
 $("projectName").textContent=projectName;
 $("saveStatus").textContent="Almacenamiento local";
 updateCatalog();
}
async function saveNow(){
 clearTimeout(saveTimer);
 const id=projectId,snapshot={name:projectName,files:{...files},folders:[...folders],updatedAt:Date.now()};
 try{
  if(localDB&&storageMode==="indexeddb")await writeLocalProject(localDB,id,snapshot);
  else localStorage.setItem("webdev-project-"+id,JSON.stringify(snapshot));
  $("saveStatus").textContent="Guardado local";
 }catch(error){
  try{localStorage.setItem("webdev-project-"+id,JSON.stringify(snapshot));storageMode="localstorage";$("saveStatus").textContent="Guardado en navegador";}catch(e){$("saveStatus").textContent="Error al guardar";toast("No se pudo guardar. Exportá una copia ZIP.");}
 }
 updateCatalog();
}
function save(){
 $("saveStatus").textContent="Guardando…";
 clearTimeout(saveTimer);
 saveTimer=setTimeout(saveNow,350);
}
async function switchProject(id){
 if(!projectCatalog.some(p=>p.id===id))return;
 await saveNow();
 projectId=id;
 let record=localDB?await readLocalProject(localDB,id):readFallback(id);
 if(!record)record={name:projectCatalog.find(p=>p.id===id).name,files:{...starter},folders:[]};
 files=record.files||{...starter};folders=new Set(record.folders||[]);collapsed.clear();
 projectName=record.name||"Mi proyecto";active="";
 Object.values(models).forEach(m=>m.dispose());models={};
 $("projectName").textContent=projectName;updateCatalog();
 if(editor){const first=files["index.html"]!==undefined?"index.html":Object.keys(files)[0];if(first)openFile(first);else{editor.setModel(null);renderTree();renderTabs();}}
 updatePreview();closeProjectsDialog();toast("Proyecto: "+projectName);
}
function modelFor(name){if(!models[name])models[name]=monaco.editor.createModel(files[name],langFor(name),monaco.Uri.parse("file:///"+name));return models[name];}
const basename=path=>path.split("/").pop();
const parentPath=path=>path.includes("/")?path.slice(0,path.lastIndexOf("/")):"";
const cleanName=name=>/^[a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ .-]+$/.test(name)&&name.trim()===name&&name!=="."&&name!==".."&&!name.includes("/")&&!name.includes("\\");
function allFolders(){
 const result=new Set(folders);
 Object.keys(files).forEach(path=>{let parent=parentPath(path);while(parent){result.add(parent);parent=parentPath(parent);}});
 for(const path of [...result]){let parent=parentPath(path);while(parent){result.add(parent);parent=parentPath(parent);}}
 return [...result].sort((a,b)=>a.localeCompare(b));
}
function folderSelect(select,exclude=""){
 select.innerHTML="";
 const root=document.createElement("option");root.value="";root.textContent="Raíz del proyecto";select.appendChild(root);
 allFolders().forEach(path=>{if(exclude&&(path===exclude||path.startsWith(exclude+"/")))return;const o=document.createElement("option");o.value=path;o.textContent="📁 "+path;select.appendChild(o);});
}
function renderTree(){
 const root=$("fileTree");root.innerHTML="";
 const dirs=allFolders(),paths=Object.keys(files);
 const add=(parent,depth)=>{
  const children=dirs.filter(p=>parentPath(p)===parent).sort((a,b)=>a.localeCompare(b));
  for(const path of children){
   const row=document.createElement("div");row.className="file-row folder-row";row.style.paddingLeft=(8+depth*15)+"px";row.dataset.path=path;
   row.innerHTML='<span class="folder-caret">'+(collapsed.has(path)?"▸":"▾")+'</span><span class="file-icon">📁</span><span class="file-label">'+escapeHtml(basename(path))+'</span><button class="file-menu" aria-label="Opciones de carpeta">···</button>';
   row.addEventListener("click",()=>{if(collapsed.has(path))collapsed.delete(path);else collapsed.add(path);renderTree();});
   row.querySelector("button").addEventListener("click",e=>{e.stopPropagation();fileOptions(path,true);});
   row.addEventListener("dragover",e=>{e.preventDefault();row.classList.add("drag-over");});
   row.addEventListener("dragleave",()=>row.classList.remove("drag-over"));
   row.addEventListener("drop",e=>{e.preventDefault();e.stopPropagation();row.classList.remove("drag-over");const source=e.dataTransfer.getData("text/plain");if(source)moveEntry(source,path);});
   root.appendChild(row);
   if(!collapsed.has(path))add(path,depth+1);
  }
  paths.filter(p=>parentPath(p)===parent).sort((a,b)=>a.localeCompare(b)).forEach(path=>{
   const row=document.createElement("div");row.className="file-row"+(path===active?" active":"");row.style.paddingLeft=(8+depth*15)+"px";row.draggable=true;
   const ext=basename(path).split(".").pop().toLowerCase();
   row.innerHTML='<span class="folder-caret"></span><span class="file-icon '+escapeHtml(ext)+'">'+iconFor(path)+'</span><span class="file-label">'+escapeHtml(basename(path))+'</span><button class="file-menu" aria-label="Opciones de archivo">···</button>';
   row.addEventListener("click",()=>{openFile(path);$("workbench").classList.remove("explorer-open");});
   row.querySelector("button").addEventListener("click",e=>{e.stopPropagation();fileOptions(path,false);});
   row.addEventListener("dragstart",e=>{e.dataTransfer.setData("text/plain",path);row.classList.add("file-dragging");});
   row.addEventListener("dragend",()=>row.classList.remove("file-dragging"));
   root.appendChild(row);
  });
 };
 add("",0);
 if(!root.children.length){const empty=document.createElement("div");empty.className="file-row empty-state";empty.textContent="Proyecto vacío. Creá un archivo.";root.appendChild(empty);}
}
function renderTabs(){
 const tabs=$("editorTabs");tabs.innerHTML="";
 Object.keys(models).forEach(name=>{if(files[name]===undefined)return;const b=document.createElement("button");b.className="editor-tab"+(name===active?" active":"");b.textContent=basename(name);b.title=name;b.addEventListener("click",()=>openFile(name));tabs.appendChild(b);});
}
function openFile(name){
 if(files[name]===undefined||!editor)return;
 active=name;editor.setModel(modelFor(name));$("activeFileLabel").textContent=name;$("languageStatus").textContent=langFor(name).toUpperCase();
 renderTree();renderTabs();editor.focus();
}
function replacePath(oldPath,newPath,isFolder){
 if(oldPath===newPath)return true;
 if(!newPath||newPath===oldPath||newPath.startsWith(oldPath+"/")){toast("Destino no válido");return false;}
 const affected=Object.keys(files).filter(p=>p===oldPath||isFolder&&p.startsWith(oldPath+"/"));
 if(!isFolder&&files[oldPath]===undefined)return false;
 if(isFolder&&(!allFolders().includes(oldPath)))return false;
 const mappings=affected.map(p=>[p,newPath+p.slice(oldPath.length)]);
 if(mappings.some(([from,to])=>files[to]!==undefined&&!affected.includes(to))||(!isFolder&&allFolders().includes(newPath))||(isFolder&&allFolders().includes(newPath))){toast("Ya existe un elemento con ese nombre");return false;}
 const copy={...files};
 for(const [from] of mappings)delete copy[from];
 for(const [from,to] of mappings)copy[to]=files[from];
 files=copy;
 if(isFolder){const updated=new Set();for(const p of folders)updated.add(p===oldPath||p.startsWith(oldPath+"/")?newPath+p.slice(oldPath.length):p);updated.add(newPath);folders=updated;}
 for(const [from] of mappings){if(models[from]){models[from].dispose();delete models[from];}}
 const current=mappings.find(([from])=>from===active);
 if(current)active=current[1];
 const parents=newPath.split("/");parents.pop();let parent="";
 for(const segment of parents){parent=parent?parent+"/"+segment:segment;folders.add(parent);}
 if(active&&files[active]!==undefined)openFile(active);else renderTree();
 renderTabs();save();schedulePreview();return true;
}
function moveEntry(path,dest){
 const isFolder=allFolders().includes(path);
 if(dest===parentPath(path))return;
 if(isFolder&&(dest===path||dest.startsWith(path+"/"))){toast("No podés mover una carpeta dentro de sí misma");return;}
 replacePath(path,(dest?dest+"/":"")+basename(path),isFolder);
}
function removeEntry(path,isFolder){
 if(isFolder){for(const p of Object.keys(files))if(p.startsWith(path+"/"))delete files[p];for(const p of [...folders])if(p===path||p.startsWith(path+"/"))folders.delete(p);}
 else delete files[path];
 Object.values(models).forEach(m=>m.dispose());models={};
 if(!files[active])active="";
 const next=active||Object.keys(files)[0];
 if(next)openFile(next);else{active="";editor.setModel(null);$("activeFileLabel").textContent="Sin archivo";renderTree();renderTabs();}
 save();updatePreview();
}
function resolveAsset(ref,from){
 if(!ref||/^(?:[a-z]+:|\/\/|#|data:)/i.test(ref))return null;
 const raw=ref.split(/[?#]/)[0];
 let decoded;try{decoded=decodeURIComponent(raw);}catch(e){return null;}
 const parts=decoded.startsWith("/")?[]:parentPath(from).split("/").filter(Boolean);
 for(const segment of decoded.split("/")){
  if(!segment||segment===".")continue;
  if(segment===".."){if(!parts.length)return null;parts.pop();}
  else parts.push(segment);
 }
 return parts.join("/");
}
function updatePreview(){
 const entry=files["index.html"]!==undefined?"index.html":Object.keys(files).find(p=>basename(p)==="index.html")||Object.keys(files).find(p=>langFor(p)==="html");
 if(!entry){$("livePreview").srcdoc="<p style='font-family:sans-serif;padding:20px'>Creá un archivo HTML para ver la vista previa.</p>";$("previewState").textContent="Sin HTML";return;}
 const doc=new DOMParser().parseFromString(files[entry],"text/html");
 const linkedCss=new Set(),linkedJs=new Set();
 const expandCss=(path,seen=new Set())=>{
  if(seen.has(path))return "";seen.add(path);
  return String(files[path]||"").replace(/@import\s+(?:url\(\s*)?["']([^"']+)["']\s*\)?\s*;/g,(full,ref)=>{
   const resolved=resolveAsset(ref,path);
   return resolved&&files[resolved]!==undefined?expandCss(resolved,seen):full;
  });
 };
 doc.querySelectorAll('link[rel="stylesheet"][href]').forEach(link=>{
  const path=resolveAsset(link.getAttribute("href"),entry);
  if(path&&files[path]!==undefined){
   const style=doc.createElement("style");style.textContent=expandCss(path);link.replaceWith(style);linkedCss.add(path);
  }
 });
 doc.querySelectorAll("script[src]").forEach(old=>{
  const path=resolveAsset(old.getAttribute("src"),entry);
  if(path&&files[path]!==undefined){
   const script=doc.createElement("script");
   for(const attr of old.attributes)if(!["src","integrity","crossorigin"].includes(attr.name))script.setAttribute(attr.name,attr.value);
   script.textContent=files[path].replace(/<\/script/gi,"<\\/script");
   old.replaceWith(script);linkedJs.add(path);
  }
 });
 if(files["style.css"]!==undefined&&!linkedCss.has("style.css")){
  const style=doc.createElement("style");style.textContent=expandCss("style.css");doc.head.appendChild(style);
 }
 const bridge=doc.createElement("script");
 bridge.textContent="const send=(type,args)=>parent.postMessage({webdevEditor:true,type,args:args.map(x=>{try{return typeof x==='object'?JSON.stringify(x):String(x)}catch(e){return String(x)}})},'*');['log','warn','error','info'].forEach(k=>{const old=console[k];console[k]=(...a)=>{send(k,a);old.apply(console,a)}});window.onerror=(m,s,l)=>send('error',[m+' (línea '+l+')']);";
 doc.head.appendChild(bridge);
 if(files["script.js"]!==undefined&&!linkedJs.has("script.js")){
  const script=doc.createElement("script");script.textContent=files["script.js"];doc.body.appendChild(script);
 }
 $("livePreview").srcdoc="<!doctype html>"+doc.documentElement.outerHTML;
 $("previewState").textContent="Actualizada "+new Date().toLocaleTimeString();
}
function openPreviewTab(){
 updatePreview();
 const blob=new Blob([$("livePreview").srcdoc],{type:"text/html"});
 const url=URL.createObjectURL(blob),tab=window.open(url,"_blank");
 if(!tab){toast("Permití las ventanas emergentes para abrir la vista previa.");URL.revokeObjectURL(url);return;}
 setTimeout(()=>URL.revokeObjectURL(url),60000);
}
function schedulePreview(){clearTimeout(timer);timer=setTimeout(updatePreview,450);}
function showAction(mode,target="",isFolder=false){
 dialogMode=mode;dialogTarget=target;
 const dialog=$("actionDialog"),title=$("actionTitle"),input=$("actionInput"),message=$("actionMessage"),confirm=$("actionConfirm");
 $("actionInputRow").style.display=["rename","folder","project-new","project-rename"].includes(mode)?"grid":"none";
 $("actionFolderRow").style.display=mode==="move"?"grid":"none";
 confirm.classList.toggle("danger",mode==="delete"||mode==="project-delete");
 confirm.textContent=(mode==="delete"||mode==="project-delete")?"Eliminar":"Aceptar";
 message.textContent="";input.value="";
 if(mode==="choose"){
  title.textContent=(isFolder?"Carpeta: ":"Archivo: ")+basename(target);
  message.innerHTML="<p>¿Qué querés hacer con este elemento?</p>";
  for(const [label,action] of [["✎ Renombrar","rename"],["⇄ Mover","move"],["🗑 Eliminar","delete"]]){
   const btn=document.createElement("button");btn.type="button";btn.className="action-choice";btn.textContent=label;
   btn.addEventListener("click",()=>showAction(action,target,isFolder));message.appendChild(btn);
  }
  confirm.style.display="none";
 }else{
  confirm.style.display="inline-block";
  if(mode==="rename"){title.textContent="Renombrar "+(isFolder?"carpeta":"archivo");input.value=basename(target);$("actionInputRow").firstChild.textContent="Nuevo nombre";}
  if(mode==="folder"){title.textContent="Crear carpeta";$("actionInputRow").firstChild.textContent="Nombre de la carpeta";input.placeholder="ejemplo";message.textContent=target?"Dentro de: "+target:"En la raíz del proyecto";}
  if(mode==="move"){title.textContent="Mover "+(isFolder?"carpeta":"archivo");folderSelect($("actionFolder"),isFolder?target:"");$("actionFolder").value=parentPath(target);}
  if(mode==="delete"){title.textContent="Eliminar "+(isFolder?"carpeta":"archivo");message.textContent="Se eliminará "+target+(isFolder?" y todos sus archivos y subcarpetas.":"")+". Esta acción no se puede deshacer.";}
  if(mode==="project-new"){title.textContent="Nuevo proyecto";input.placeholder="Nombre del proyecto";}
  if(mode==="project-rename"){title.textContent="Renombrar proyecto";input.value=projectCatalog.find(p=>p.id===target)?.name||"";}
  if(mode==="project-delete"){title.textContent="Eliminar proyecto";message.textContent="Se borrará definitivamente el proyecto «"+(projectCatalog.find(p=>p.id===target)?.name||"")+"» y todos sus archivos locales.";}
 }
 dialog.classList.add("open");dialog.setAttribute("aria-hidden","false");
 if($("actionInputRow").style.display!=="none")setTimeout(()=>{input.focus();input.select();},30);
}
function closeAction(){const d=$("actionDialog");d.classList.remove("open");d.setAttribute("aria-hidden","true");}
function fileOptions(name,isFolder=false){showAction("choose",name,isFolder);}
function createFolder(parent=""){showAction("folder",parent);}
async function confirmAction(){
 const mode=dialogMode,target=dialogTarget,value=$("actionInput").value.trim();
 const folder=allFolders().includes(target);
 if(["rename","folder","project-new","project-rename"].includes(mode)&&(!value||(mode!=="project-new"&&mode!=="project-rename"&&!cleanName(value)))){toast("Escribí un nombre válido");return;}
 if(mode==="folder"){
  const path=(target?target+"/":"")+value;
  if(allFolders().includes(path)||files[path]!==undefined){toast("Esa carpeta ya existe");return;}
  folders.add(path);collapsed.delete(target);save();renderTree();
 }else if(mode==="rename"){
  if(!replacePath(target,(parentPath(target)?parentPath(target)+"/":"")+value,folder))return;
 }else if(mode==="move"){
  moveEntry(target,$("actionFolder").value);
 }else if(mode==="delete"){
  removeEntry(target,folder);
 }else if(mode==="project-new"){
  const id="project-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,7);
  projectCatalog.push({id,name:value});await switchProject(id);
  files={...starter};folders=new Set();projectName=value;$("projectName").textContent=value;
  await saveNow();if(editor)openFile("index.html");
 }else if(mode==="project-rename"){
  const project=projectCatalog.find(p=>p.id===target);if(project){project.name=value;if(projectId===target){projectName=value;$("projectName").textContent=value;await saveNow();}else{const record=localDB?await readLocalProject(localDB,target):readFallback(target);if(record){record.name=value;if(localDB)await writeLocalProject(localDB,target,record);else localStorage.setItem("webdev-project-"+target,JSON.stringify(record));}}updateCatalog();renderProjects();}
 }else if(mode==="project-delete"){
  if(projectCatalog.length===1){toast("Creá otro proyecto antes de eliminar el último.");return;}
  if(projectId===target){const next=projectCatalog.find(p=>p.id!==target);await switchProject(next.id);}
  projectCatalog=projectCatalog.filter(p=>p.id!==target);
  if(localDB)await deleteLocalProject(localDB,target);
  try{localStorage.removeItem("webdev-project-"+target);}catch(e){}
  updateCatalog();renderProjects();
 }
 closeAction();
}
function createFile(){
 const dialog=$("fileDialog"),input=$("newFileName");
 folderSelect($("newFileFolder"));dialog.classList.add("open");dialog.setAttribute("aria-hidden","false");input.value="";input.focus();
}
function closeFileDialog(){$("fileDialog").classList.remove("open");$("fileDialog").setAttribute("aria-hidden","true");}
function confirmCreateFile(){
 const name=$("newFileName").value.trim(),folder=$("newFileFolder").value;
 if(!cleanName(name)){toast("Escribí un nombre de archivo válido");return;}
 const path=(folder?folder+"/":"")+name;
 if(files[path]!==undefined||allFolders().includes(path)){toast("Ese nombre ya existe");return;}
 const ext=name.split(".").pop().toLowerCase();
 files[path]=ext==="html"?"<!doctype html>\n<html lang=\"es\">\n<head><meta charset=\"UTF-8\"><title>Nuevo archivo</title></head>\n<body>\n  \n</body>\n</html>":ext==="css"?"/* Escribe tus estilos aquí */\n":ext==="js"?"// Escribe tu JavaScript aquí\n":ext==="json"?"{\n  \n}\n":"";
 if(folder)collapsed.delete(folder);
 openFile(path);save();closeFileDialog();schedulePreview();
}
function renderProjects(){
 const root=$("projectsList");root.innerHTML="";
 for(const project of projectCatalog){
  const row=document.createElement("div");row.className="project-entry"+(project.id===projectId?" active":"");
  const open=document.createElement("button");open.className="project-open";open.textContent=project.name+(project.id===projectId?" ✓":"");open.addEventListener("click",()=>switchProject(project.id));row.appendChild(open);
  for(const [icon,mode] of [["✎","project-rename"],["🗑","project-delete"]]){
   const b=document.createElement("button");b.className="project-action"+(mode==="project-delete"?" danger":"");b.textContent=icon;b.title=mode==="project-delete"?"Eliminar proyecto":"Renombrar proyecto";b.addEventListener("click",()=>showAction(mode,project.id));row.appendChild(b);
  }
  root.appendChild(row);
 }
}
function openProjectsDialog(){renderProjects();$("projectsDialog").classList.add("open");$("projectsDialog").setAttribute("aria-hidden","false");}
function closeProjectsDialog(){$("projectsDialog").classList.remove("open");$("projectsDialog").setAttribute("aria-hidden","true");}
function formatCurrent(){if(!editor)return;editor.getAction("editor.action.formatDocument")?.run();}
function downloadZip(){if(!window.JSZip)return toast("No se pudo cargar el módulo ZIP");const zip=new JSZip();Object.entries(files).forEach(([name,content])=>zip.file(name,content));zip.generateAsync({type:"blob"}).then(blob=>{const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="mi-proyecto.zip";a.click();URL.revokeObjectURL(a.href);toast("Proyecto descargado");});}
function loadSettings(){
 try{const saved=JSON.parse(localStorage.getItem("webdev-editor-settings-v1")||"null");if(saved&&typeof saved==="object")settings={...settings,...saved};}catch(e){}
 settings.fontSize=Math.max(10,Math.min(26,Number(settings.fontSize)||13));
 settings.theme=settings.theme==="light"?"light":"dark";
 settings.wrap=settings.wrap==="off"?"off":"on";
 settings.keys=settings.keys!==false;
 $("fontSizeSetting").value=settings.fontSize;$("fontSizeValue").textContent=settings.fontSize+" px";
 $("themeSetting").value=settings.theme;$("wrapSetting").value=settings.wrap;$("keysSetting").checked=settings.keys;
 applySettings();
}
function applySettings(){
 if(editor){editor.updateOptions({fontSize:settings.fontSize,wordWrap:settings.wrap});monaco.editor.setTheme(settings.theme==="light"?"vs":"webdev-dark");}
 $("mobileKeys").classList.toggle("keys-hidden",!settings.keys);
 $("fontSizeValue").textContent=settings.fontSize+" px";
 try{localStorage.setItem("webdev-editor-settings-v1",JSON.stringify(settings));}catch(e){}
}
function toggleSettings(force){
 const open=typeof force==="boolean"?force:!$("settingsPanel").classList.contains("open");
 $("settingsPanel").classList.toggle("open",open);$("settingsPanel").setAttribute("aria-hidden",String(!open));
}
function insertMobileText(value,paired=false){
 if(!editor||!editor.getModel())return;
 const selection=editor.getSelection(),selected=editor.getModel().getValueInRange(selection);
 const text=paired?value[0]+selected+value[1]:value;
 editor.executeEdits("mobile-keys",[{range:selection,text,forceMoveMarkers:true}]);
 if(paired){const pos=editor.getPosition();editor.setPosition({lineNumber:pos.lineNumber,column:Math.max(1,pos.column-1)});}
 editor.focus();
}
function mobileKey(key,button){
 if(!editor)return;
 if(key==="ctrl"||key==="alt"){
  if(key==="ctrl")modifierCtrl=!modifierCtrl;else modifierAlt=!modifierAlt;
  button.setAttribute("aria-pressed",String(key==="ctrl"?modifierCtrl:modifierAlt));return;
 }
 if(key==="save"||modifierCtrl&&key==="s"){saveNow();toast("Guardado local");}
 else if(key==="undo")editor.trigger("mobile","undo");
 else if(key==="redo")editor.trigger("mobile","redo");
 else if(key==="tab")editor.trigger("mobile",modifierCtrl?"editor.action.outdentLines":"editor.action.indentLines");
 else if(key==="escape"){editor.trigger("mobile","hideSuggestWidget");editor.trigger("mobile","closeFindWidget");}
 else if(["left","right","up","down"].includes(key)){
  const model=editor.getModel();if(model){
   const p=editor.getPosition();let line=p.lineNumber,col=p.column;
   if(key==="left"){if(col>1)col--;else if(line>1){line--;col=model.getLineMaxColumn(line);}}
   if(key==="right"){if(col<model.getLineMaxColumn(line))col++;else if(line<model.getLineCount()){line++;col=1;}}
   if(key==="up")line=Math.max(1,line-1);
   if(key==="down")line=Math.min(model.getLineCount(),line+1);
   col=Math.min(col,model.getLineMaxColumn(line));editor.setPosition({lineNumber:line,column:col});editor.revealPositionInCenterIfOutsideViewport({lineNumber:line,column:col});
  }
 }else if(key==="{")insertMobileText("{}",true);
 else if(key==="(")insertMobileText("()",true);
 else insertMobileText(key);
 modifierCtrl=false;modifierAlt=false;
 document.querySelectorAll('#mobileKeys [aria-pressed]').forEach(b=>b.setAttribute("aria-pressed","false"));
 editor.focus();
}
function initControls(){
 $("projectPicker").addEventListener("click",openProjectsDialog);
 $("projectsClose").addEventListener("click",closeProjectsDialog);
 $("projectsDialog").addEventListener("click",e=>{if(e.target===$("projectsDialog"))closeProjectsDialog();});
 $("newProjectBtn").addEventListener("click",()=>showAction("project-new"));
 $("newFolderSmall").addEventListener("click",()=>createFolder());
 $("toggleExplorer").addEventListener("click",()=>{
  $("workbench").classList.remove("preview-open");
  $("workbench").classList.toggle("explorer-open");
 });
 $("actionClose").addEventListener("click",closeAction);
 $("actionCancel").addEventListener("click",closeAction);
 $("actionConfirm").addEventListener("click",confirmAction);
 $("actionInput").addEventListener("keydown",e=>{if(e.key==="Enter")confirmAction();});
 $("actionDialog").addEventListener("click",e=>{if(e.target===$("actionDialog"))closeAction();});
 $("fileTree").addEventListener("dragover",e=>e.preventDefault());
 $("fileTree").addEventListener("drop",e=>{if(e.target.closest(".folder-row"))return;e.preventDefault();const path=e.dataTransfer.getData("text/plain");if(path)moveEntry(path,"");});
 $("settingsFloat").addEventListener("click",()=>toggleSettings());
 $("closeSettings").addEventListener("click",()=>toggleSettings(false));
 $("fontSizeSetting").addEventListener("input",e=>{settings.fontSize=Number(e.target.value);applySettings();});
 $("themeSetting").addEventListener("change",e=>{settings.theme=e.target.value;applySettings();});
 $("wrapSetting").addEventListener("change",e=>{settings.wrap=e.target.value;applySettings();});
 $("keysSetting").addEventListener("change",e=>{settings.keys=e.target.checked;applySettings();});
 $("mobileKeys").addEventListener("pointerdown",e=>{if(e.target.closest("button"))e.preventDefault();});
 $("mobileKeys").addEventListener("click",e=>{const b=e.target.closest("button[data-key]");if(b)mobileKey(b.dataset.key,b);});
 document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeAction();closeFileDialog();closeProjectsDialog();toggleSettings(false);}});
 loadSettings();
}
async function init(){
 await loadLocalFiles();
 window.MonacoEnvironment={getWorkerUrl:function(workerId,label){const base="https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/";const worker=label==="json"?"json":label==="css"?"css":label==="html"?"html":"editor";return "data:text/javascript;charset=utf-8,"+encodeURIComponent("self.MonacoEnvironment={baseUrl:'"+base+"'};importScripts('"+base+"vs/base/worker/workerMain.js');");}};
 require.config({paths:{vs:"https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs"}});
 require(["vs/editor/editor.main"],()=>{
  monaco.editor.defineTheme("webdev-dark",{base:"vs-dark",inherit:true,rules:[{token:"tag",foreground:"569CD6"},{token:"attribute.name",foreground:"9CDCFE"},{token:"attribute.value",foreground:"CE9178"},{token:"string",foreground:"CE9178"},{token:"comment",foreground:"6A9955"},{token:"keyword",foreground:"C586C0"},{token:"number",foreground:"B5CEA8"},{token:"type",foreground:"4EC9B0"}],colors:{"editor.background":"#1E1E1E","editorLineNumber.foreground":"#858585","editorCursor.foreground":"#AEAFAD","editor.selectionBackground":"#264F78","editorLineNumber.activeForeground":"#C6C6C6"}});
  editor=monaco.editor.create($("monacoEditor"),{value:"",language:"html",theme:"webdev-dark",automaticLayout:true,fontSize:13,fontFamily:"Consolas, 'Cascadia Code', monospace",minimap:{enabled:false},scrollBeyondLastLine:false,wordWrap:"on",tabSize:2,insertSpaces:true,formatOnPaste:true,suggestOnTriggerCharacters:true,quickSuggestions:{other:true,comments:false,strings:true},acceptSuggestionOnEnter:"on",bracketPairColorization:{enabled:true},padding:{top:12}});
  editor.onDidChangeModelContent(()=>{if(!active)return;files[active]=editor.getValue();save();schedulePreview();});
  editor.onDidChangeCursorPosition(e=>$("cursorStatus").textContent="Línea "+e.position.lineNumber+", columna "+e.position.column);
  const first=files["index.html"]!==undefined?"index.html":Object.keys(files)[0];if(first)openFile(first);else renderTree();applySettings();updatePreview();
 });
 initControls();
 $("newFileBtn").addEventListener("click",createFile);$("newFileSmall").addEventListener("click",createFile);$("createFileConfirm").addEventListener("click",confirmCreateFile);$("cancelFile").addEventListener("click",closeFileDialog);$("cancelFile2").addEventListener("click",closeFileDialog);$("fileDialog").addEventListener("click",e=>{if(e.target===$("fileDialog"))closeFileDialog();});$("newFileName").addEventListener("keydown",e=>{if(e.key==="Enter")confirmCreateFile();});document.querySelectorAll("[data-ext]").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll("[data-ext]").forEach(x=>x.classList.toggle("active",x===b));$("newFileName").value="nuevo."+b.dataset.ext;}));$("refreshFiles").addEventListener("click",()=>{if(confirm("¿Restaurar los archivos iniciales? Se perderán los cambios actuales.")){files={...starter};Object.values(models).forEach(m=>m.dispose());models={};openFile("index.html");save();updatePreview();}});
 $("downloadBtn").addEventListener("click",downloadZip);$("formatBtn").addEventListener("click",formatCurrent);$("closeTabBtn").addEventListener("click",()=>toast("Las pestañas se mantienen abiertas para no perder el trabajo."));
 $("runPreview").addEventListener("click",updatePreview);$("openPreviewTab").addEventListener("click",openPreviewTab);$("showPreviewBtn").addEventListener("click",()=>{$("workbench").classList.toggle("preview-open");$("showPreviewBtn").textContent=$("workbench").classList.contains("preview-open")?"‹ Volver al código":"▷ Vista previa";updatePreview();});$("clearConsole").addEventListener("click",()=>$("consoleOutput").textContent="Consola limpia.");
 $("importBtn").addEventListener("click",()=>$("filePicker").click());$("filePicker").addEventListener("change",async e=>{for(const f of e.target.files){if(f.size>1024*1024){toast(f.name+" supera 1 MB");continue;}files[f.name]=await f.text();if(models[f.name]){models[f.name].dispose();delete models[f.name];}}const first=e.target.files[0];if(first)openFile(first.name);save();renderTree();renderTabs();schedulePreview();e.target.value="";});
 document.querySelectorAll("[data-size]").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll("[data-size]").forEach(x=>x.classList.toggle("active",x===b));$("livePreview").className=b.dataset.size==="desktop"?"":b.dataset.size;}));
 window.addEventListener("message",e=>{if(!e.data?.webdevEditor)return;const out=$("consoleOutput"),line="["+e.data.type.toUpperCase()+"] "+(e.data.args||[]).join(" ");out.textContent=(out.textContent==="La salida de JavaScript aparecerá aquí."?"":out.textContent+"\n")+line;});
 window.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="s"){e.preventDefault();saveNow();toast("Proyecto guardado en este dispositivo");}});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();