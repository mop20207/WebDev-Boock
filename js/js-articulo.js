document.addEventListener("DOMContentLoaded", async () => {
 const params=new URLSearchParams(location.search),categoryId=params.get("tema"),itemIndex=Number(params.get("item"));
 const title=document.getElementById("articleTitle"),lead=document.getElementById("articleLead"),body=document.getElementById("articleBody");
 const categoryURL="js-categoria.html?tema="+encodeURIComponent(categoryId||"");
 const make=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el};
 const back=()=>["backToCategory","footerBack"].forEach(id=>{const a=document.getElementById(id);if(a)a.href=categoryURL});
 try{
  const response=await fetch("../data/js-articulos.json");if(!response.ok)throw Error("No se pudo cargar el catálogo de artículos.");
  const db=await response.json(),article=db.articles.find(a=>a.categoryId===categoryId&&a.id===categoryId+"-"+itemIndex);
  if(!article){title.textContent="Tema no encontrado";lead.textContent="Volvé a la categoría y elegí un tema disponible.";body.replaceChildren(make("p","article-error","No encontramos el contenido solicitado."));back();return}
  document.title=article.title+" | JavaScript | WebDev Book";title.textContent=article.title;lead.textContent=article.summary;
  const crumb=document.getElementById("categoryCrumb");crumb.textContent=article.categoryTitle;crumb.href=categoryURL;document.getElementById("articleCrumb").textContent=article.title;back();
  const frag=document.createDocumentFragment();
  const codeBlock=(code,lang="javascript")=>{const pre=make("pre","article-code"),node=make("code","language-"+lang,code);pre.append(node);return pre};
  const sectionIcon=(kind)=> {
   const paths={
    warning:'<path d="M12 3 2.8 19h18.4L12 3Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M12 9v4.5m0 2.5h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    check:'<path d="M12 2.8a9.2 9.2 0 1 0 0 18.4 9.2 9.2 0 0 0 0-18.4Z" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="m7.5 12.2 3 3 6-6.3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    target:'<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>'
   };
   const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");svg.setAttribute("viewBox","0 0 24 24");svg.setAttribute("aria-hidden","true");svg.innerHTML=paths[kind]||paths.check;return svg;
  };
  const renderListSection=(box,items,kind)=>{
   const list=make("ul","article-list icon-list "+kind);
   items.forEach((item,index)=>{const li=make("li","icon-list-item");const icon=sectionIcon(kind==="error-list"?"warning":kind==="goal-list"?"target":"check");const copy=make("span","icon-list-copy",item);li.append(icon,copy);list.append(li)});
   box.append(list);
  };
  const copyButtons=root=>root.querySelectorAll("pre.article-code").forEach(pre=>{const bar=make("div","code-toolbar"),label=make("span","code-language","JAVASCRIPT"),btn=make("button","code-copy","Copiar código");btn.type="button";btn.addEventListener("click",async()=>{const text=pre.querySelector("code").textContent;try{await navigator.clipboard.writeText(text);btn.textContent="¡Copiado!"}catch{btn.textContent="No se pudo copiar"}setTimeout(()=>btn.textContent="Copiar código",1500)});bar.append(label,btn);pre.before(bar)});
  article.sections.forEach(section=>{
   const box=make("section","article-section");
   const isErrors=section.title.toLowerCase().includes("errores frecuentes");
   const isPractices=section.title.toLowerCase().includes("buenas prácticas");
   if(isErrors)box.classList.add("article-errors");
   if(isPractices)box.classList.add("article-practices");
   box.append(make("h2","",section.title));
   if(section.body)box.append(make("p","article-paragraph",section.body));
   if(section.code)box.append(codeBlock(section.code,section.language));
   if(section.list)renderListSection(box,section.list,isErrors?"error-list":isPractices?"practice-list":"");
   frag.append(box);
  });
  const learning=article.learning;
  const goals=make("section","article-section article-goals");goals.append(make("h2","","Qué vas a aprender"));renderListSection(goals,learning.goals,"goal-list");goals.append(make("p","article-note","Nivel sugerido: "+learning.level+" · Tiempo estimado: "+learning.estimatedMinutes+" minutos"));frag.append(goals);
  const examples=make("section","article-section");examples.append(make("h2","","Ejemplos para estudiar"));learning.exampleVariants.forEach(v=>{const details=make("details","example-details");details.append(make("summary","",v.title),make("p","article-paragraph",v.description),codeBlock(v.code));examples.append(details)});frag.append(examples);
  const lab=learning.lab,labSection=make("section","article-section");labSection.append(make("h2","",lab.title),make("p","article-paragraph",lab.instructions));
  const grid=make("div","lab-grid"),edit=make("div","lab-editor-panel"),previewPanel=make("div","lab-preview-panel");
  const field=(label,value,cls)=>{edit.append(make("label","lab-label",label));const ta=make("textarea","lab-editor "+cls);ta.value=value;ta.spellcheck=false;ta.wrap="off";edit.append(ta);return ta};
  const html=field("HTML de la demostración",lab.html,"lab-html"),css=field("CSS editable",lab.css,"lab-css"),js=field("JavaScript editable",lab.js,"lab-js");
  const actions=make("div","lab-actions"),run=make("button","lab-run","▶ Ejecutar"),reset=make("button","lab-reset","Restablecer");run.type=reset.type="button";actions.append(run,reset);edit.append(actions);
  previewPanel.append(make("span","lab-label","Resultado en vivo"));const frame=make("iframe","lab-preview");frame.title="Vista previa del laboratorio JavaScript";frame.setAttribute("sandbox","allow-scripts allow-same-origin");previewPanel.append(frame);grid.append(edit,previewPanel);labSection.append(grid);
  const execute=()=>{const safeJs=js.value.replace(/<\/script/gi,"<\\/script");frame.srcdoc="<!doctype html><html lang='es'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><style>"+css.value.replace(/<\/style/gi,"<\\/style")+"</style></head><body>"+html.value+"<script>try{"+safeJs+"}catch(error){document.body.insertAdjacentHTML('beforeend','<pre style=\"color:#b42318\">'+String(error).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))+'</pre>')}<\\/script></body></html>"};
  run.addEventListener("click",execute);reset.addEventListener("click",()=>{html.value=lab.starterHtml;css.value=lab.starterCss;js.value=lab.starterJs;execute()});execute();frag.append(labSection);
  const challenge=make("section","article-section");challenge.append(make("h2","",learning.challenge.title),make("p","article-paragraph",learning.challenge.prompt));const hints=make("details","challenge-hints");hints.append(make("summary","","Ver pistas"));const hintList=make("ul","article-list");learning.challenge.hints.forEach(h=>hintList.append(make("li","",h)));hints.append(hintList);const solution=make("details","challenge-solution");solution.append(make("summary","","Consultar una posible solución"),codeBlock(learning.challenge.solution));challenge.append(hints,solution);frag.append(challenge);
  const quiz=make("section","article-section");quiz.append(make("h2","","Comprobá lo que aprendiste"),make("p","article-paragraph",learning.quiz.question));const form=make("form","quiz-form"),feedback=make("p","quiz-feedback");feedback.setAttribute("aria-live","polite");learning.quiz.options.forEach((option,i)=>{const label=make("label","quiz-option"),input=make("input");input.type="radio";input.name="js-answer";input.value=String(i);input.required=true;label.append(input,make("span","",option));form.append(label)});const submit=make("button","lab-run","Comprobar respuesta");submit.type="submit";form.append(submit);form.addEventListener("submit",e=>{e.preventDefault();const selected=form.querySelector('input:checked');const ok=selected&&Number(selected.value)===learning.quiz.correct;feedback.textContent=(ok?"¡Correcto! ":"Todavía no. ")+learning.quiz.explanation;feedback.className="quiz-feedback "+(ok?"is-correct":"is-wrong")});quiz.append(form,feedback);frag.append(quiz);
  const resources=make("section","article-section article-resources");resources.append(make("h2","","Documentación oficial y recursos"));const ul=make("ul","article-list");article.resources.forEach(url=>{const li=make("li"),a=make("a","",url.includes("Guide")?"Guía de JavaScript en MDN":"Referencia de JavaScript en MDN");a.href=url;a.target="_blank";a.rel="noopener noreferrer";li.append(a);ul.append(li)});resources.append(ul);frag.append(resources);
  body.replaceChildren(frag);copyButtons(body);if(window.Prism)Prism.highlightAllUnder(body);
 }catch(error){title.textContent="No se pudo cargar el artículo";lead.textContent="Comprobá tu conexión y volvé a intentarlo.";body.replaceChildren(make("p","article-error",error.message));console.error(error)}
});