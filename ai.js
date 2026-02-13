const chatEndpoint = "https://3.dmvdriverseducation.org/worker/ai/chat";
const imageEndpoint = "https://3.dmvdriverseducation.org/worker/ai/image";

const input = document.getElementById("aiInput");
const chat = document.getElementById("aiChat");
const fileInput = document.getElementById("fileInput");

let contents = [];

function addMessage(role, text) {
    const div = document.createElement("div");
    div.className = `aiMsg ${role}`;
    if (role === "user") text = "**You:** " + text;
    div.innerHTML = marked.parse(text);
    chat.appendChild(div);
    enhanceCodeBlocks(div);
    window.scrollTo(0, document.body.scrollHeight);
    return div;
}

async function sendMessage(text, files=[]) {
    if (!text && files.length === 0) return;
    if (text) {
        contents.push({ role: "user", parts: [{ text }] });
        addMessage("user", text);
    }

    if (text && text.startsWith("gen-image:")) {
        const prompt = text.slice(10).trim();
        const loadingMsg = addMessage("model", "_Generating image..._");
        try {
            const formData = new FormData();
            formData.append("prompt", prompt);
            for (const file of files) formData.append("file", file);
            const res = await fetch(imageEndpoint, { method:"POST", body: formData });
            const json = await res.json();
            const img = document.createElement("img");
            img.src = json.base64;
            img.style.maxWidth = "100%";
            img.style.borderRadius = "8px";
            loadingMsg.innerHTML = "";
            loadingMsg.appendChild(img);

            const desc = json.description || prompt;
            addMessage("model", `Here is your image of ${desc}.`);

        } catch (e) {
            loadingMsg.innerHTML = "Image generation failed: " + e.message;
        }
        return;
    }

    const loadingMsg = addMessage("model", "_Loading..._");
    try {
        const body = { contents, generationConfig: { temperature:0.7 }, files: [] };
        for (const file of files) {
            body.files.push({ name:file.name, type:file.type });
        }
        const res = await fetch(chatEndpoint, {
            method:"POST",
            headers:{ "Content-Type":"application/json" },
            body: JSON.stringify(body)
        });
        const json = await res.json();
        const responseText = json?.candidates?.[0]?.content?.parts?.[0]?.text || json?.text || "(No response)";
        contents.push({ role:"model", parts:[{ text: responseText }] });
        loadingMsg.innerHTML = marked.parse(responseText);
        enhanceCodeBlocks(loadingMsg);
        window.scrollTo(0, document.body.scrollHeight);
    } catch (e) {
        loadingMsg.innerHTML = "Request failed: " + e.message;
    }
}

function enhanceCodeBlocks(container) {
    Prism.highlightAllUnder(container);
    container.querySelectorAll("pre").forEach(pre=>{
        if (pre.querySelector(".aicopy-btn")) return;
        const button = document.createElement("button");
        button.textContent = "Copy";
        button.className = "aicopy-btn";
        const code = pre.querySelector("code");
        button.onclick = ()=> {
            navigator.clipboard.writeText(code.innerText).then(()=>{
                button.textContent = "Copied!";
                setTimeout(()=>button.textContent="Copy",1200);
            });
        };
        pre.appendChild(button);
    });
}

input.addEventListener("keydown", e => {
    if (e.key === "Enter" && input.value.trim()) {
        const text = input.value.trim();
        input.value = "";
        sendMessage(text);
    }
});

document.getElementById("sendBtn").onclick = ()=>{
    const text = input.value.trim();
    input.value = "";
    sendMessage(text);
};

document.getElementById("attachBtn").onclick = ()=>{
    fileInput.click();
};

fileInput.addEventListener("change", ()=>{
    const files = Array.from(fileInput.files);
    if (!files.length) return;
    sendMessage("", files);
});
