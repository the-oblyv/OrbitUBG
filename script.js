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

const defaultTitle=document.title
let defaultIcon=document.querySelector("link[rel='icon']")
defaultIcon=defaultIcon?defaultIcon.href:null

let cloakInterval=null

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
  if(cloakInterval){
    clearInterval(cloakInterval)
    cloakInterval=null
  }
}

if(settings.cloak){
  applyCloak()
  cloakInterval=setInterval(applyCloak,500)
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

document.addEventListener("DOMContentLoaded",()=>{

  const menuBtn=document.getElementById("menuBtn")
  const menu=document.getElementById("menu")
  if(menuBtn) menuBtn.onclick=()=>menu.classList.toggle("open")

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

  const grid = document.getElementById("gamesGrid")
if (grid) {
  fetch("/games.json")
    .then(r => r.json())
    .then(g => {
      g.sort((a,b) => a.name.localeCompare(b.name))

      const render = list => {
        grid.innerHTML = ""

        const requestCard = document.createElement("div")
        requestCard.className = "card"
        requestCard.onclick = () => window.open("https://forms.gle/WdSBv4jkFo3nwvFz8", "_blank")
        requestCard.innerHTML = `
          <img class="thumb" src="/res/googleform.webp">
          <div class="card-title">!! Request a Game</div>
        `
        grid.appendChild(requestCard)

        list.forEach(x => {
          const c = document.createElement("div")
          c.className = "card"
          c.onclick = () => location.href = `/p?id=${x.id}`
          c.innerHTML = `
            <img class="thumb" src="${x.image}">
            <div class="card-title">${x.name}</div>
          `
          grid.appendChild(c)
        })
      }

      render(g)

      const s = document.getElementById("gameSearch")
      if(s) s.oninput = () => render(
        g.filter(x => x.name.toLowerCase().includes(s.value.toLowerCase()))
      )
    })
}
  
  const frame=document.getElementById("gameFrame")
  if(frame){
    fetch("/games.json")
      .then(r=>r.json())
      .then(g=>{
        const id=new URLSearchParams(location.search).get("id")
        const game=g.find(x=>x.id===id)
        if(game) frame.src=game.url
      })
  }

  const fsBtn=document.getElementById("fullscreenBtn")
  if(fsBtn&&frame){
    fsBtn.onclick=()=>{
      if(frame.requestFullscreen) frame.requestFullscreen()
    }
  }

  const blankBtn=document.getElementById("blankBtn")
  if(blankBtn&&frame){
    blankBtn.onclick=()=>{
      const w=window.open("about:blank","_blank")
      if(!w) return
      const i=w.document.createElement("iframe")
      i.src=frame.src
      i.style.border="none"
      i.style.width="100%"
      i.style.height="100%"
      w.document.body.style.margin="0"
      w.document.body.appendChild(i)
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
      if(settings.cloak) applyCloak()
    }

    cloakIconInput.oninput=()=>{
      settings.cloakIcon=cloakIconInput.value||"https://ssl.gstatic.com/classroom/favicon.png"
      saveSettings(settings)
      if(settings.cloak) applyCloak()
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
      if(!w) return
      const i=w.document.createElement("iframe")
      i.src=location.href
      i.style.border="none"
      i.style.width="100%"
      i.style.height="100%"
      w.document.body.style.margin="0"
      w.document.body.appendChild(i)
    }
  }

})
