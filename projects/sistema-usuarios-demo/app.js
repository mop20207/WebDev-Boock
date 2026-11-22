// Usuarios demo: administra perfiles locales; no implementa autenticación real.
const KEY="webdev-project-users-demo-v1",list=document.querySelector("#users"),status=document.querySelector("#status");
let users=load();
function load(){try{const data=JSON.parse(localStorage.getItem(KEY)||"[]");return Array.isArray(data)?data:[];}catch{return [];}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(users));}catch{status.textContent="No se pudo guardar en este navegador.";}}
function render(){
 const q=document.querySelector("#search").value.trim().toLowerCase();list.replaceChildren();
 users.filter(u=>(u.name+" "+u.email).toLowerCase().includes(q)).forEach(user=>{
  const li=document.createElement("li"),person=document.createElement("div");person.className="person";
  const name=document.createElement("strong");name.textContent=user.name;const email=document.createElement("small");email.textContent=user.email;person.append(name,email);
  const role=document.createElement("select");role.setAttribute("aria-label","Rol de "+user.name);
  ["Usuario","Editor","Administrador"].forEach(value=>{const option=document.createElement("option");option.textContent=value;option.selected=value===user.role;role.append(option);});
  role.addEventListener("change",()=>{user.role=role.value;save();});
  const remove=document.createElement("button");remove.type="button";remove.textContent="Eliminar";remove.addEventListener("click",()=>{users=users.filter(u=>u.id!==user.id);save();render();});
  li.append(person,role,remove);list.append(li);
 });
 status.textContent=users.length+" perfiles guardados localmente.";
 if(!list.children.length)list.textContent="No hay usuarios para mostrar.";
}
document.querySelector("#form").addEventListener("submit",event=>{event.preventDefault();const name=document.querySelector("#name").value.trim(),email=document.querySelector("#email").value.trim().toLowerCase(),role=document.querySelector("#role").value;if(users.some(u=>u.email===email)){status.textContent="Ese correo ya existe.";return;}users.push({id:Date.now(),name,email,role});save();event.target.reset();render();});
document.querySelector("#search").addEventListener("input",render);render();