const button=document.querySelector("#toggle");
const details=document.querySelector("#details");
const status=document.querySelector("#status");
// Sincronizamos el estado visible con aria-expanded.
button.addEventListener("click",()=>{
  const opened=button.getAttribute("aria-expanded")==="true";
  button.setAttribute("aria-expanded",String(!opened));
  details.hidden=opened;
  button.textContent=opened?"Ver más información":"Ver menos información";
  status.textContent=opened?"Detalles ocultos.":"Detalles visibles.";
});