// Formulario: valida entradas y comunica errores junto a cada campo.
const form=document.querySelector("#form");
const fields=["name","email","message"];
function showError(id,message){
  const input=document.getElementById(id);
  document.getElementById(id+"Error").textContent=message;
  input.classList.toggle("invalid",Boolean(message));
  input.setAttribute("aria-invalid",String(Boolean(message)));
}
function validate(){
  const name=form.elements.name.value.trim();
  const email=form.elements.email.value.trim();
  const message=form.elements.message.value.trim();
  showError("name",name.length<2?"Ingresá al menos 2 caracteres.":"");
  showError("email",/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)?"":"Ingresá un correo válido.");
  showError("message",message.length<10?"El mensaje necesita al menos 10 caracteres.":"");
  return fields.every(id=>!document.getElementById(id+"Error").textContent);
}
form.addEventListener("submit",event=>{
  event.preventDefault();
  document.querySelector("#result").textContent=validate()?"¡Datos válidos! Esta demo no envía información.":"Revisá los campos marcados.";
});