const pageContent = document.getElementById("pageContent");
const breadcrumbCurrent = document.getElementById("breadcrumbCurrent");
const sidebar = document.getElementById("sidebar");
const pageTitles = {inicio:"Inicio",html:"HTML",css:"CSS",javascript:"JavaScript",ejercicios:"Ejercicios",proyectos:"Proyectos",favoritos:"Favoritos"};

const pageData = {
 html:{tag:"HTML",title:"La estructura de la web.",description:"HTML (HyperText Markup Language) es el lenguaje de marcado que define la estructura y el significado del contenido de una página web.",color:"html",topics:[["Estructura básica","doctype, html, head y body"],["Etiquetas y elementos","Títulos, párrafos, enlaces e imágenes"],["Atributos","class, id, href, src y más"],["Formularios","Inputs, labels, botones y validación"],["Tablas y multimedia","Datos tabulares, audio y video"],["HTML semántico","header, nav, main, article y footer"],["Accesibilidad","Buenas prácticas para todos los usuarios"],["Errores frecuentes","Problemas comunes y cómo resolverlos"]]},
 css:{tag:"CSS",title:"El diseño cobra vida.",description:"CSS (Cascading Style Sheets) permite controlar la presentación visual de los documentos HTML: colores, tamaños, distribución, animaciones y adaptación a pantallas.",color:"css",topics:[["Selectores","Elementos, clases, IDs y combinadores"],["Propiedades y valores","Colores, medidas, fuentes y fondos"],["Cascada y especificidad","Herencia, prioridad y reglas"],["Modelo de caja","Margin, border, padding y content"],["Flexbox","Distribución flexible en una dimensión"],["CSS Grid","Diseños en filas y columnas"],["Responsive design","Media queries y diseño adaptable"],["Transiciones y animaciones","Transform, transition y keyframes"]]},
 javascript:{tag:"JS",title:"Dale lógica e interacción.",description:"JavaScript es un lenguaje de programación que permite crear páginas dinámicas, responder a eventos, manipular el DOM, trabajar con datos y comunicarse con servicios web.",color:"js",topics:[["Variables y constantes","let, const y alcance"],["Tipos de datos","Strings, números, booleanos y más"],["Operadores y condiciones","Expresiones, if, else y switch"],["Bucles","for, while y recorridos"],["Funciones","Parámetros, retorno y funciones flecha"],["Arrays y objetos","Colecciones y estructuras de datos"],["DOM y eventos","Modificar la página y responder al usuario"],["Asincronía y Fetch","Promesas, async/await y APIs"],["Almacenamiento","LocalStorage, SessionStorage e IndexedDB"],["APIs del navegador","Date, Observer, Notifications y otras"]]}
};

