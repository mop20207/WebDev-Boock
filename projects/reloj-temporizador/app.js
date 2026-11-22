const time=document.querySelector("#time"),date=document.querySelector("#date"),watch=document.querySelector("#watch"),countdown=document.querySelector("#countdown");
let elapsed=0,started=0,watchTimer=null,countTimer=null,remaining=30;
function updateClock(){const now=new Date();time.textContent=new Intl.DateTimeFormat("es-AR",{hour:"2-digit",minute:"2-digit",second:"2-digit"}).format(now);date.textContent=new Intl.DateTimeFormat("es-AR",{dateStyle:"full"}).format(now);}
function format(ms){const n=Math.floor(ms/1000);return String(Math.floor(n/60)).padStart(2,"0")+":"+String(n%60).padStart(2,"0")+"."+Math.floor(ms/100)%10;}
function drawWatch(){watch.textContent=format(elapsed+(started?performance.now()-started:0));}
document.querySelector("#start").addEventListener("click",()=>{if(started)return;started=performance.now();watchTimer=setInterval(drawWatch,100);});
document.querySelector("#stop").addEventListener("click",()=>{if(!started)return;elapsed+=performance.now()-started;started=0;clearInterval(watchTimer);drawWatch();});
document.querySelector("#reset").addEventListener("click",()=>{elapsed=0;started=0;clearInterval(watchTimer);drawWatch();});
function drawCountdown(){countdown.textContent=String(Math.floor(remaining/60)).padStart(2,"0")+":"+String(remaining%60).padStart(2,"0");}
document.querySelector("#countStart").addEventListener("click",()=>{clearInterval(countTimer);const seconds=Number(document.querySelector("#seconds").value);const notice=document.querySelector("#notice");if(!Number.isInteger(seconds)||seconds<1||seconds>3600){notice.textContent="Elegí entre 1 y 3600 segundos.";return;}remaining=seconds;drawCountdown();notice.textContent="Cuenta en marcha.";countTimer=setInterval(()=>{remaining--;drawCountdown();if(remaining<=0){clearInterval(countTimer);notice.textContent="¡Tiempo cumplido!";}},1000);});
updateClock();drawWatch();drawCountdown();setInterval(updateClock,1000);