const SCRAMJET_PREFIX="/scramjet/"
const SETTINGS_KEY="orbitSettings"

const defaultSettings={
  autoBlank:false,
  cloak:true,
  panic:true,
  proxy:true
}

function getSettings(){
  const s=localStorage.getItem(SETTINGS_KEY)
  return s?JSON.parse(s):defaultSettings
}

function saveSettings(s){
  localStorage.setItem(SETTINGS_KEY,JSON.stringify(s))
}

const settings=getSettings()

const menuBtn=document.getElementById("menuBtn")
const menu=document.getElementById("menu")
if(menuBtn){
  menuBtn.onclick=()=>menu.classList.toggle("open")
}

if(settings.cloak){
  const cloakTitle="Google Classroom"
  const cloakIcon="https://ssl.gstatic.com/classroom/favicon.png"
  const apply=()=>{
    document.title=cloakTitle
    let icon=document.querySelector("link[rel='icon']")
    if(!icon){
      icon=document.createElement("link")
      icon.rel="icon"
      document.head.appendChild(icon)
    }
    icon.href=cloakIcon
  }
  apply()
  setInterval(apply,500)
}

if(settings.autoBlank && location.protocol!=="about:" && !location.search.includes("noblank")){
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

if(settings.panic){
  document.addEventListener("keydown",e=>{
    if(e.key==="`"){
      location.href="https://classroom.google.com"
    }
  })
}

const search=document.getElementById("proxySearch")
if(search && settings.proxy){
  search.addEventListener("keydown",e=>{
    if(e.key!=="Enter")return
    let q=search.value.trim()
    if(!q)return
    let url
    if(q.includes(" ")||!q.includes(".")){
      url="https://duckduckgo.com/?q="+encodeURIComponent(q)
    }else{
      if(!q.startsWith("http"))q="https://"+q
      url=q
    }
    location.href=SCRAMJET_PREFIX+encodeURIComponent(url)
  })
}

async function loadGames(){
  const r=await fetch("games.json")
  return await r.json()
}

function renderGames(games){
  const grid=document.getElementById("gamesGrid")
  if(!grid)return
  grid.innerHTML=""
  games.forEach(g=>{
    const c=document.createElement("div")
    c.className="card"
    c.onclick=()=>location.href=`p.html?id=${g.id}`
    c.innerHTML=`
      <img class="thumb" src="${g.image}">
      <div class="card-title">${g.name}</div>
    `
    grid.appendChild(c)
  })
}

if(document.getElementById("gamesGrid")){
  let all=[]
  loadGames().then(g=>{
    all=g
    renderGames(all)
  })
  const s=document.getElementById("gameSearch")
  s.oninput=()=>{
    renderGames(all.filter(x=>x.name.toLowerCase().includes(s.value.toLowerCase())))
  }
}

const frame=document.getElementById("gameFrame")

if(frame){
  loadGames().then(games=>{
    const id=new URLSearchParams(location.search).get("id")
    const game=games.find(x=>x.id===id)
    if(!game)return
    const final=settings.proxy
      ? SCRAMJET_PREFIX+encodeURIComponent(game.url)
      : game.url
    document.getElementById("gameTitle").textContent=game.name
    frame.src=final
  })
}

const fsBtn=document.getElementById("fullscreenBtn")
if(fsBtn && frame){
  fsBtn.onclick=()=>{
    if(frame.requestFullscreen)frame.requestFullscreen()
    else if(frame.webkitRequestFullscreen)frame.webkitRequestFullscreen()
  }
}

const blankBtn=document.getElementById("blankBtn")
if(blankBtn && frame){
  blankBtn.onclick=()=>{
    const w=window.open("about:blank","_blank")
    const i=w.document.createElement("iframe")
    i.src=frame.src
    i.style.border="none"
    i.style.width="100%"
    i.style.height="100%"
    w.document.body.style.margin="0"
    w.document.body.appendChild(i)
  }
}

if(document.getElementById("autoBlankToggle")){
  const auto=document.getElementById("autoBlankToggle")
  const cloak=document.getElementById("cloakToggle")
  const panic=document.getElementById("panicToggle")
  const proxy=document.getElementById("proxyToggle")
  const reset=document.getElementById("resetBtn")

  auto.checked=settings.autoBlank
  cloak.checked=settings.cloak
  panic.checked=settings.panic
  proxy.checked=settings.proxy

  auto.onchange=()=>{
    settings.autoBlank=auto.checked
    saveSettings(settings)
  }

  cloak.onchange=()=>{
    settings.cloak=cloak.checked
    saveSettings(settings)
    location.reload()
  }

  panic.onchange=()=>{
    settings.panic=panic.checked
    saveSettings(settings)
  }

  proxy.onchange=()=>{
    settings.proxy=proxy.checked
    saveSettings(settings)
  }

  reset.onclick=()=>{
    saveSettings(defaultSettings)
    location.reload()
  }
}
