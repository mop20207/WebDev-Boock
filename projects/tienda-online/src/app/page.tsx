"use client";
import {useMemo,useState} from "react";
import {products} from "@/lib/products";
export default function StorePage(){
 const [cart,setCart]=useState<Record<number,number>>({});
 const total=useMemo(()=>products.reduce((sum,p)=>sum+p.priceCents*(cart[p.id]||0),0),[cart]);
 const add=(id:number)=>setCart(current=>({...current,[id]:(current[id]||0)+1}));
 async function checkout(){
  const items=Object.entries(cart).filter(([,quantity])=>quantity>0).map(([productId,quantity])=>({productId:Number(productId),quantity}));
  const response=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({items})});
  const data=await response.json();alert(response.ok?"Pedido demo creado. Total: "+(data.totalCents/100).toFixed(2):data.error);
 }
 return <main style={{maxWidth:900,margin:"40px auto",padding:20}}>
  <h1>Tienda online</h1><p>Catálogo y carrito de demostración. No procesa pagos.</p>
  <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:16}}>
   {products.map(product=><article key={product.id} style={{padding:18,background:"white",borderRadius:12}}>
    <h2>{product.name}</h2><p>{product.description}</p><strong>{(product.priceCents/100).toFixed(2)}</strong>
    <p><button onClick={()=>add(product.id)}>Agregar · {cart[product.id]||0}</button></p>
   </article>)}
  </section>
  <h2>Total: {(total/100).toFixed(2)}</h2><button disabled={!total} onClick={checkout}>Crear pedido de prueba</button>
 </main>;
}