function renderHome(){
 pageContent.innerHTML = `<section class="welcome-row"><div><div class="eyebrow"><span class="status-dot"></span> TU ESPACIO DE APRENDIZAJE</div><h1>El desarrollo web,<br><span>en un solo lugar.</span></h1><p class="welcome-copy">Una biblioteca interactiva para aprender HTML, CSS y JavaScript. Explorá conceptos, mirá ejemplos y practicá con tu propio código.</p><div class="welcome-actions"><a class="button button-primary" href="#html">Comenzar a aprender <span>→</span></a><button class="button button-ghost" data-open-editor type="button">⌘ Abrir laboratorio</button></div></div><div class="hero-visual"><div class="visual-glow"></div><div class="code-window"><div class="window-bar"><i></i><i></i><i></i><span>index.html</span></div><div class="code-lines"><p><em>01</em> <span class="code-purple">&lt;main&gt;</span></p><p><em>02</em> &nbsp;&nbsp;<span class="code-blue">&lt;h1&gt;</span>Hola mundo<span class="code-blue">&lt;/h1&gt;</span></p><p><em>03</em> &nbsp;&nbsp;<span class="code-purple">&lt;p&gt;</span>Creá algo increíble.<span class="code-purple">&lt;/p&gt;</span></p><p><em>04</em> <span class="code-purple">&lt;/main&gt;</span></p><p><em>05</em> <span class="code-green">▍</span></p></div><div class="visual-badge">✦ Aprender haciendo</div></div></div></section><section class="section-block"><div class="section-heading"><div><div class="eyebrow">LOS TRES PILARES</div><h2>¿Qué querés aprender?</h2></div></div><div class="language-grid"><a class="language-card html-card" href="#html"><div class="language-top"><span class="language-symbol">5</span><span class="card-arrow">↗</span></div><h3>HTML</h3><p>La estructura de la web. Aprendé a organizar el contenido con etiquetas y elementos.</p><div class="card-tags"><span>Estructura</span><span>Etiquetas</span><span>Semántica</span></div><div class="card-bottom"><span>Explorar HTML</span><b>→</b></div></a><a class="language-card css-card" href="#css"><div class="language-top"><span class="language-symbol">✳</span><span class="card-arrow">↗</span></div><h3>CSS</h3><p>Dale estilo a tus páginas. Dominá diseños, colores, animaciones y diseño adaptable.</p><div class="card-tags"><span>Diseño</span><span>Estilos</span><span>Responsive</span></div><div class="card-bottom"><span>Explorar CSS</span><b>→</b></div></a><a class="language-card js-card" href="#javascript"><div class="language-top"><span class="language-symbol">JS</span><span class="card-arrow">↗</span></div><h3>JavaScript</h3><p>Agregá interacción y lógica. Creá experiencias dinámicas que respondan al usuario.</p><div class="card-tags"><span>Lógica</span><span>Interacción</span><span>APIs</span></div><div class="card-bottom"><span>Explorar JavaScript</span><b>→</b></div></a></div></section><section class="lower-grid"><div class="panel quick-panel"><div class="panel-heading"><div><div class="eyebrow">SEGUÍ EXPLORANDO</div><h2>Accesos rápidos</h2></div></div><a class="quick-link" href="#ejercicios"><span class="quick-icon">✎</span><span><strong>Ejercicios prácticos</strong><small>Comprobá lo que aprendiste</small></span><b>→</b></a><a class="quick-link" href="#proyectos"><span class="quick-icon">▣</span><span><strong>Pequeños proyectos</strong><small>Convertí teoría en práctica</small></span><b>→</b></a><a class="quick-link" href="#favoritos"><span class="quick-icon">☆</span><span><strong>Tus favoritos</strong><small>Guardá conceptos importantes</small></span><b>→</b></a></div><div class="panel lab-panel"><div class="lab-decoration">&lt;/&gt;</div><div class="eyebrow">PRACTICÁ EN TIEMPO REAL</div><h2>Tu laboratorio<br>de código.</h2><p>Probá HTML, CSS y JavaScript en un mismo espacio y mirá el resultado al instante.</p><button class="button button-primary" data-open-editor type="button">Abrir editor →</button></div></section><footer class="footer"><span>WebDev Book · Aprendé construyendo.</span><span>Versión inicial 0.1</span></footer>`;
}

function renderLanguage(key){
 const data=pageData[key];
 pageContent.innerHTML=`<section class="content-hero"><div class="eyebrow">${data.tag} / GUÍA DE APRENDIZAJE</div><h1>${data.title}</h1><p class="welcome-copy">${data.description}</p><div class="welcome-actions"><button class="button button-primary" data-open-editor type="button">Probar en el laboratorio →</button><a class="button button-ghost" href="#inicio">Volver al inicio</a></div></section><section class="section-block"><div class="section-heading"><div><div class="eyebrow">CONTENIDO</div><h2>Explorá los temas</h2></div><span class="section-note">${data.topics.length} temas iniciales</span></div><div class="topic-grid">${data.topics.map((t,i)=>`<article class="topic-card"><span class="topic-number">${String(i+1).padStart(2,"0")}</span><div><h3>${t[0]}</h3><p>${t[1]}</p></div><span class="topic-arrow">→</span></article>`).join("")}</div></section><section class="panel next-panel"><div class="eyebrow">APRENDÉ PRACTICANDO</div><h2>La teoría se entiende mejor con ejemplos.</h2><p class="welcome-copy">El laboratorio te permite escribir código y ver el resultado sin salir de esta página.</p><button class="button button-primary" data-open-editor type="button">Abrir laboratorio →</button></section><footer class="footer"><span>WebDev Book · ${data.tag}</span><span>Contenido en construcción</span></footer>`;
}

