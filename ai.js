const endpoint = "https://3.dmvdriverseducation.org/worker/ai/chat";
const input = document.getElementById("aiInput");
const chat = document.getElementById("aiChat");
const sendBtn = document.getElementById("sendBtn");
const attachBtn = document.getElementById("attachBtn");
const fileInput = document.getElementById("aiFile");

let contents = [];
let pendingAttachments = [];

function addMessage(role, html, isHtml = false) {
    const div = document.createElement("div");
    div.className = `aiMsg ${role}`;
    div.innerHTML = isHtml ? html : marked.parse(html);
    chat.appendChild(div);
    enhanceCodeBlocks(div);
    chat.scrollTop = chat.scrollHeight;
    return div;
}

async function sendMessage(text) {
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

    const loadingMsg = addMessage("model", "_Loading..._");

    const body = {
        contents,
        generationConfig: { temperature: 0.7 }
    };

    let responseText = "(No Response)";

    try {
        const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        const json = await res.json();
        responseText =
            json?.candidates?.[0]?.content?.parts?.[0]?.text ||
            json?.text ||
            JSON.stringify(json, null, 2);
    } catch (e) {
        responseText = "Request Failed: " + e.message;
    }

    contents.push({ role: "model", parts: [{ text: responseText }] });

    loadingMsg.innerHTML = marked.parse(responseText);
    enhanceCodeBlocks(loadingMsg);

    pendingAttachments = [];
    chat.scrollTop = chat.scrollHeight;
}

function enhanceCodeBlocks(container) {
    Prism.highlightAllUnder(container);
    container.querySelectorAll("pre").forEach(pre => {
        if (pre.querySelector(".aicopy-btn")) return;
        const button = document.createElement("button");
        button.textContent = "Copy";
        button.className = "aicopy-btn";
        const code = pre.querySelector("code");
        button.onclick = () => {
            navigator.clipboard.writeText(code.innerText).then(() => {
                button.textContent = "Copied!";
                setTimeout(() => button.textContent = "Copy", 1200);
            });
        };
        pre.appendChild(button);
    });
}

if (attachBtn && fileInput) {
    attachBtn.onclick = () => fileInput.click();

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

                if (file.type.startsWith("image/")) {
                    addMessage(
                        "user",
                        `<div><strong>Attached:</strong> ${file.name}<br><img src="${reader.result}" style="max-width:250px;border-radius:12px;margin-top:8px;"></div>`,
                        true
                    );
                } else if (file.type.startsWith("audio/")) {
                    addMessage(
                        "user",
                        `<div><strong>Attached:</strong> ${file.name}<br><audio controls src="${reader.result}" style="margin-top:8px;"></audio></div>`,
                        true
                    );
                } else if (file.type.startsWith("video/")) {
                    addMessage(
                        "user",
                        `<div><strong>Attached:</strong> ${file.name}<br><video controls src="${reader.result}" style="max-width:300px;border-radius:12px;margin-top:8px;"></video></div>`,
                        true
                    );
                } else {
                    addMessage("user", `Attached: ${file.name}`);
                }
            };

            reader.readAsDataURL(file);
        });

        fileInput.value = "";
    });
}

if (sendBtn) {
    sendBtn.onclick = () => {
        if (!input.value.trim() && pendingAttachments.length === 0) return;
        const text = input.value.trim();
        input.value = "";
        sendMessage(text);
    };
}

input.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (!input.value.trim() && pendingAttachments.length === 0) return;
        const text = input.value.trim();
        input.value = "";
        sendMessage(text);
    }
});
