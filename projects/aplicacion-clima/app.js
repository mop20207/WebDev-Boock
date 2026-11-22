// Clima: encadena geocodificación y consulta meteorológica.
const form=document.querySelector("#form"),input=document.querySelector("#city"),status=document.querySelector("#status"),result=document.querySelector("#result");
const descriptions={0:"Despejado",1:"Mayormente despejado",2:"Parcialmente nublado",3:"Nublado",45:"Niebla",51:"Llovizna",61:"Lluvia",63:"Lluvia moderada",65:"Lluvia intensa",71:"Nieve",80:"Chaparrones",95:"Tormenta"};
async function loadWeather(city){
 const query=city.trim();if(!query){status.textContent="Escribí una ciudad.";return;}status.textContent="Buscando ciudad…";result.hidden=true;
 try{
  const geoResponse=await fetch("https://geocoding-api.open-meteo.com/v1/search?name="+encodeURIComponent(query)+"&count=1&language=es&format=json");
  if(!geoResponse.ok)throw new Error("No pudimos buscar la ciudad.");
  const place=(await geoResponse.json()).results?.[0];if(!place)throw new Error("No encontramos esa ciudad.");
  status.textContent="Consultando pronóstico…";
  const url="https://api.open-meteo.com/v1/forecast?latitude="+place.latitude+"&longitude="+place.longitude+"&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code&timezone=auto";
  const response=await fetch(url);if(!response.ok)throw new Error("El servicio meteorológico respondió con un error.");
  const current=(await response.json()).current;result.replaceChildren();
  const name=document.createElement("h2");name.textContent=place.name+", "+(place.admin1||place.country);
  const temp=document.createElement("div");temp.className="temperature";temp.textContent=Math.round(current.temperature_2m)+" °C";
  const condition=document.createElement("p");condition.textContent=descriptions[current.weather_code]||"Condición actual";
  const details=document.createElement("p");details.className="details";details.textContent="Sensación "+Math.round(current.apparent_temperature)+" °C · Humedad "+current.relative_humidity_2m+"% · Viento "+Math.round(current.wind_speed_10m)+" km/h";
  result.append(name,temp,condition,details);result.hidden=false;status.textContent="Actualizado: "+current.time.replace("T"," ");
 }catch(error){status.textContent=error.message||"No se pudo cargar el clima.";}
}
form.addEventListener("submit",event=>{event.preventDefault();loadWeather(input.value);});loadWeather(input.value);