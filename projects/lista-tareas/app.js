// Lista de tareas: modifica el arreglo, persiste y vuelve a renderizar.
const STORAGE="webdev-project-todo-v1",list=document.querySelector("#taskList"),summary=document.querySelector("#summary");
let filter="all",tasks=read();
function read(){try{const saved=JSON.parse(localStorage.getItem(STORAGE)||"[]");return Array.isArray(saved)?saved:[];}catch{return [];}}
function save(){try{localStorage.setItem(STORAGE,JSON.stringify(tasks));}catch{summary.textContent="Almacenamiento no disponible.";}}
function render(){
 list.replaceChildren();
 tasks.filter(t=>filter==="all"||(filter==="active"&&!t.done)||(filter==="done"&&t.done)).forEach(task=>{
  const li=document.createElement("li");li.classList.toggle("done",task.done);
  const check=document.createElement("input");check.type="checkbox";check.checked=task.done;check.setAttribute("aria-label","Completar "+task.text);
  check.addEventListener("change",()=>{task.done=check.checked;save();render();});
  const text=document.createElement("span");text.textContent=task.text;
  const remove=document.createElement("button");remove.type="button";remove.textContent="Eliminar";remove.addEventListener("click",()=>{tasks=tasks.filter(t=>t.id!==task.id);save();render();});
  li.append(check,text,remove);list.append(li);
 });
 summary.textContent=tasks.filter(t=>!t.done).length+" pendientes · "+tasks.length+" en total";
 if(!list.children.length){const empty=document.createElement("li");empty.textContent="No hay tareas en esta vista.";list.append(empty);}
}
document.querySelector("#taskForm").addEventListener("submit",event=>{event.preventDefault();const input=document.querySelector("#taskInput"),text=input.value.trim();if(!text)return;tasks.unshift({id:Date.now(),text,done:false});input.value="";save();render();input.focus();});
document.querySelector(".filters").addEventListener("click",event=>{const button=event.target.closest("[data-filter]");if(!button)return;filter=button.dataset.filter;document.querySelectorAll("[data-filter]").forEach(b=>b.setAttribute("aria-pressed",String(b===button)));render();});
document.querySelector("#clearDone").addEventListener("click",()=>{tasks=tasks.filter(t=>!t.done);save();render();});render();