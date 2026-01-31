document.addEventListener("DOMContentLoaded",()=>{
const grid=document.getElementById("moviesGrid")
if(!grid) return

fetch("/movies.json").then(r=>r.json()).then(movies=>{
const render=list=>{
grid.innerHTML=""
list.forEach(m=>{
const c=document.createElement("div")
c.className="card"
c.onclick=()=>location.href="/p?name="+encodeURIComponent(m.name)
c.innerHTML=`<img class="thumb" src="${m.cover}"><div class="card-title">${m.name}</div>`
grid.appendChild(c)
})
}
render(movies)

const s=document.getElementById("movieSearch")
if(s){
s.oninput=()=>render(movies.filter(x=>x.name.toLowerCase().includes(s.value.toLowerCase())))
}
})
})