function renderSimple(key){
 const info={ejercicios:["Practicá lo que aprendiste.","En esta sección vas a encontrar desafíos para poner a prueba tus conocimientos de HTML, CSS y JavaScript."],proyectos:["Construí tus propias ideas.","Proyectos guiados para combinar HTML, CSS y JavaScript y ganar experiencia creando cosas reales."],favoritos:["Tus conceptos guardados.","Acá aparecerán los temas que marques como favoritos para encontrarlos rápidamente."]}[key];
 pageContent.innerHTML=`<section class="content-hero"><div class="eyebrow">WEBDEV BOOK / ${pageTitles[key].toUpperCase()}</div><h1>${info[0]}</h1><p class="welcome-copy">${info[1]}</p></section><section class="panel next-panel"><div class="eyebrow">PRÓXIMAMENTE</div><h2>Estamos preparando esta sección.</h2><p class="welcome-copy">Primero vamos a construir la biblioteca de HTML, CSS y JavaScript. Después sumaremos contenido práctico y herramientas.</p><a class="button button-primary" href="#inicio">Volver al inicio →</a></section>`;
}

function navigate(key){
 if(!pageTitles[key]) key="inicio";
 breadcrumbCurrent.textContent=pageTitles[key];
 document.querySelectorAll(".nav-link").forEach(a=>a.classList.toggle("active",a.dataset.page===key));
 if(key==="inicio") renderHome(); else if(pageData[key]) renderLanguage(key); else renderSimple(key);
 document.body.classList.remove("menu-open");
 window.scrollTo({top:0,behavior:"smooth"});
}
document.addEventListener("click",e=>{
 const link=e.target.closest("[data-page],a[href^='#']");
 if(link){const key=link.dataset.page||link.getAttribute("href").slice(1);if(pageTitles[key]){e.preventDefault();history.pushState({page:key},"","#"+key);navigate(key);}}
 if(e.target.closest("[data-open-editor]")) openEditor();
});
window.addEventListener("popstate",()=>navigate(location.hash.slice(1)||"inicio"));
navigate(location.hash.slice(1)||"inicio");

const themeToggle=document.getElementById("themeToggle");
function setTheme(light){document.body.classList.toggle("light",light);document.getElementById("themeLabel").textContent=light?"Modo oscuro":"Modo claro";document.getElementById("themeIcon").textContent=light?"☾":"☼";localStorage.setItem("webdev-theme",light?"light":"dark");}
setTheme(localStorage.getItem("webdev-theme")==="light");
themeToggle.addEventListener("click",()=>setTheme(!document.body.classList.contains("light")));
document.getElementById("topThemeToggle").addEventListener("click",()=>setTheme(!document.body.classList.contains("light")));

const mobileMenu=document.getElementById("mobileMenu");
mobileMenu.addEventListener("click",()=>document.body.classList.toggle("menu-open"));
document.getElementById("sidebarBackdrop").addEventListener("click",()=>document.body.classList.remove("menu-open"));

