import {NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "@/lib/prisma";
const schema=z.object({name:z.string().trim().min(2).max(100),description:z.string().max(500).default(""),status:z.enum(["planned","active","done"]).default("planned")});
export async function GET(){const items=await prisma.project.findMany({orderBy:{createdAt:"desc"}});return NextResponse.json({items});}
export async function POST(request:Request){
 const parsed=schema.safeParse(await request.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:"Datos inválidos."},{status:400});
 const project=await prisma.project.create({data:parsed.data});
 return NextResponse.json(project,{status:201});
}