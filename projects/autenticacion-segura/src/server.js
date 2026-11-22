import "dotenv/config";
import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import bcrypt from "bcryptjs";
import {z} from "zod";
import {pool} from "./db.js";

const app=express(),PgStore=connectPgSimple(session),port=Number(process.env.PORT||3000);
if(!process.env.SESSION_SECRET||process.env.SESSION_SECRET.length<32)throw new Error("SESSION_SECRET debe tener al menos 32 caracteres.");
app.use(helmet());app.use(express.json({limit:"20kb"}));
app.use(session({store:new PgStore({pool,tableName:"user_sessions",createTableIfMissing:true}),name:"webdev.sid",secret:process.env.SESSION_SECRET,resave:false,saveUninitialized:false,cookie:{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",maxAge:8*60*60*1000}}));
const limiter=rateLimit({windowMs:15*60*1000,limit:10,standardHeaders:"draft-7",legacyHeaders:false});
const registerSchema=z.object({name:z.string().trim().min(2).max(80),email:z.string().trim().email().max(200),password:z.string().min(12).max(200)});
const loginSchema=registerSchema.omit({name:true});
const requireAuth=(req,res,next)=>req.session.userId?next():res.status(401).json({error:"No autenticado."});

app.post("/api/auth/register",limiter,async(req,res,next)=>{
 try{
  const parsed=registerSchema.safeParse(req.body);if(!parsed.success)return res.status(400).json({error:"Datos de registro inválidos."});
  const {name,email,password}=parsed.data,hash=await bcrypt.hash(password,12);
  const result=await pool.query("INSERT INTO users(name,email,password_hash) VALUES($1,LOWER($2),$3) RETURNING id,name,email",[name,email,hash]);
  req.session.userId=result.rows[0].id;res.status(201).json({user:result.rows[0]});
 }catch(error){if(error.code==="23505")return res.status(409).json({error:"No se pudo crear la cuenta con esos datos."});next(error);}
});
app.post("/api/auth/login",limiter,async(req,res,next)=>{
 try{
  const parsed=loginSchema.safeParse(req.body);if(!parsed.success)return res.status(400).json({error:"Credenciales inválidas."});
  const {email,password}=parsed.data,result=await pool.query("SELECT id,name,email,password_hash FROM users WHERE email=LOWER($1)",[email]),user=result.rows[0];
  const valid=user?await bcrypt.compare(password,user.password_hash):false;
  if(!valid)return res.status(401).json({error:"Correo o contraseña incorrectos."});
  req.session.regenerate(error=>{if(error)return next(error);req.session.userId=user.id;res.json({user:{id:user.id,name:user.name,email:user.email}});});
 }catch(error){next(error);}
});
app.get("/api/auth/me",requireAuth,async(req,res,next)=>{
 try{const result=await pool.query("SELECT id,name,email FROM users WHERE id=$1",[req.session.userId]);if(!result.rowCount)return req.session.destroy(()=>res.status(401).json({error:"Sesión inválida."}));res.json({user:result.rows[0]});}catch(error){next(error);}
});
app.post("/api/auth/logout",requireAuth,(req,res)=>req.session.destroy(error=>{if(error)return res.status(500).json({error:"No se pudo cerrar la sesión."});res.clearCookie("webdev.sid",{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production"});res.status(204).end();}));
app.use((error,req,res,next)=>{console.error(error);if(res.headersSent)return next(error);res.status(500).json({error:"Error interno."});});
app.listen(port,()=>console.log("Auth API en http://localhost:"+port));