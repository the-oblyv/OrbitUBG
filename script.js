const autoBlank=false
if(autoBlank && location.protocol!=="about:" && !location.search.includes("noblank")){
  const w=window.open("about:blank","_blank")
  const i=w.document.createElement("iframe")
  i.src=location.href+"?noblank=1"
  i.style.border="none"
  i.style.width="100%"
  i.style.height="100%"
  w.document.body.style.margin="0"
  w.document.body.appendChild(i)
  location.replace("https://classroom.google.com")
}
const menuBtn=document.getElementById("menuBtn")
const menu=document.getElementById("menu")
if(menuBtn){
  menuBtn.onclick=()=>menu.classList.toggle("open")
}

async function loadGames(){
  const res=await fetch("games.json")
  const games=await res.json()
  return games
}

function renderGames(games){
  const grid=document.getElementById("gamesGrid")
  grid.innerHTML=""
  games.forEach(g=>{
    const card=document.createElement("div")
    card.className="card"
    card.onclick=()=>location.href=`p.html?id=${g.id}`
    card.innerHTML=`
      <img class="thumb" src="${g.image}">
      <div class="card-title">${g.name}</div>
    `
    grid.appendChild(card)
  })
}

function filterGames(all,q){
  q=q.toLowerCase()
  return all.filter(g=>g.name.toLowerCase().includes(q))
}

if(document.getElementById("gamesGrid")){
  let all=[]
  loadGames().then(g=>{
    all=g
    renderGames(all)
  })
  const search=document.getElementById("gameSearch")
  search.oninput=()=>{
    renderGames(filterGames(all,search.value))
  }
}

if(document.getElementById("gameFrame")){
  loadGames().then(games=>{
    const id=new URLSearchParams(location.search).get("id")
    const game=games.find(x=>x.id===id)
    if(game){
      document.title=game.name+" - Orbit"
      document.getElementById("gameTitle").textContent=game.name
      document.getElementById("gameFrame").src=game.url
    }
  })
}

const aboutBtn=document.getElementById("aboutBlankBtn")
if(aboutBtn){
  aboutBtn.onclick=()=>{
    const w=window.open("about:blank","_blank")
    const iframe=w.document.createElement("iframe")
    iframe.src=location.href
    iframe.style.border="none"
    iframe.style.width="100%"
    iframe.style.height="100%"
    w.document.body.style.margin="0"
    w.document.body.appendChild(iframe)
  }
}

const proxyPrefix="/scramjet/"

const search=document.getElementById("proxySearch")
if(search){
  search.addEventListener("keydown",e=>{
    if(e.key!=="Enter") return
    let q=search.value.trim()
    if(!q) return

    let url
    if(q.includes(" ") || !q.includes(".")){
      url="https://duckduckgo.com/?q="+encodeURIComponent(q)
    }else{
      if(!q.startsWith("http")) q="https://"+q
      url=q
    }

    location.href=proxyPrefix+encodeURIComponent(url)
  })
}

document.addEventListener("keydown",e=>{
  if(e.key==="`"){
    location.href="https://classroom.google.com"
  }
})

function cloak(title,icon){
  document.title=title
  let link=document.querySelector("link[rel='icon']")
  if(!link){
    link=document.createElement("link")
    link.rel="icon"
    document.head.appendChild(link)
  }
  link.href=icon
}

cloak(
  "Google Classroom",
  "https://ssl.gstatic.com/classroom/favicon.png"
)
