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
if(menuBtn) menuBtn.onclick=()=>menu.classList.toggle("open")

if(settings.cloak){
  const title="Google Classroom"
  const icon="https://ssl.gstatic.com/classroom/favicon.png"
  const apply=()=>{
    document.title=title
    let l=document.querySelector("link[rel='icon']")
    if(!l){
      l=document.createElement("link")
      l.rel="icon"
      document.head.appendChild(l)
    }
    l.href=icon
  }
  apply()
  setInterval(apply,500)
}

if(settings.autoBlank && location.protocol!=="about:" && !location.search.includes("noblank")){
  const w=window.open("about:blank","_blank")
  if(w){
    w.document.write(`<iframe src="${location.href}?noblank=1" style="border:none;width:100%;height:100%"></iframe>`)
    location.replace("https://classroom.google.com")
  }
}

if(settings.panic){
  document.addEventListener("keydown",e=>{
    if(e.key==="`") location.href="https://classroom.google.com"
  })
}

const search=document.getElementById("proxySearch")
if(search && settings.proxy){
  search.addEventListener("keydown",e=>{
    if(e.key!=="Enter") return
    let q=search.value.trim()
    if(!q) return

    let url
    if(q.includes(" ")||!q.includes(".")){
      url="https://duckduckgo.com/?q="+encodeURIComponent(q)
    }else{
      if(!q.startsWith("http")) q="https://"+q
      url=q
    }

    location.href=url
  })
}

async function loadGames(){
  const r=await fetch("games.json")
  return r.json()
}

function renderGames(g){
  const grid=document.getElementById("gamesGrid")
  if(!grid) return
  grid.innerHTML=""
  g.forEach(x=>{
    const c=document.createElement("div")
    c.className="card"
    c.onclick=()=>location.href=`p.html?id=${x.id}`
    c.innerHTML=`<img class="thumb" src="${x.image}"><div class="card-title">${x.name}</div>`
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
  s.oninput=()=>renderGames(all.filter(x=>x.name.toLowerCase().includes(s.value.toLowerCase())))
}

const frame=document.getElementById("gameFrame")
if(frame){
  loadGames().then(g=>{
    const id=new URLSearchParams(location.search).get("id")
    const game=g.find(x=>x.id===id)
    if(!game) return
    document.getElementById("gameTitle").textContent=game.name
    frame.src=game.url
  })
}

const fsBtn=document.getElementById("fullscreenBtn")
if(fsBtn && frame){
  fsBtn.onclick=()=>{
    if(frame.requestFullscreen) frame.requestFullscreen()
    else if(frame.webkitRequestFullscreen) frame.webkitRequestFullscreen()
  }
}

const blankBtn=document.getElementById("blankBtn")
if(blankBtn && frame){
  blankBtn.onclick=()=>{
    const w=window.open("about:blank","_blank")
    if(!w) return
    w.document.write(`<iframe src="${frame.src}" style="border:none;width:100%;height:100%"></iframe>`)
  }
}

const aboutBtn=document.getElementById("aboutBlankBtn")
if(aboutBtn){
  aboutBtn.onclick=()=>{
    const w=window.open("about:blank","_blank")
    if(!w) return
    w.document.write(`<iframe src="${location.href}?noblank=1" style="border:none;width:100%;height:100%"></iframe>`)
  }
}

if(document.getElementById("autoBlankToggle")){
  const a=document.getElementById("autoBlankToggle")
  const c=document.getElementById("cloakToggle")
  const p=document.getElementById("panicToggle")
  const pr=document.getElementById("proxyToggle")
  const r=document.getElementById("resetBtn")

  a.checked=settings.autoBlank
  c.checked=settings.cloak
  p.checked=settings.panic
  pr.checked=settings.proxy

  a.onchange=()=>{settings.autoBlank=a.checked;saveSettings(settings)}
  c.onchange=()=>{settings.cloak=c.checked;saveSettings(settings);location.reload()}
  p.onchange=()=>{settings.panic=p.checked;saveSettings(settings)}
  pr.onchange=()=>{settings.proxy=pr.checked;saveSettings(settings)}

  r.onclick=()=>{saveSettings(defaultSettings);location.reload()}
}
