const catalogue=[
 {title:"Interestelar",genre:"Ciencia ficción",year:2014,rating:8.7,icon:"✦",description:"Un viaje espacial para buscar un futuro."},
 {title:"El viaje de Chihiro",genre:"Fantasía",year:2001,rating:8.6,icon:"❋",description:"Una niña descubre un mundo de espíritus."},
 {title:"El secreto de sus ojos",genre:"Drama",year:2009,rating:8.2,icon:"◉",description:"Una investigación sigue abierta durante décadas."},
 {title:"Mad Max: Fury Road",genre:"Acción",year:2015,rating:8.1,icon:"⚡",description:"Una huida por un desierto postapocalíptico."},
 {title:"Arrival",genre:"Ciencia ficción",year:2016,rating:7.9,icon:"◎",description:"Una lingüista intenta comunicarse con visitantes."},
 {title:"Coco",genre:"Animación",year:2017,rating:8.4,icon:"♫",description:"Un niño descubre la historia de su familia."}
];
const search=document.querySelector("#search"),genre=document.querySelector("#genre"),grid=document.querySelector("#movies");
[...new Set(catalogue.map(m=>m.genre))].sort().forEach(value=>{const option=document.createElement("option");option.value=value;option.textContent=value;genre.append(option);});
function render(){
 const q=search.value.trim().toLocaleLowerCase("es");
 const items=catalogue.filter(m=>(!genre.value||m.genre===genre.value)&&m.title.toLocaleLowerCase("es").includes(q));
 grid.replaceChildren();
 items.forEach(movie=>{
  const card=document.createElement("article");card.className="movie";
  const poster=document.createElement("div");poster.className="poster";poster.textContent=movie.icon;poster.setAttribute("aria-hidden","true");
  const title=document.createElement("h2");title.textContent=movie.title;
  const info=document.createElement("p");info.textContent=movie.genre+" · "+movie.year;
  const rating=document.createElement("p");rating.className="rating";rating.textContent="★ "+movie.rating+"/10";
  const description=document.createElement("p");description.textContent=movie.description;
  card.append(poster,title,info,rating,description);grid.append(card);
 });
 document.querySelector("#count").textContent=items.length+" de "+catalogue.length+" películas";
 if(!items.length){const empty=document.createElement("p");empty.textContent="No encontramos resultados.";grid.append(empty);}
}
search.addEventListener("input",render);genre.addEventListener("change",render);render();