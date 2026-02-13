const chat = document.getElementById("aiChat");
const input = document.getElementById("aiInput");
const sendBtn = document.getElementById("sendBtn");
const attachBtn = document.getElementById("attachBtn");
const imageBtn = document.getElementById("imageBtn");
const fileInput = document.getElementById("aiFile");

const endpoint = "https://3.dmvdriverseducation.org/worker/ai/chat";
const imageEndpoint = "https://3.dmvdriverseducation.org/worker/ai/image";

let contents = [];

function addMessage(role, text, isHTML=false){
  const div = document.createElement("div");
  div.className = `aiMsg ${role}`;
  if(role==="user") text = "**You:** " + text;
  div.innerHTML = isHTML ? text : marked.parse(text);
  chat.appendChild(div);
  Prism.highlightAllUnder(div);
  div.querySelectorAll("pre").forEach(pre=>{
    if(pre.querySelector(".aicopy-btn")) return;
    const btn = document.createElement("button");
    btn.className="aicopy-btn";
    btn.textContent="Copy";
    const code = pre.querySelector("code");
    btn.onclick = ()=>{navigator.clipboard.writeText(code.innerText); btn.textContent="Copied!"; setTimeout(()=>btn.textContent="Copy",1200);}
    pre.appendChild(btn);
  });
  chat.scrollIntoView({behavior:"smooth", block:"end"});
  return div;
}

async function sendMessage(text){
  if(!text.trim()) return;
  if(text.startsWith("gen-image:")){
    const prompt = text.slice(10).trim();
    addMessage("user", text);
    const loadingMsg = addMessage("model", "_Generating image..._");
    try{
      const res = await fetch(imageEndpoint, {
        method:"POST",
        body:JSON.stringify({prompt}),
        headers:{"Content-Type":"application/json"}
      });
      const json = await res.json();
      if(json?.image){
        const img = document.createElement("img");
        img.src = json.image;
        img.style.maxWidth="100%";
        img.style.borderRadius="16px";
        loadingMsg.innerHTML="";
        loadingMsg.appendChild(img);
        if(json?.description){
          addMessage("model", json.description);
        }
      }else{
        loadingMsg.innerHTML="Image generation failed.";
      }
    }catch(e){
      loadingMsg.innerHTML="Image generation failed: "+e.message;
    }
    return;
  }

  addMessage("user", text);
  const loadingMsg = addMessage("model", "_Loading..._");
  contents.push({role:"user", parts:[{text}]});
  try{
    const res = await fetch(endpoint,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({contents, generationConfig:{temperature:0.7}})
    });
    const json = await res.json();
    const responseText = json?.candidates?.[0]?.content?.parts?.[0]?.text || json?.text || "(No Response)";
    contents.push({role:"model", parts:[{text:responseText}]});
    loadingMsg.innerHTML = marked.parse(responseText);
  }catch(e){
    loadingMsg.innerHTML="Request failed: "+e.message;
  }
}

sendBtn.onclick = ()=>{sendMessage(input.value); input.value="";}
input.addEventListener("keydown", e=>{
  if(e.key==="Enter" && !e.shiftKey){
    e.preventDefault();
    sendBtn.click();
  }
});

attachBtn.onclick = ()=>fileInput.click();
imageBtn.onclick = ()=>{
  input.value = "gen-image: ";
  input.focus();
};

fileInput.addEventListener("change", async ()=>{
  const files = Array.from(fileInput.files);
  for(const file of files){
    const reader = new FileReader();
    reader.onload = async e=>{
      const dataURL = e.target.result;
      const type = file.type;
      const name = file.name;
      addMessage("user", `Attached file: ${name}`);
      addMessage("model", "_Processing file..._");
      try{
        const res = await fetch(endpoint,{
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({contents, generationConfig:{temperature:0.7}, file:{name, type, data:dataURL}})
        });
        const json = await res.json();
        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || json?.text || "(No Response)";
        addMessage("model", text);
      }catch(e){
        addMessage("model", "File processing failed: "+e.message);
      }
    };
    reader.readAsDataURL(file);
  }
  fileInput.value="";
});
