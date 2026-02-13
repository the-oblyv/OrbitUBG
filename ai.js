const endpoint = "https://3.dmvdriverseducation.org/worker/ai/chat";

const input = document.getElementById("aiInput");
const chat = document.getElementById("aiChat");
const sendBtn = document.getElementById("sendBtn");
const attachBtn = document.getElementById("attachBtn");
const imageBtn = document.getElementById("imageBtn");
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

function addUserText(text) {
    const msg = createMessage("user");
    msg.innerHTML = renderMarkdown(text);
    enhanceCodeBlocks(msg);
}

function addAttachmentPreview(file, dataUrl) {
    const msg = createMessage("user");

    if (file.type.startsWith("image/")) {
        msg.innerHTML = `
            <div><strong>Attached:</strong> ${file.name}</div>
            <img src="${dataUrl}" style="max-width:260px;border-radius:14px;margin-top:8px;">
        `;
    } else if (file.type.startsWith("audio/")) {
        msg.innerHTML = `
            <div><strong>Attached:</strong> ${file.name}</div>
            <audio controls src="${dataUrl}" style="margin-top:8px;"></audio>
        `;
    } else if (file.type.startsWith("video/")) {
        msg.innerHTML = `
            <div><strong>Attached:</strong> ${file.name}</div>
            <video controls src="${dataUrl}" style="max-width:300px;border-radius:14px;margin-top:8px;"></video>
        `;
    } else {
        msg.innerHTML = `<div><strong>Attached:</strong> ${file.name}</div>`;
    }
}

async function generateImage(prompt) {
    const userMsg = createMessage("user");
    userMsg.innerHTML = renderMarkdown("gen-image: " + prompt);

    const imageContainer = createMessage("model");
    imageContainer.innerHTML = renderMarkdown("_Generating image..._");

    try {
        if (!puter.auth.isSignedIn()) {
            await puter.auth.signInAnonymously();
        }

        const imageElement = await puter.ai.txt2img(prompt);

        imageContainer.innerHTML = "";
        imageElement.style.maxWidth = "300px";
        imageElement.style.borderRadius = "14px";
        imageContainer.appendChild(imageElement);

        const descriptionPrompt =
            `Describe the generated image in 1–2 concise sentences. ` +
            `Start exactly with "Here is your image of ${prompt}." ` +
            `Do not ask questions. Do not add extra commentary.`;

        const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [
                    { role: "user", parts: [{ text: descriptionPrompt }] }
                ]
            })
        });

        const json = await res.json();
        const responseText =
            json?.candidates?.[0]?.content?.parts?.[0]?.text ||
            `Here is your image of ${prompt}.`;

        const descMsg = createMessage("model");
        descMsg.innerHTML = renderMarkdown(responseText);

    } catch (err) {
        imageContainer.innerHTML = "Image generation failed.";
    }

    chat.scrollTop = chat.scrollHeight;
}

async function sendMessage() {
    const text = input.value.trim();

    if (!text && pendingAttachments.length === 0) return;

    if (text.startsWith("gen-image:")) {
        const prompt = text.replace("gen-image:", "").trim();
        input.value = "";
        pendingAttachments = [];
        generateImage(prompt);
        return;
    }

    if (text) addUserText(text);

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

if (imageBtn) {
    imageBtn.addEventListener("click", () => {
        input.value = "gen-image: ";
        input.focus();
    });
}