const modal=document.getElementById("editorModal");
function openEditor(){modal.classList.add("open");modal.setAttribute("aria-hidden","false");document.body.style.overflow="hidden";runPreview();}
function closeEditor(){modal.classList.remove("open");modal.setAttribute("aria-hidden","true");document.body.style.overflow="";}
document.getElementById("openEditor").addEventListener("click",openEditor);
document.getElementById("openEditorTop").addEventListener("click",openEditor);
document.getElementById("floatingEditor").addEventListener("click",openEditor);
document.getElementById("closeEditor").addEventListener("click",closeEditor);
modal.addEventListener("click",e=>{if(e.target===modal)closeEditor();});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeEditor();if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();document.getElementById("globalSearch").focus();}});

document.querySelectorAll(".editor-tab").forEach(tab=>tab.addEventListener("click",()=>{
 document.querySelectorAll(".editor-tab").forEach(t=>t.classList.toggle("active",t===tab));
 document.querySelectorAll(".editor-pane").forEach(p=>p.classList.toggle("active",p.dataset.pane===tab.dataset.tab));
}));
const defaults={html:'<h1>¡Hola, mundo!</h1>\n<p>Este es mi primer experimento.</p>\n<button onclick="alert(\'¡Funciona!\')">Hacé clic</button>',css:'body {\n  font-family: Arial, sans-serif;\n  padding: 24px;\n  background: #f0f4ff;\n  color: #172554;\n}\nh1 { color: #4169e1; }',js:'console.log("¡Hola desde JavaScript!");'};
function runPreview(){
 const html=document.getElementById("htmlCode").value;
 const css=document.getElementById("cssCode").value;
 const js=document.getElementById("jsCode").value;
 const safeJs=js.replace(/<\/script/gi,"<\\/script");
 const frame=document.getElementById("previewFrame");
 const output=document.getElementById("consoleText");
 output.textContent="Ejecutando...";
 const doc='<!doctype html><html><head><meta charset="utf-8"><style>'+css.replace(/<\/style/gi,"<\\/style")+'</style></head><body>'+html+'<script>const oldLog=console.log;console.log=(...args)=>{parent.postMessage({type:"webdev-console",args:args.map(x=>{try{return typeof x==="object"?JSON.stringify(x):String(x)}catch(e){return String(x)}})},"*")};window.onerror=(m)=>parent.postMessage({type:"webdev-error",message:String(m)},"*");try{'+safeJs+'}catch(e){parent.postMessage({type:"webdev-error",message:e.message},"*")}<\/script></body></html>';
 frame.srcdoc=doc;
 output.textContent="Vista previa actualizada.";
}
window.addEventListener("message",e=>{if(!e.data||!String(e.data.type).startsWith("webdev-"))return;const out=document.getElementById("consoleText");if(e.data.type==="webdev-console")out.textContent=e.data.args.join(" ");else out.textContent="Error: "+e.data.message;});
document.getElementById("runCode").addEventListener("click",runPreview);
document.getElementById("refreshPreview").addEventListener("click",runPreview);
document.getElementById("resetCode").addEventListener("click",()=>{document.getElementById("htmlCode").value=defaults.html;document.getElementById("cssCode").value=defaults.css;document.getElementById("jsCode").value=defaults.js;runPreview();});

const search=document.getElementById("globalSearch");
const searchable=[...Object.entries(pageData).map(([key,v])=>({key,title:v.tag+" — "+v.title,description:v.description})),{key:"ejercicios",title:"Ejercicios prácticos",description:"Desafíos para practicar"},{key:"proyectos",title:"Proyectos",description:"Proyectos guiados"},{key:"favoritos",title:"Favoritos",description:"Conceptos guardados"}];
search.addEventListener("keydown",e=>{if(e.key==="Enter"){const q=search.value.trim().toLowerCase();if(!q)return;const found=searchable.find(x=>(x.title+" "+x.description).toLowerCase().includes(q));if(found){history.pushState({page:found.key},"","#"+found.key);navigate(found.key);}else{alert("Todavía no encontramos ese concepto. Probá con HTML, CSS, JavaScript, ejercicios o proyectos.");}}});
