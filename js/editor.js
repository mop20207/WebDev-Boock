(() => {
const markup=`<section class="editor-modal" id="editorModal" aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="editorTitle"><div class="editor-dialog"><div class="editor-header"><div><div class="eyebrow">WEBDEV BOOK / PLAYGROUND</div><h2 id="editorTitle">Laboratorio de código</h2></div><button class="close-editor" id="closeEditor" type="button" aria-label="Cerrar">×</button></div><div class="editor-toolbar"><div class="editor-tabs"><button class="editor-tab active" data-tab="html" type="button">HTML</button><button class="editor-tab" data-tab="css" type="button">CSS</button><button class="editor-tab" data-tab="js" type="button">JavaScript</button></div><div class="editor-actions"><button class="button button-small button-ghost" id="resetCode" type="button">Restablecer</button><button class="button button-small button-primary" id="runCode" type="button">▶ Ejecutar</button></div></div><div class="editor-workspace"><div class="code-editor-area"><div class="editor-pane active" data-pane="html"><textarea id="htmlCode" spellcheck="false"><h1>¡Hola, mundo!</h1>
<p>Este es mi primer experimento.</p></textarea></div><div class="editor-pane" data-pane="css"><textarea id="cssCode" spellcheck="false">body { font-family: Arial; padding: 24px; color: #172554; }
h1 { color: #4169e1; }</textarea></div><div class="editor-pane" data-pane="js"><textarea id="jsCode" spellcheck="false">console.log("¡Hola desde JavaScript!");</textarea></div></div><div class="preview-area"><div class="preview-heading"><span><i></i> VISTA PREVIA</span><button id="refreshPreview" type="button">↻ Actualizar</button></div><iframe id="previewFrame" title="Vista previa" sandbox="allow-scripts"></iframe><div class="console-output"><span>CONSOLA</span><pre id="consoleText">La salida de console.log aparecerá acá.</pre></div></div></div><div class="editor-footer"><span>Autocompletado: escribí una etiqueta o propiedad, o usá Ctrl + Espacio.</span><span>HTML · CSS · JS</span></div></div></section>`;
function init(){
 const mount=document.getElementById("editorMount"); if(!mount||document.getElementById("editorModal"))return;
 mount.innerHTML=markup; const modal=document.getElementById("editorModal");
 const ids=["html","css","js"], editors={}, defaults={};
 ids.forEach(id=>{const el=document.getElementById(id+"Code");defaults[id]=el.value;});
 if(window.CodeMirror){
  const modes={html:"htmlmixed",css:"css",js:"javascript"};
  ids.forEach(id=>{const el=document.getElementById(id+"Code");editors[id]=CodeMirror.fromTextArea(el,{mode:modes[id],theme:"vscode-dark",lineNumbers:true,tabSize:2,indentUnit:2,matchBrackets:true,autoCloseTags:id==="html",autoCloseBrackets:true,extraKeys:{"Ctrl-Space":"autocomplete","Cmd-Space":"autocomplete","Tab":cm=>cm.replaceSelection("  ","end")},hintOptions:{completeSingle:false}});});
  const hintFns={html:CodeMirror.hint.html,css:CodeMirror.hint.css,js:CodeMirror.hint.javascript};
  ids.forEach(id=>{const cm=editors[id];cm.on("inputRead",(instance,change)=>{if(!change.text||!/[\w-]/.test(change.text.join("")))return;const token=instance.getTokenAt(instance.getCursor());if(token.string.length>=2&&!instance.state.completionActive){const hint=hintFns[id];if(hint)instance.showHint({hint,completeSingle:false});}});});
 }
 const value=id=>editors[id]?editors[id].getValue():document.getElementById(id+"Code").value;
 const setValue=(id,v)=>{if(editors[id])editors[id].setValue(v);else document.getElementById(id+"Code").value=v;};
 function run(){const html=value("html"),css=value("css"),js=value("js").replace(/<\/script/gi,"<\\/script");const script=`<script>console.log=(...a)=>parent.postMessage({type:"webdev-log",text:a.map(x=>typeof x==="object"?JSON.stringify(x):String(x)).join(" ")},"*");window.onerror=m=>parent.postMessage({type:"webdev-error",text:String(m)},"*");try{${js}}catch(e){parent.postMessage({type:"webdev-error",text:e.message},"*")}<\\/script>`;document.getElementById("previewFrame").srcdoc="<!doctype html><html><head><meta charset='utf-8'><style>"+css+"</style></head><body>"+html+script+"</body></html>";document.getElementById("consoleText").textContent="Vista previa actualizada.";}
 function open(){modal.classList.add("open");modal.setAttribute("aria-hidden","false");document.body.style.overflow="hidden";run();setTimeout(()=>{const active=document.querySelector(".editor-pane.active textarea");if(active&&editors[active.id.replace("Code","")])editors[active.id.replace("Code","")].refresh();},30);}
 function close(){modal.classList.remove("open");modal.setAttribute("aria-hidden","true");document.body.style.overflow="";}
 document.getElementById("closeEditor").addEventListener("click",close);modal.addEventListener("click",e=>{if(e.target===modal)close();});
 document.addEventListener("keydown",e=>{if(e.key==="Escape")close();});
 document.querySelectorAll(".editor-tab").forEach(tab=>tab.addEventListener("click",()=>{document.querySelectorAll(".editor-tab").forEach(x=>x.classList.toggle("active",x===tab));document.querySelectorAll(".editor-pane").forEach(x=>x.classList.toggle("active",x.dataset.pane===tab.dataset.tab));if(editors[tab.dataset.tab])setTimeout(()=>editors[tab.dataset.tab].refresh(),20);}));
 document.getElementById("runCode").addEventListener("click",run);document.getElementById("refreshPreview").addEventListener("click",run);
 document.getElementById("resetCode").addEventListener("click",()=>{ids.forEach(id=>setValue(id,defaults[id]));run();});
 window.addEventListener("message",e=>{if(e.data?.type==="webdev-log"||e.data?.type==="webdev-error")document.getElementById("consoleText").textContent=e.data.text;});
 window.WebDevEditor={open,close};
 const fab=document.createElement("button");fab.className="floating-editor";fab.type="button";fab.innerHTML="<span>⌘</span><b>Laboratorio</b>";fab.setAttribute("aria-label","Abrir laboratorio");fab.addEventListener("click",open);document.body.appendChild(fab);
}
document.addEventListener("DOMContentLoaded",init);
})();