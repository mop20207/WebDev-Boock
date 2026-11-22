const users=[{name:"Ana Gómez",email:"ana@example.com",active:true,role:"Admin"},{name:"Bruno Díaz",email:"bruno@example.com",active:true,role:"Editor"},{name:"Carla Ruiz",email:"carla@example.com",active:false,role:"Usuario"},{name:"Diego López",email:"diego@example.com",active:true,role:"Usuario"}];
const rows=document.querySelector("#rows"),search=document.querySelector("#search");
function render(){
 const term=search.value.trim().toLowerCase(),visible=users.filter(u=>(u.name+" "+u.email+" "+u.role).toLowerCase().includes(term));rows.replaceChildren();
 visible.forEach(user=>{const tr=document.createElement("tr");[user.name,user.email,user.active?"Activo":"Inactivo",user.role].forEach(value=>{const td=document.createElement("td");td.textContent=value;tr.append(td);});rows.append(tr);});
 document.querySelector("#total").textContent=users.length;
 document.querySelector("#active").textContent=users.filter(u=>u.active).length;
 document.querySelector("#admins").textContent=users.filter(u=>u.role==="Admin").length;
 if(!visible.length){const tr=document.createElement("tr"),td=document.createElement("td");td.colSpan=4;td.textContent="Sin resultados.";tr.append(td);rows.append(tr);}
}
search.addEventListener("input",render);render();