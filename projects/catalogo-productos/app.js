// Productos: combina filtros y mantiene las cantidades del carrito.
const products=[{id:1,name:"Auriculares",category:"Audio",price:24900,icon:"🎧"},{id:2,name:"Teclado mecánico",category:"Accesorios",price:58900,icon:"⌨️"},{id:3,name:"Mouse inalámbrico",category:"Accesorios",price:17900,icon:"🖱️"},{id:4,name:"Parlante portátil",category:"Audio",price:32900,icon:"🔊"},{id:5,name:"Webcam HD",category:"Video",price:41900,icon:"📷"}];
const $=selector=>document.querySelector(selector),cart=new Map();
[...new Set(products.map(p=>p.category))].forEach(category=>{const o=document.createElement("option");o.value=category;o.textContent=category;$("#category").append(o);});
const money=value=>new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0}).format(value);
function render(){
 const q=$("#search").value.toLowerCase(),category=$("#category").value,sort=$("#sort").value;
 const items=products.filter(p=>(!category||p.category===category)&&p.name.toLowerCase().includes(q));
 items.sort((a,b)=>sort==="low"?a.price-b.price:sort==="high"?b.price-a.price:a.name.localeCompare(b.name));
 const root=$("#products");root.replaceChildren();
 items.forEach(p=>{const card=document.createElement("article");card.className="product";const icon=document.createElement("div");icon.className="product-icon";icon.textContent=p.icon;const name=document.createElement("h2");name.textContent=p.name;const price=document.createElement("p");price.textContent=p.category+" · "+money(p.price);const button=document.createElement("button");button.textContent="Agregar";button.addEventListener("click",()=>{cart.set(p.id,(cart.get(p.id)||0)+1);renderCart();});card.append(icon,name,price,button);root.append(card);});
 if(!items.length)root.textContent="No hay productos que coincidan.";
}
function renderCart(){const root=$("#cartItems");root.replaceChildren();let total=0,units=0;for(const [id,quantity] of cart){const p=products.find(x=>x.id===id);total+=p.price*quantity;units+=quantity;const li=document.createElement("li");li.textContent=p.name+" × "+quantity+" — "+money(p.price*quantity);root.append(li);}$("#total").textContent=money(total);$("#status").textContent=units+" unidades en el carrito.";}
$("#search").addEventListener("input",render);$("#category").addEventListener("change",render);$("#sort").addEventListener("change",render);render();renderCart();