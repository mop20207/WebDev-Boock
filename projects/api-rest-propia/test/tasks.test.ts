import test from "node:test";
import assert from "node:assert/strict";
import {z} from "zod";
const schema=z.object({title:z.string().trim().min(2).max(120)});
test("acepta título válido",()=>assert.equal(schema.safeParse({title:"Estudiar JS"}).success,true));
test("rechaza título vacío",()=>assert.equal(schema.safeParse({title:" "} ).success,false));
test("rechaza título largo",()=>assert.equal(schema.safeParse({title:"x".repeat(121)}).success,false));