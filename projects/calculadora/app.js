// Calculadora: conserva operando, operador y valor actual como estado.
const display=document.querySelector("#display"),message=document.querySelector("#message");
let current="0",stored=null,operator=null,replaceNext=false;
function paint(){display.textContent=current;}
function digit(value){if(replaceNext){current=value;replaceNext=false;}else if(current==="0")current=value;else if(current.length<14)current+=value;paint();}
function calculate(){
 if(operator===null||stored===null)return;
 const a=stored,b=Number(current);let result;
 if(operator==="+")result=a+b;
 if(operator==="-")result=a-b;
 if(operator==="*")result=a*b;
 if(operator==="/"){if(b===0){message.textContent="No se puede dividir por cero.";return;}result=a/b;}
 current=String(Number(result.toPrecision(12)));stored=null;operator=null;replaceNext=true;paint();
}
document.querySelector(".keys").addEventListener("click",event=>{
 const button=event.target.closest("button");if(!button)return;message.textContent="";
 if(button.dataset.digit){digit(button.dataset.digit);return;}
 const action=button.dataset.action;
 if(action==="clear"){current="0";stored=null;operator=null;replaceNext=false;paint();return;}
 if(action==="decimal"){if(replaceNext){current="0";replaceNext=false;}if(!current.includes("."))current+=".";paint();return;}
 if(action==="sign"){current=String(Number(current)*-1);paint();return;}
 if(action==="percent"){current=String(Number(current)/100);paint();return;}
 if(action==="equals"){calculate();return;}
 if(button.dataset.op){if(operator!==null)calculate();stored=Number(current);operator=button.dataset.op;replaceNext=true;}
});
paint();