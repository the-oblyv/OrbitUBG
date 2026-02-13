const endpoint = "https://3.dmvdriverseducation.org/worker/ai/chat";
const input = document.getElementById("aiInput");
const chat = document.getElementById("aiChat");
const sendBtn = document.getElementById("sendBtn");
const attachBtn = document.getElementById("attachBtn");
const imageBtn = document.getElementById("imageBtn");
const fileInput = document.getElementById("aiFile");
let contents = [];

function addMessage(role, text) {
    const div = document.createElement("div");
    div.className = `aiMsg ${role}`;
    if (role === "user") text = "**You:** " + text;
    div.innerHTML = marked.parse(text);
    chat.appendChild(div);
    Prism.highlightAllUnder(div);
    div.scrollIntoView({ behavior: "smooth" });
    return div;
}

async function sendMessage(text) {
    contents.push({ role: "user", parts: [{ text }] });
    addMessage("user", text);
    const loadingMsg = addMessage("model", "_Loading..._");
    const body = { contents, generationConfig: { temperature: 0.7 } };
    let responseText = "(No Response)";
    try {
        const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        const json = await res.json();
        responseText =
            json?.candidates?.[0]?.content?.parts?.[0]?.text || json?.text || JSON.stringify(json, null, 2);
    } catch (e) {
        responseText = "Request Failed: " + e.message;
    }
    contents.push({ role: "model", parts: [{ text: responseText }] });
    loadingMsg.innerHTML = marked.parse(responseText);
    Prism.highlightAllUnder(loadingMsg);
    loadingMsg.scrollIntoView({ behavior: "smooth" });
}

sendBtn.onclick = () => {
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    if (text.startsWith("gen-image:")) generateImage(text.slice(10).trim());
    else sendMessage(text);
};

input.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendBtn.click();
    }
});

imageBtn.onclick = () => {
    const text = "gen-image:";
    input.value = text;
    input.focus();
};

attachBtn.onclick = () => {
    fileInput.click();
};

fileInput.addEventListener("change", async e => {
    for (const file of e.target.files) {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(",")[1];
            const fileMsg = `Attached file: ${file.name} (${file.type})`;
            addMessage("user", fileMsg);
            contents.push({ role: "user", parts: [{ file: { name: file.name, type: file.type, base64 } }] });
        };
        reader.readAsDataURL(file);
    }
    fileInput.value = "";
});

async function generateImage(prompt) {
    const msg = addMessage("user", "**You (image request):** " + prompt);
    const loading = addMessage("model", "_Generating image..._");

    try {
        const form = new FormData();
        form.append("prompt", prompt);
        const res = await fetch("https://api.pollinations.ai/generate", { method: "POST", body: form });
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const img = document.createElement("img");
        img.src = url;
        img.style.maxWidth = "100%";
        img.style.borderRadius = "14px";
        chat.appendChild(img);
        loading.innerHTML = `Here is your image of ${prompt}.`;
    } catch (err) {
        loading.innerHTML = "Image generation failed: " + err.message;
    }
}
