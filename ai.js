const endpoint = "https://9.dmvdriverseducation.org/worker/ai/chat";

const input = document.getElementById("aiInput");
const chat = document.getElementById("aiChat");
const sendBtn = document.getElementById("sendBtn");
const attachBtn = document.getElementById("attachBtn");
const fileInput = document.getElementById("aiFile");
const regenBtn = document.getElementById("regenBtn");

let contents = [];
let pendingAttachments = [];
let identityInjected = false;
let generating = false;

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

function addModelControls(messageDiv, text) {
    const controls = document.createElement("div");
    controls.className = "aiControls";

    const copyBtn = document.createElement("button");
    copyBtn.textContent = "Copy";
    copyBtn.className = "aiMsgCopy";
    copyBtn.onclick = () => {
        navigator.clipboard.writeText(text).then(() => {
            copyBtn.textContent = "Copied!";
            setTimeout(() => copyBtn.textContent = "Copy", 1200);
        });
    };

    const regenButton = document.createElement("button");
    regenButton.textContent = "Regenerate";
    regenButton.className = "aiMsgRegen";
    regenButton.onclick = regenerateLast;

    controls.appendChild(copyBtn);
    controls.appendChild(regenButton);

    messageDiv.after(controls);
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
    if (generating) return;

    const text = input.value.trim();
    if (!text && pendingAttachments.length === 0) return;

    generating = true;

    if (text) addUserTextMessage(text);

    const parts = [];

    if (!identityInjected) {
        parts.push({
            text: "You are Orbit AI, an AI assistant created by gmacbride for https://orbit.foo.ng/. Always identify yourself as Orbit AI in responses.\n\nUser message:"
        });
        identityInjected = true;
    }

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
    loadingMsg.innerHTML = renderMarkdown("_Orbit AI is thinking..._");

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
        addModelControls(loadingMsg, responseText);

    } catch (err) {
        loadingMsg.innerHTML = "Request Failed: " + err.message;
    }

    generating = false;
    chat.scrollTop = chat.scrollHeight;
}

function regenerateLast() {
    if (generating) return;
    if (contents.length < 2) return;
    if (contents[contents.length - 1].role !== "model") return;

    generating = true;

    contents.pop();

    const lastModelMsg = [...chat.querySelectorAll(".aiMsg.model")].pop();
    if (lastModelMsg) {
        const controls = lastModelMsg.nextElementSibling;
        if (controls && controls.classList.contains("aiControls")) {
            controls.remove();
        }
        lastModelMsg.remove();
    }

    const loadingMsg = createMessage("model");
    loadingMsg.innerHTML = renderMarkdown("_Orbit AI is thinking..._");

    fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents,
            generationConfig: { temperature: 0.7 }
        })
    })
    .then(res => res.json())
    .then(json => {
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
        addModelControls(loadingMsg, responseText);
    })
    .catch(err => {
        loadingMsg.innerHTML = "Request Failed: " + err.message;
    })
    .finally(() => {
        generating = false;
        chat.scrollTop = chat.scrollHeight;
    });
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

if (regenBtn) regenBtn.addEventListener("click", regenerateLast);

input.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});
