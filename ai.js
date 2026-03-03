var converter = new showdown.Converter();

const chatInput = document.querySelector("#chat-input");
const sendButton = document.querySelector("#send-btn");
const chatContainer = document.querySelector(".chat-container");
const deleteButton = document.querySelector("#delete-btn");
const imageButton = document.querySelector("#image-btn");
const sysprompt = () => document.getElementById("system-prompt");

const initialInputHeight = chatInput.scrollHeight;

const defaultText = `
<div class="default-text">
    <h1>Orbit AI</h1>
</div>`;

const defaultSystemPrompt = `You are Orbit AI, an AI assistant made by gmacbride for https://orbit.foo.ng. Respond in the user's language as concisely as possible.

Current Date: __DATE__
User Language: __LANGUAGE__

When the user asks to generate an image, insert the following markdown "![{description}](<https://image.pollinations.ai/prompt/{description}?width={width}&height={height}>)"
`;

function ProcessText(text) {
    return text
        .replaceAll("__DATE__", new Date().toString())
        .replaceAll("__LANGUAGE__", navigator.language);
}

const chatHistory = {
    history: [],

    load() {
        try {
            const saved = localStorage.getItem("chatHistory");
            this.history = saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("History parse error:", e);
            this.history = [];
        }
    },

    save() {
        localStorage.setItem("chatHistory", JSON.stringify(this.history));
    },

    clear() {
        this.history = [];
        this.save();
    },

    add(content, role = "assistant") {
        this.history.push({ role, content });
        this.save();
    },

    remove(index) {
        if (index >= 0) {
            this.history.splice(index, 1);
            this.save();
        }
    },

    toHTML() {
        if (!this.history.length) {
            return defaultText;
        }

        return this.history.map((message, i) => {
            const roleclass = message.role === "user" ? "outgoing" : "incoming";
            return `
            <div class="chat ${roleclass}" data-index="${i}">
                <div class="chat-content">
                    <div class="chat-details">
                        <div class="msg-markdown">
                            ${converter.makeHtml(message.content)}
                        </div>
                    </div>
                    <div class="chat-actions">
                        <span onclick="msgActions.copy(this)"><i class="fas fa-copy"></i></span>
                        <span onclick="msgActions.edit(this)"><i class="fas fa-pencil"></i></span>
                        <span onclick="msgActions.delete(this)"><i class="fas fa-trash"></i></span>
                    </div>
                </div>
            </div>`;
        }).join("");
    },

    update() {
        chatContainer.innerHTML = this.toHTML();
        addCopyButtonsToPreElements(chatContainer);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
};

function addCopyButtonsToPreElements(container) {
    const pres = container.querySelectorAll("pre");
    pres.forEach(pre => {
        if (pre.querySelector(".code-copy-btn")) return;

        const btn = document.createElement("button");
        btn.className = "code-copy-btn";
        btn.innerHTML = '<i class="fas fa-copy"></i> Copy';

        btn.onclick = () => {
            const code = pre.innerText.trim();
            navigator.clipboard.writeText(code);
            btn.innerHTML = '<i class="fas fa-check"></i> Copied';
            setTimeout(() => {
                btn.innerHTML = '<i class="fas fa-copy"></i> Copy';
            }, 1500);
        };

        pre.appendChild(btn);
    });
}

const msgActions = {
    copy(btn) {
        const text = btn.closest(".chat").querySelector(".msg-markdown").innerText;
        navigator.clipboard.writeText(text);
    },

    edit(btn) {
        const chatDiv = btn.closest(".chat");
        const index = chatDiv.dataset.index;
        const msgDiv = chatDiv.querySelector(".msg-markdown");

        const textarea = document.createElement("textarea");
        textarea.value = converter.makeMarkdown(msgDiv.innerHTML);
        textarea.style.width = "100%";
        textarea.style.marginBottom = "10px";

        msgDiv.replaceWith(textarea);

        textarea.focus();

        textarea.addEventListener("blur", () => {
            chatHistory.history[index].content = textarea.value;
            chatHistory.save();
            chatHistory.update();
        });
    },

    delete(btn) {
        const chatDiv = btn.closest(".chat");
        const index = parseInt(chatDiv.dataset.index);
        chatHistory.remove(index);
        chatHistory.update();
    }
};

async function getChatResponse() {
    const userText = chatInput.value.trim();
    if (!userText) return;

    chatInput.value = "";
    chatInput.style.height = `${initialInputHeight}px`;

    chatHistory.add(userText, "user");
    chatHistory.update();
    showTypingAnimation();

    const messages = [
        { role: "system", content: ProcessText(
            sysprompt()?.value || defaultSystemPrompt
        )},
        ...chatHistory.history
    ];

    try {
        const response = await fetch("https://text.pollinations.ai/openai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                messages,
                model: "openai"
            })
        });

        const text = await response.text();
        const content = JSON.parse(text).choices[0].message.content;

        document.querySelector(".typing-animation")?.closest(".chat")?.remove();

        chatHistory.add(content, "assistant");
        chatHistory.update();
    } catch (err) {
        chatHistory.add("Error retrieving response.");
        chatHistory.update();
    }
}

function showTypingAnimation() {
    const html = `
    <div class="chat incoming">
        <div class="chat-content">
            <div class="chat-details">
                <div class="msg-markdown">
                    <div class="typing-animation">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
    chatContainer.insertAdjacentHTML("beforeend", html);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

sendButton.addEventListener("click", getChatResponse);

chatInput.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        getChatResponse();
    }
});

deleteButton.addEventListener("click", () => {
    if (confirm("Delete all chats?")) {
        chatHistory.clear();
        chatHistory.update();
    }
});

window.addEventListener("load", () => {
    const sysPromptEl = sysprompt();
    if (sysPromptEl) {
        sysPromptEl.value =
            localStorage.getItem("sys-prompt") || defaultSystemPrompt;
    }

    chatHistory.load();
    chatHistory.update();
});
