const endpoint = "https://9.dmvdriverseducation.org/worker/ai/chat";

const input = document.getElementById("aiInput");
const chat = document.getElementById("aiChat");
const sendBtn = document.getElementById("sendBtn");
const attachBtn = document.getElementById("attachBtn");
const fileInput = document.getElementById("aiFile");
const regenBtn = document.getElementById("regenBtn");

let contents = [];
let pendingAttachments = [];
let generating = false;

function createMessage(role) {
    const wrapper = document.createElement("div");
    wrapper.className = `aiWrap ${role}`;

    const bubble = document.createElement("div");
    bubble.className = `aiMsg ${role}`;

    wrapper.appendChild(bubble);
    chat.appendChild(wrapper);
    chat.scrollTop = chat.scrollHeight;

    return { wrapper, bubble };
}

function renderMarkdown(text) {
    return marked.parse(text || "");
}

function enhanceCodeBlocks(container) {
    Prism.highlightAllUnder(container);

    container.querySelectorAll("pre").forEach(pre => {
        if (pre.parentElement.querySelector(".aicopy-btn")) return;

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

        pre.parentElement.appendChild(btn);
    });
}

function addDefaultMessage() {
    const text = "Hello! I'm Orbit AI.\n\nYou can:\n- Ask questions\n- Attach images, audio, or files\n- Regenerate responses\n\nHow can I help you today?";

    contents.push({
        role: "model",
        parts: [{ text }]
    });

    const { bubble } = createMessage("model");
    bubble.innerHTML = renderMarkdown(text);
    enhanceCodeBlocks(bubble);
}

function addUserMessage(text, attachments = []) {
    const { bubble } = createMessage("user");

    let html = "";

    if (text) html += renderMarkdown(text);

    attachments.forEach(file => {
        if (file.mimeType.startsWith("image/")) {
            html += `
                <div class="aiAttachment">
                    <div><strong>${file.name}</strong></div>
                    <img src="data:${file.mimeType};base64,${file.base64}" style="max-width:250px;border-radius:12px;margin-top:6px;">
                </div>
            `;
        } else if (file.mimeType.startsWith("audio/")) {
            html += `
                <div class="aiAttachment">
                    <div><strong>${file.name}</strong></div>
                    <audio controls src="data:${file.mimeType};base64,${file.base64}" style="margin-top:6px;"></audio>
                </div>
            `;
        } else if (file.mimeType.startsWith("video/")) {
            html += `
                <div class="aiAttachment">
                    <div><strong>${file.name}</strong></div>
                    <video controls src="data:${file.mimeType};base64,${file.base64}" style="max-width:300px;border-radius:12px;margin-top:6px;"></video>
                </div>
            `;
        } else {
            html += `
                <div class="aiAttachment">
                    <strong>${file.name}</strong>
                </div>
            `;
        }
    });

    bubble.innerHTML = html;
    enhanceCodeBlocks(bubble);
}

async function sendMessage() {
    if (generating) return;

    const text = input.value.trim();
    if (!text && pendingAttachments.length === 0) return;

    generating = true;
    if (regenBtn) regenBtn.disabled = true;

    const attachmentsCopy = [...pendingAttachments];

    addUserMessage(text, attachmentsCopy);

    const parts = [];

    if (text) parts.push({ text });

    attachmentsCopy.forEach(file => {
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

    const { bubble: loadingBubble } = createMessage("model");
    loadingBubble.innerHTML = renderMarkdown("_Loading..._");

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

        loadingBubble.innerHTML = renderMarkdown(responseText);
        enhanceCodeBlocks(loadingBubble);

    } catch (err) {
        loadingBubble.innerHTML = "Request Failed: " + err.message;
    }

    generating = false;
    if (regenBtn) regenBtn.disabled = false;
    chat.scrollTop = chat.scrollHeight;
}

function regenerateLast() {
    if (generating) return;
    if (contents.length < 2) return;
    if (contents[contents.length - 1].role !== "model") return;

    generating = true;
    if (regenBtn) regenBtn.disabled = true;

    contents.pop();

    const lastModelMsg = [...chat.querySelectorAll(".aiWrap.model")].pop();
    if (lastModelMsg) lastModelMsg.remove();

    const { bubble: loadingBubble } = createMessage("model");
    loadingBubble.innerHTML = renderMarkdown("_Regenerating..._");

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

        loadingBubble.innerHTML = renderMarkdown(responseText);
        enhanceCodeBlocks(loadingBubble);
    })
    .catch(err => {
        loadingBubble.innerHTML = "Request Failed: " + err.message;
    })
    .finally(() => {
        generating = false;
        if (regenBtn) regenBtn.disabled = false;
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

            addUserMessage("", [{
                name: file.name,
                mimeType: file.type || "application/octet-stream",
                base64
            }]);
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

addDefaultMessage();
