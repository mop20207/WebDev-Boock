/* Descarga y administración de laboratorios independientes. */
(() => {
  "use strict";
  const DB_NAME="webdev-book-modules", DB_VERSION=1;
  const FILES="files", MODULES="modules";
  const ROOT=new URL("../",document.baseURI);
  const REMOTE="https://raw.githubusercontent.com/mop20207/WebDev-Boock/main/";
  const MANIFEST="modules/labs/manifest.json";
  const CATALOG="modules/labs/catalog.json";
  const inflight=new Map();
  let dbPromise, manifestPromise, catalogPromise;
  const native=()=>Boolean(window.Capacitor?.isNativePlatform?.());
  const key=id=>"lab:"+id;
  const safe=id=>typeof id==="string"&&/^[a-z0-9-]+$/.test(id);
  const local=path=>new URL(path,ROOT).href;
  const remote=path=>new URL(path,REMOTE).href;

  function openDB(){
    if(dbPromise)return dbPromise;
    dbPromise=new Promise((resolve,reject)=>{
      if(!("indexedDB" in window)){reject(new Error("Este dispositivo no ofrece IndexedDB."));return;}
      const req=indexedDB.open(DB_NAME,DB_VERSION);
      req.onupgradeneeded=()=>{
        const db=req.result;
        if(!db.objectStoreNames.contains(FILES))db.createObjectStore(FILES,{keyPath:"path"});
        if(!db.objectStoreNames.contains(MODULES))db.createObjectStore(MODULES,{keyPath:"id"});
        if(!db.objectStoreNames.contains("meta"))db.createObjectStore("meta",{keyPath:"key"});
        if(!db.objectStoreNames.contains("preferences"))db.createObjectStore("preferences",{keyPath:"id"});
      };
      req.onsuccess=()=>{req.result.onversionchange=()=>req.result.close();resolve(req.result);};
      req.onerror=()=>reject(req.error||new Error("No se pudo abrir el almacenamiento de laboratorios."));
      req.onblocked=()=>reject(new Error("Cerrá otras pantallas de WebDev Book y reintentá."));
    });
    return dbPromise;
  }
  const requestValue=req=>new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result??null);req.onerror=()=>reject(req.error||new Error("Falló la lectura local."));});
  const txDone=tx=>new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||new Error("Falló la transacción."));tx.onabort=()=>reject(tx.error||new Error("La transacción se canceló."));});
  async function record(store,keyValue){const db=await openDB(),tx=db.transaction(store,"readonly"),done=txDone(tx),value=await requestValue(tx.objectStore(store).get(keyValue));await done;return value;}
  function bytesToHex(buffer){return Array.from(new Uint8Array(buffer),b=>b.toString(16).padStart(2,"0")).join("");}
  async function sha(bytes){if(!crypto.subtle)throw new Error("No se puede verificar SHA-256 en este entorno.");return bytesToHex(await crypto.subtle.digest("SHA-256",bytes));}
  async function fetchJson(path){
    const urls=native()?[remote(path),local(path)]:[local(path)];
    let last;
    for(const url of urls){try{const res=await fetch(url,{cache:"no-store",headers:{Accept:"application/json"}});if(!res.ok)throw new Error("HTTP "+res.status);return await res.json();}catch(e){last=e;}}
    throw last||new Error("No se pudo descargar "+path);
  }
  async function getManifest(){
    if(!manifestPromise)manifestPromise=(async()=>{
      const m=await fetchJson(MANIFEST);
      if(m.schemaVersion!==1||!Array.isArray(m.packages)||!/^[a-f0-9]{64}$/i.test(m.manifestVersion||""))throw new Error("Manifiesto de laboratorios inválido.");
      const ids=new Set();
      for(const p of m.packages){if(!safe(p.id)||ids.has(p.id)||p.path!=="modules/labs/packages/"+p.id+".json"||!/^[a-f0-9]{64}$/i.test(p.sha256||"")||!Number.isInteger(p.sizeBytes)||p.sizeBytes<1||p.sizeBytes>8*1024*1024||!Number.isInteger(p.challengeCount)||p.challengeCount<1)throw new Error("Metadatos inválidos para "+p.id);ids.add(p.id);}
      const canonical=m.packages.map(p=>({id:p.id,path:p.path,version:p.version,sha256:p.sha256,sizeBytes:p.sizeBytes,challengeCount:p.challengeCount}));
      if(await sha(new TextEncoder().encode(JSON.stringify(canonical)))!==m.manifestVersion)throw new Error("La huella del manifiesto de laboratorios no coincide.");
      return m;
    })().catch(e=>{manifestPromise=null;throw e;});
    return manifestPromise;
  }
  async function getCatalog(){
    if(!catalogPromise)catalogPromise=fetchJson(CATALOG).then(c=>{if(c.schemaVersion!==1||!Array.isArray(c.labs))throw new Error("Catálogo de laboratorios inválido.");return c;}).catch(e=>{catalogPromise=null;throw e;});
    return catalogPromise;
  }
  function validate(pack,entry){
    if(!pack||pack.schemaVersion!==1||pack.id!==entry.id||!Array.isArray(pack.challenges)||pack.challenges.length!==entry.challengeCount)throw new Error("El paquete no coincide con el manifiesto.");
    const ids=new Set();
    for(const c of pack.challenges){if(!c||typeof c.id!=="string"||ids.has(c.id)||!Array.isArray(c.tests)||!c.tests.length||(!c.starterCode&&!c.htmlCode))throw new Error("El laboratorio contiene un reto inválido.");ids.add(c.id);}
    return pack;
  }
  async function status(id){
    const m=await getManifest(),entry=m.packages.find(p=>p.id===id);
    if(!entry)return{state:"unavailable",entry:null};
    const [installed,file]=await Promise.all([record(MODULES,id).catch(()=>null),record(FILES,key(id)).catch(()=>null)]);
    if(!installed||!file||typeof file.content!=="string")return{state:"missing",entry,installed:null};
    const localHash=await sha(new TextEncoder().encode(file.content)).catch(()=>null);
    if(localHash!==installed.sha256||localHash!==file.sha256)return{state:"corrupt",entry,installed};
    return{state:installed.sha256===entry.sha256?"installed":"update",entry,installed};
  }
  async function readResponse(response,expectedBytes,onProgress){
    if(!response.body?.getReader){
      const data=new Uint8Array(await response.arrayBuffer());
      onProgress?.({loaded:data.byteLength,total:expectedBytes,percent:100});
      return data;
    }
    const reader=response.body.getReader(),chunks=[];let total=0;
    try{while(true){const {done,value}=await reader.read();if(done)break;chunks.push(value);total+=value.byteLength;onProgress?.({loaded:total,total:expectedBytes,percent:expectedBytes?Math.min(99,Math.floor(total/expectedBytes*100)):0});}}
    catch(error){try{await reader.cancel();}catch{}throw error;}
    const data=new Uint8Array(total);let offset=0;for(const chunk of chunks){data.set(chunk,offset);offset+=chunk.byteLength;}
    onProgress?.({loaded:total,total:expectedBytes,percent:100});return data;
  }
  async function download(id,options={}){
    if(!safe(id))throw new Error("ID de laboratorio inválido.");
    if(inflight.has(id))return inflight.get(id);
    const task=(async()=>{
      const m=await getManifest(),entry=m.packages.find(p=>p.id===id);
      if(!entry)throw new Error("No existe el laboratorio solicitado.");
      const old=await record(MODULES,id).catch(()=>null);
      const urls=native()?[remote(entry.path),local(entry.path)]:[local(entry.path)];
      let response,last;
      for(const url of urls){try{response=await fetch(url,{cache:"no-store",headers:{Accept:"application/json"}});if(!response.ok)throw new Error("HTTP "+response.status);break;}catch(e){last=e;}}
      if(!response||!response.ok)throw last||new Error("No se pudo descargar el laboratorio.");
      const buffer=await readResponse(response,entry.sizeBytes,options.onProgress);
      if(buffer.byteLength!==entry.sizeBytes)throw new Error("El tamaño descargado no coincide; no se instaló el laboratorio.");
      if(await sha(buffer)!==entry.sha256)throw new Error("Falló la verificación SHA-256; se conservó la versión anterior.");
      const content=new TextDecoder("utf-8",{fatal:true}).decode(buffer);
      let pack;try{pack=JSON.parse(content);}catch{throw new Error("El paquete no contiene JSON válido.");}
      validate(pack,entry);
      const db=await openDB();
      await new Promise((resolve,reject)=>{
        const tx=db.transaction([FILES,MODULES],"readwrite");
        tx.objectStore(FILES).put({path:key(id),content,sha256:entry.sha256,version:entry.version,updatedAt:new Date().toISOString()});
        tx.objectStore(MODULES).put({id,kind:"lab",title:pack.title||id,version:entry.version,sha256:entry.sha256,sizeBytes:entry.sizeBytes,challengeCount:entry.challengeCount,installedAt:old?.installedAt||new Date().toISOString(),updatedAt:new Date().toISOString()});
        tx.oncomplete=resolve;
        tx.onerror=()=>reject(tx.error||new Error("No se pudo guardar el laboratorio."));
        tx.onabort=()=>reject(tx.error?.name==="QuotaExceededError"?new Error("No hay espacio suficiente. La versión anterior sigue intacta."):tx.error||new Error("Se canceló la instalación."));
      });
      window.dispatchEvent(new CustomEvent("webdev:labs-changed",{detail:{id,status:"installed"}}));
      return pack;
    })().finally(()=>inflight.delete(id));
    inflight.set(id,task);return task;
  }
  async function getLab(id){
    const st=await status(id);
    if(st.state==="missing")throw new Error("Este laboratorio todavía no está instalado. Volvé al Centro de laboratorios para descargarlo.");
    if(st.state==="corrupt")throw new Error("La copia local de este laboratorio no superó la verificación de integridad. Volvé al Centro de laboratorios y reinstalalo.");
    const file=await record(FILES,key(id));
    const localHash=await sha(new TextEncoder().encode(file.content));
    if(localHash!==file.sha256||localHash!==st.installed.sha256)throw new Error("La integridad del laboratorio cambió. Se bloqueó su ejecución.");
    const pack=JSON.parse(file.content);
    return validate(pack,{...st.entry,challengeCount:st.installed.challengeCount||st.entry.challengeCount});
  }
  async function remove(id){
    const st=await status(id);if(!st.entry)throw new Error("Laboratorio desconocido.");
    const db=await openDB();
    await new Promise((resolve,reject)=>{
      const tx=db.transaction([FILES,MODULES],"readwrite");
      tx.objectStore(FILES).delete(key(id));tx.objectStore(MODULES).delete(id);
      tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||new Error("No se pudo quitar el laboratorio."));tx.onabort=()=>reject(tx.error||new Error("Se canceló la eliminación."));
    });
    window.dispatchEvent(new CustomEvent("webdev:labs-changed",{detail:{id,status:"missing"}}));
  }
  async function listInstalled(){const db=await openDB(),tx=db.transaction(MODULES,"readonly"),done=txDone(tx),items=await requestValue(tx.objectStore(MODULES).getAll());await done;return items.filter(x=>x?.kind==="lab");}
  window.WebDevLabs=Object.freeze({getManifest,getCatalog,getStatus:status,download,getLab,remove,listInstalled});
})();