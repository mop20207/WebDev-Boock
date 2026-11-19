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
let files={},active="",editor=null,models={},timer=null;
const langFor=name=>({html:"html",htm:"html",css:"css",js:"javascript",mjs:"javascript",json:"json",svg:"xml",xml:"xml",md:"markdown",txt:"plaintext"}[name.split(".").pop().toLowerCase()]||"plaintext");
const iconFor=name=>({html:"5",htm:"5",css:"#",js:"JS",mjs:"JS",json:"{}",svg:"◇"}[name.split(".").pop().toLowerCase()]||"·");
const escapeHtml=s=>s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function toast(msg){$("toast").textContent=msg;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),2100)}
function save(){try{localStorage.setItem(KEY,JSON.stringify(files));$("saveStatus").textContent="Guardado local";}catch(e){$("saveStatus").textContent="No se pudo guardar";}}
function modelFor(name){if(!models[name])models[name]=monaco.editor.createModel(files[name],langFor(name),monaco.Uri.parse("file:///"+name));return models[name];}
function renderTree(){const root=$("fileTree");root.innerHTML="";Object.keys(files).sort((a,b)=>a.localeCompare(b)).forEach(name=>{const row=document.createElement("div");row.className="file-row"+(name===active?" active":"");const ext=name.split(".").pop().toLowerCase();row.innerHTML='<span class="file-icon '+escapeHtml(ext)+'">'+iconFor(name)+'</span><span>'+escapeHtml(name)+'</span><button class="file-menu" title="Opciones">···</button>';row.addEventListener("click",()=>openFile(name));row.querySelector("button").addEventListener("click",e=>{e.stopPropagation();fileOptions(name)});root.appendChild(row);});}
function renderTabs(){const tabs=$("editorTabs");tabs.innerHTML="";Object.keys(models).forEach(name=>{const b=document.createElement("button");b.className="editor-tab"+(name===active?" active":"");b.textContent=name;b.addEventListener("click",()=>openFile(name));tabs.appendChild(b);});}
function openFile(name){if(!files[name])return;active=name;editor.setModel(modelFor(name));$("activeFileLabel").textContent=name;$("languageStatus").textContent=langFor(name).toUpperCase();renderTree();renderTabs();editor.focus();}
function updatePreview(){if(!files["index.html"])return;let html=files["index.html"];const css=files["style.css"]||"",js=files["script.js"]||"";const style="<style>"+css.replace(/<\/style/gi,"<\\/style")+"</style>";const script="<script>const send=(type,args)=>parent.postMessage({webdevEditor:true,type,args:args.map(x=>{try{return typeof x==='object'?JSON.stringify(x):String(x)}catch(e){return String(x)}})},'*');['log','warn','error','info'].forEach(k=>{const old=console[k];console[k]=(...a)=>{send(k,a);old.apply(console,a)}});window.onerror=(m,s,l)=>send('error',[m+' (línea '+l+')']);<\/script><script>"+js.replace(/<\/script/gi,"<\\/script")+"</script>";if(/<\/head>/i.test(html))html=html.replace(/<\/head>/i,style+"</head>");else html=style+html;if(/<\/body>/i.test(html))html=html.replace(/<\/body>/i,script+"</body>");else html+=script;$("livePreview").srcdoc=html;$("previewState").textContent="Actualizada "+new Date().toLocaleTimeString();}
function schedulePreview(){clearTimeout(timer);timer=setTimeout(updatePreview,450);}
function fileOptions(name){const action=prompt("Opciones para "+name+": escribe renombrar o eliminar");if(action==="eliminar"){if(!confirm("¿Eliminar "+name+"?"))return;delete files[name];if(models[name]){models[name].dispose();delete models[name];}if(active===name){active=Object.keys(files)[0]||"";if(active)openFile(active);}renderTree();renderTabs();save();schedulePreview();}else if(action==="renombrar"){const next=prompt("Nuevo nombre de archivo",name);if(!next||next===name||files[next]!==undefined)return toast("Nombre no válido o ya existente");files[next]=files[name];delete files[name];if(models[name]){models[name].dispose();delete models[name];}if(active===name)active=next;openFile(next);save();}}
function createFile(){const name=prompt("Nombre del archivo (ejemplo: app.js, datos.json)");if(!name)return;if(!/^[\w.-]+$/.test(name)||name.startsWith(".")||files[name]!==undefined)return toast("Nombre no válido o ya existe");files[name]=name.endsWith(".html")?"<!doctype html>\n<html lang=\"es\">\n<head><meta charset=\"UTF-8\"><title>Nuevo archivo</title></head>\n<body>\n  \n</body>\n</html>":name.endsWith(".css")?"/* Escribe tus estilos aquí */\n":name.endsWith(".js")?"// Escribe tu JavaScript aquí\n":name.endsWith(".json")?"{\n  \n}\n":"";openFile(name);save();}
function formatCurrent(){if(!editor)return;editor.getAction("editor.action.formatDocument")?.run();}
function downloadZip(){if(!window.JSZip)return toast("No se pudo cargar el módulo ZIP");const zip=new JSZip();Object.entries(files).forEach(([name,content])=>zip.file(name,content));zip.generateAsync({type:"blob"}).then(blob=>{const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="mi-proyecto.zip";a.click();URL.revokeObjectURL(a.href);toast("Proyecto descargado");});}
function init(){
 const saved=localStorage.getItem(KEY);try{files=saved?JSON.parse(saved):{...starter};}catch(e){files={...starter};}
 if(!files||typeof files!=="object"||!Object.keys(files).length)files={...starter};
 window.MonacoEnvironment={getWorkerUrl:function(workerId,label){const base="https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/";const worker=label==="json"?"json":label==="css"?"css":label==="html"?"html":"editor";return "data:text/javascript;charset=utf-8,"+encodeURIComponent("self.MonacoEnvironment={baseUrl:'"+base+"'};importScripts('"+base+"vs/base/worker/workerMain.js');");}};
 require.config({paths:{vs:"https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs"}});
 require(["vs/editor/editor.main"],()=>{
  monaco.editor.defineTheme("webdev-dark",{base:"vs-dark",inherit:true,rules:[{token:"tag",foreground:"569CD6"},{token:"attribute.name",foreground:"9CDCFE"},{token:"attribute.value",foreground:"CE9178"},{token:"string",foreground:"CE9178"},{token:"comment",foreground:"6A9955"},{token:"keyword",foreground:"C586C0"},{token:"number",foreground:"B5CEA8"},{token:"type",foreground:"4EC9B0"}],colors:{"editor.background":"#1E1E1E","editorLineNumber.foreground":"#858585","editorCursor.foreground":"#AEAFAD","editor.selectionBackground":"#264F78","editorLineNumber.activeForeground":"#C6C6C6"}});
  editor=monaco.editor.create($("monacoEditor"),{value:"",language:"html",theme:"webdev-dark",automaticLayout:true,fontSize:13,fontFamily:"Consolas, 'Cascadia Code', monospace",minimap:{enabled:false},scrollBeyondLastLine:false,wordWrap:"on",tabSize:2,insertSpaces:true,formatOnPaste:true,suggestOnTriggerCharacters:true,quickSuggestions:{other:true,comments:false,strings:true},acceptSuggestionOnEnter:"on",bracketPairColorization:{enabled:true},padding:{top:12}});
  editor.onDidChangeModelContent(()=>{if(!active)return;files[active]=editor.getValue();save();if(["index.html","style.css","script.js"].includes(active))schedulePreview();});
  editor.onDidChangeCursorPosition(e=>$("cursorStatus").textContent="Línea "+e.position.lineNumber+", columna "+e.position.column);
  openFile(Object.keys(files).includes("index.html")?"index.html":Object.keys(files)[0]);updatePreview();
 });
 $("newFileBtn").addEventListener("click",createFile);$("newFileSmall").addEventListener("click",createFile);$("refreshFiles").addEventListener("click",()=>{if(confirm("¿Restaurar los archivos iniciales? Se perderán los cambios actuales.")){files={...starter};Object.values(models).forEach(m=>m.dispose());models={};openFile("index.html");save();updatePreview();}});
 $("downloadBtn").addEventListener("click",downloadZip);$("formatBtn").addEventListener("click",formatCurrent);$("closeTabBtn").addEventListener("click",()=>toast("Las pestañas se mantienen abiertas para no perder el trabajo."));
 $("runPreview").addEventListener("click",updatePreview);$("clearConsole").addEventListener("click",()=>$("consoleOutput").textContent="Consola limpia.");
 $("importBtn").addEventListener("click",()=>$("filePicker").click());$("filePicker").addEventListener("change",async e=>{for(const f of e.target.files){if(f.size>1024*1024){toast(f.name+" supera 1 MB");continue;}files[f.name]=await f.text();}const first=e.target.files[0];if(first)openFile(first.name);save();renderTree();renderTabs();schedulePreview();e.target.value="";});
 document.querySelectorAll("[data-size]").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll("[data-size]").forEach(x=>x.classList.toggle("active",x===b));$("livePreview").className=b.dataset.size==="desktop"?"":b.dataset.size;}));
 window.addEventListener("message",e=>{if(!e.data?.webdevEditor)return;const out=$("consoleOutput"),line="["+e.data.type.toUpperCase()+"] "+(e.data.args||[]).join(" ");out.textContent=(out.textContent==="La salida de JavaScript aparecerá aquí."?"":out.textContent+"\n")+line;});
 window.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="s"){e.preventDefault();downloadZip();}});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();