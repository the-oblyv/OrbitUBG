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

