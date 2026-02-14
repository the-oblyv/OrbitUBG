const endpoint = "https://9.dmvdriverseducation.org/worker/ai/chat";

const input = document.getElementById("aiInput");
const chat = document.getElementById("aiChat");
const sendBtn = document.getElementById("sendBtn");
const attachBtn = document.getElementById("attachBtn");
const fileInput = document.getElementById("aiFile");

let contents = [];
let pendingAttachments = [];

function createMessage(role) {
    const div = document.createElement("div");
    div.className = `aiMsg ${role}`;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
    return div;
}

function renderMarkdown(text) {
    return marked.parse(text || "");
}

function enhanceCodeBlocks(container) {
    Prism.highlightAllUnder(container);
    container.querySelectorAll("pre").forEach(pre => {
        if (pre.querySelector(".aicopy-btn")) return;
        const btn = document.createElement("button");
        btn.textContent = "Copy";
        btn.className = "aicopy-btn";
        const code = pre.querySelector("code");
        btn.onclick = () => {
            navigator.clipboard.writeText(code.innerText).then(() => {
                btn.textContent = "Copied!";
                setTimeout(() => btn.textContent = "Copy", 1200);
            });
        };
        pre.appendChild(btn);
    });
}

function addUserTextMessage(text) {
    const msg = createMessage("user");
    msg.innerHTML = renderMarkdown(text);
    enhanceCodeBlocks(msg);
}

function addAttachmentPreview(file, dataUrl) {
    const msg = createMessage("user");

    if (file.type.startsWith("image/")) {
        msg.innerHTML = `
            <div><strong>Attached:</strong> ${file.name}</div>
            <img src="${dataUrl}" style="max-width:250px;border-radius:12px;margin-top:8px;">
        `;
    } else if (file.type.startsWith("audio/")) {
        msg.innerHTML = `
            <div><strong>Attached:</strong> ${file.name}</div>
            <audio controls src="${dataUrl}" style="margin-top:8px;"></audio>
        `;
    } else if (file.type.startsWith("video/")) {
        msg.innerHTML = `
            <div><strong>Attached:</strong> ${file.name}</div>
            <video controls src="${dataUrl}" style="max-width:300px;border-radius:12px;margin-top:8px;"></video>
        `;
    } else {
        msg.innerHTML = `<div><strong>Attached:</strong> ${file.name}</div>`;
    }
}

async function sendMessage() {
    const text = input.value.trim();

    if (!text && pendingAttachments.length === 0) return;

    if (text) addUserTextMessage(text);

    const parts = [];

    if (text) parts.push({ text });

    pendingAttachments.forEach(file => {
        parts.push({
            inlineData: {
                mimeType: file.mimeType,
                data: file.base64
            }
        });
    });

    contents.push({ role: "user", parts });

    input.value = "";
    pendingAttachments = [];

    const loadingMsg = createMessage("model");
    loadingMsg.innerHTML = renderMarkdown("_Loading..._");

    try {
        const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents,
                generationConfig: { temperature: 0.7 }
            })
        });

        const json = await res.json();

        const responseText =
            json?.candidates?.[0]?.content?.parts?.[0]?.text ||
            json?.text ||
            "(No response)";

        contents.push({
            role: "model",
            parts: [{ text: responseText }]
        });

        loadingMsg.innerHTML = renderMarkdown(responseText);
        enhanceCodeBlocks(loadingMsg);

    } catch (err) {
        loadingMsg.innerHTML = "Request Failed: " + err.message;
    }

    chat.scrollTop = chat.scrollHeight;
}

attachBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", () => {
    const files = Array.from(fileInput.files);

    files.forEach(file => {
        const reader = new FileReader();

        reader.onload = () => {
            const base64 = reader.result.split(",")[1];

            pendingAttachments.push({
                name: file.name,
                mimeType: file.type || "application/octet-stream",
                base64
            });

            addAttachmentPreview(file, reader.result);
        };

        reader.readAsDataURL(file);
    });

    fileInput.value = "";
});

sendBtn.addEventListener("click", sendMessage);

input.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});
