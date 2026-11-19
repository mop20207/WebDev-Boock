(() => {
const markup=`<section class="editor-modal" id="editorModal" aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="editorTitle"><div class="editor-dialog"><div class="editor-header"><div><div class="eyebrow">WEBDEV BOOK / PLAYGROUND</div><h2 id="editorTitle">Laboratorio de código</h2></div><button class="close-editor" id="closeEditor" type="button" aria-label="Cerrar">×</button></div><div class="editor-toolbar"><div class="editor-tabs"><button class="editor-tab active" data-tab="html" type="button">HTML</button><button class="editor-tab" data-tab="css" type="button">CSS</button><button class="editor-tab" data-tab="js" type="button">JavaScript</button></div><div class="editor-actions"><button class="button button-small button-ghost" id="resetCode" type="button">Restablecer</button><button class="button button-small button-primary" id="runCode" type="button">▶ Ejecutar</button></div></div><div class="editor-workspace"><div class="code-editor-area"><div class="editor-pane active" data-pane="html"><textarea id="htmlCode" spellcheck="false"><h1>¡Hola, mundo!</h1>
<p>Este es mi primer experimento.</p></textarea></div><div class="editor-pane" data-pane="css"><textarea id="cssCode" spellcheck="false">body { font-family: Arial; padding: 24px; color: #172554; }
h1 { color: #4169e1; }</textarea></div><div class="editor-pane" data-pane="js"><textarea id="jsCode" spellcheck="false">console.log("¡Hola desde JavaScript!");</textarea></div></div><div class="preview-area"><div class="preview-heading"><span><i></i> VISTA PREVIA</span><button id="refreshPreview" type="button">↻ Actualizar</button></div><iframe id="previewFrame" title="Vista previa" sandbox="allow-scripts"></iframe><div class="console-output"><span>CONSOLA</span><pre id="consoleText">La salida de console.log aparecerá acá.</pre></div></div></div><div class="editor-footer"><span>Autocompletado: comienza a sugerir al escribir; Ctrl + Espacio abre la lista.</span><span>HTML · CSS · JS</span></div></div></section>`;
function init(){
 const mount=document.getElementById("editorMount");if(!mount||document.getElementById("editorModal"))return;
 mount.innerHTML=markup;const modal=document.getElementById("editorModal");
 const ids=["html","css","js"],editors={},defaults={};
 ids.forEach(id=>defaults[id]=document.getElementById(id+"Code").value);
 if(window.CodeMirror){
  const modes={html:"htmlmixed",css:"css",js:"javascript"};
  ids.forEach(id=>{
   editors[id]=CodeMirror.fromTextArea(document.getElementById(id+"Code"),{
    mode:modes[id],theme:"material-darker",lineNumbers:true,tabSize:2,indentUnit:2,
    matchBrackets:true,autoCloseTags:id==="html",autoCloseBrackets:true,
    extraKeys:{"Ctrl-Space":cm=>showHints(id,cm),"Cmd-Space":cm=>showHints(id,cm),"Tab":cm=>cm.replaceSelection("  ","end")},
    hintOptions:{completeSingle:false}
   });
  });
  function htmlHints(cm){
   const cur=cm.getCursor(),line=cm.getLine(cur.line),before=line.slice(0,cur.ch);
   const tagMatch=before.match(/<([a-zA-Z][\w-]*)?$/);
   const attrMatch=before.match(/<([a-zA-Z][\w-]*)\s+([\w-]*)$/);
   const tags="a article aside audio button canvas div footer form h1 h2 h3 header img input label li link main nav ol option p section select span strong table tbody td textarea th thead tr ul video".split(" ");
   const attrs="class id title name type value href src alt role aria-label placeholder required disabled checked target rel style".split(" ");
   let list=tagMatch?tags:attrMatch?attrs:null;
   if(!list)return CodeMirror.hint.html?CodeMirror.hint.html(cm):{list:[],from:cur,to:cur};
   const token=cm.getTokenAt(cur),start=cur.ch-token.string.length;
   return {list:list.filter(x=>x.startsWith(token.string.replace(/^</,""))).map(x=>tagMatch?x: x+'=""'),from:CodeMirror.Pos(cur.line,start),to:cur};
  }
  function showHints(id,cm){
   const provider=id==="html"?htmlHints:(CodeMirror.hint&&CodeMirror.hint[id==="css"?"css":"javascript"]);
   if(provider)cm.showHint({hint:provider,completeSingle:false});
  }
  ids.forEach(id=>{
   const cm=editors[id];
   cm.on("inputRead",(instance,change)=>{
    if(!change.text||!change.text.length)return;
    const typed=change.text.join("");
    const cur=instance.getCursor(),line=instance.getLine(cur.line),before=line.slice(0,cur.ch);
    const shouldSuggest=id==="html"?(/<[\w-]{1,}$/.test(before)||/<[\w-]+\s+[\w-]*$/.test(before)):id==="css"?(/[\w-]{2,}$/.test(before)||/:[\s\w-]*$/.test(before)):(/[\w$]{2,}$/.test(before));
    if(shouldSuggest&&!instance.state.completionActive)showHints(id,instance);
   });
  });
 }else{
  console.warn("CodeMirror no se cargó: revisá la conexión a cdnjs.");
 }
 const value=id=>editors[id]?editors[id].getValue():document.getElementById(id+"Code").value;
 const setValue=(id,v)=>editors[id]?editors[id].setValue(v):document.getElementById(id+"Code").value=v;
 function run(){const html=value("html"),css=value("css"),js=value("js").replace(/<\/script/gi,"<\\/script");const script=`<script>console.log=(...a)=>parent.postMessage({type:"webdev-log",text:a.map(x=>typeof x==="object"?JSON.stringify(x):String(x)).join(" ")},"*");window.onerror=m=>parent.postMessage({type:"webdev-error",text:String(m)},"*");try{${js}}catch(e){parent.postMessage({type:"webdev-error",text:e.message},"*")}<\\/script>`;document.getElementById("previewFrame").srcdoc="<!doctype html><html><head><meta charset='utf-8'><style>"+css+"</style></head><body>"+html+script+"</body></html>";document.getElementById("consoleText").textContent="Vista previa actualizada.";}
 function open(){modal.classList.add("open");modal.setAttribute("aria-hidden","false");document.body.style.overflow="hidden";run();setTimeout(()=>{const active=document.querySelector(".editor-pane.active");const id=active?.dataset.pane;if(editors[id])editors[id].refresh().focus();},60);}
 function close(){modal.classList.remove("open");modal.setAttribute("aria-hidden","true");document.body.style.overflow="";}
 document.getElementById("closeEditor").addEventListener("click",close);modal.addEventListener("click",e=>{if(e.target===modal)close();});
 document.addEventListener("keydown",e=>{if(e.key==="Escape")close();});
 document.querySelectorAll(".editor-tab").forEach(tab=>tab.addEventListener("click",()=>{document.querySelectorAll(".editor-tab").forEach(x=>x.classList.toggle("active",x===tab));document.querySelectorAll(".editor-pane").forEach(x=>x.classList.toggle("active",x.dataset.pane===tab.dataset.tab));if(editors[tab.dataset.tab])setTimeout(()=>editors[tab.dataset.tab].refresh().focus(),30);}));
 document.getElementById("runCode").addEventListener("click",run);document.getElementById("refreshPreview").addEventListener("click",run);
 document.getElementById("resetCode").addEventListener("click",()=>{ids.forEach(id=>setValue(id,defaults[id]));run();});
 window.addEventListener("message",e=>{if(e.data?.type==="webdev-log"||e.data?.type==="webdev-error")document.getElementById("consoleText").textContent=e.data.text;});
 window.WebDevEditor={open,close};
 const fab=document.createElement("button");fab.className="floating-editor";fab.type="button";fab.innerHTML="<span>⌘</span><b>Laboratorio</b>";fab.setAttribute("aria-label","Abrir laboratorio");fab.addEventListener("click",open);document.body.appendChild(fab);
}
document.addEventListener("DOMContentLoaded",init);
})();