import {NextResponse} from "next/server";
import {z} from "zod";
import {products} from "@/lib/products";
const schema=z.object({items:z.array(z.object({productId:z.number().int().positive(),quantity:z.number().int().min(1).max(20)})).min(1)});
export async function POST(request:Request){
 const parsed=schema.safeParse(await request.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:"Pedido inválido."},{status:400});
 // El cliente envía IDs y cantidades; el precio siempre se obtiene del catálogo del servidor.
 const lines=parsed.data.items.map(item=>{const p=products.find(product=>product.id===item.productId);return p?{productId:p.id,name:p.name,quantity:item.quantity,unitPriceCents:p.priceCents}:null;});
 if(lines.some(line=>line===null))return NextResponse.json({error:"Producto inexistente."},{status:400});
 const totalCents=lines.reduce((sum,line)=>sum+line!.unitPriceCents*line!.quantity,0);
 // Próximo paso: persistir el pedido con una transacción de base de datos.
 return NextResponse.json({status:"demo-created",totalCents,lines},{status:201});
}