const SETTINGS_KEY="orbitSettings"

const defaultSettings={
  cloak:true,
  cloakTitle:"Google Classroom",
  cloakIcon:"https://ssl.gstatic.com/classroom/favicon.png",
  panic:true,
  panicKey:"`"
}

function getSettings(){
  const s=localStorage.getItem(SETTINGS_KEY)
  return s?JSON.parse(s):structuredClone(defaultSettings)
}

function saveSettings(s){
  localStorage.setItem(SETTINGS_KEY,JSON.stringify(s))
}

const settings=getSettings()
const UV_PREFIX="/uv/"

const menuBtn=document.getElementById("menuBtn")
const menu=document.getElementById("menu")
if(menuBtn) menuBtn.onclick=()=>menu.classList.toggle("open")

const defaultTitle = document.title
let defaultIcon = document.querySelector("link[rel='icon']")
defaultIcon = defaultIcon ? defaultIcon.href : null

function applyCloak(){
  document.title=settings.cloakTitle
  let l=document.querySelector("link[rel='icon']")
  if(!l){
    l=document.createElement("link")
    l.rel="icon"
    document.head.appendChild(l)
  }
  l.href=settings.cloakIcon
}

function removeCloak(){
  document.title=defaultTitle
  if(defaultIcon){
    let l=document.querySelector("link[rel='icon']")
    if(!l){
      l=document.createElement("link")
      l.rel="icon"
      document.head.appendChild(l)
    }
    l.href=defaultIcon
  }
}

if(settings.cloak){
  applyCloak()
  setInterval(applyCloak,500)
}else{
  removeCloak()
}

if(settings.panic){
  document.addEventListener("keydown",e=>{
    if(e.key===settings.panicKey){
      location.href="https://classroom.google.com"
    }
  })
}

const search=document.getElementById("proxySearch")
if(search){
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
    location.href=UV_PREFIX+encodeURIComponent(url)
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
    g.sort((a,b)=>a.name.localeCompare(b.name)) // <-- SORT ALPHABETICALLY
    all=g
    renderGames(all)
  })
  const s=document.getElementById("gameSearch")
  if(s) s.oninput=()=>renderGames(all.filter(x=>x.name.toLowerCase().includes(s.value.toLowerCase())))
}

const frame=document.getElementById("gameFrame")
if(frame){
  loadGames().then(g=>{
    const id=new URLSearchParams(location.search).get("id")
    const game=g.find(x=>x.id===id)
    if(game) frame.src=game.url
  })
}

const fsBtn=document.getElementById("fullscreenBtn")
if(fsBtn && frame){
  fsBtn.onclick=()=>frame.requestFullscreen&&frame.requestFullscreen()
}

const blankBtn=document.getElementById("blankBtn")
if(blankBtn && frame){
  blankBtn.onclick=()=>{
    const w=window.open("about:blank","_blank")
    if(!w) return
    w.document.write(`<iframe src="${frame.src}" style="border:none;width:100%;height:100%"></iframe>`)
  }
}

const cloakToggle=document.getElementById("cloakToggle")
const cloakTitleInput=document.getElementById("cloakTitleInput")
const cloakIconInput=document.getElementById("cloakIconInput")
const panicToggle=document.getElementById("panicToggle")
const panicKeyInput=document.getElementById("panicKeyInput")

if(cloakToggle){
  cloakToggle.checked=settings.cloak
  cloakTitleInput.value=settings.cloakTitle
  cloakIconInput.value=settings.cloakIcon
  panicToggle.checked=settings.panic
  panicKeyInput.value=settings.panicKey

  cloakToggle.onchange=()=>{
    settings.cloak=cloakToggle.checked
    saveSettings(settings)
    location.reload()
  }

  cloakTitleInput.oninput=()=>{
    settings.cloakTitle=cloakTitleInput.value||"Google Classroom"
    saveSettings(settings)
  }

  cloakIconInput.oninput=()=>{
    settings.cloakIcon=cloakIconInput.value||"https://ssl.gstatic.com/classroom/favicon.png"
    saveSettings(settings)
  }

  panicToggle.onchange=()=>{
    settings.panic=panicToggle.checked
    saveSettings(settings)
  }

  panicKeyInput.onkeydown=e=>{
    e.preventDefault()
    settings.panicKey=e.key
    panicKeyInput.value=e.key
    saveSettings(settings)
  }
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
