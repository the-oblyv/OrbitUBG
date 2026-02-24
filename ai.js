const API_URL = "https://text.pollinations.ai/openai";

const input = document.getElementById("aiInput");
const chat = document.getElementById("aiChat");
const sendBtn = document.getElementById("sendBtn");
const attachBtn = document.getElementById("attachBtn");
const imageBtn = document.getElementById("imageBtn");
const trashBtn = document.getElementById("trashBtn");
const fileInput = document.getElementById("aiFile");

let contents = JSON.parse(localStorage.getItem("orbitChat")) || [];

const systemPrompt = `You are Orbit AI. Respond in a calm, neutral, professional tone similar to ChatGPT.
Be clear, structured, and helpful. Do not roleplay unless asked to. Do not over simulate emotions or overreact (You may show empathy).
If unsure about factual information, say so briefly.
When generating an image, insert markdown:
![description](https://image.pollinations.ai/prompt/description?width=1024&height=1024)`;

function saveChat() {
  localStorage.setItem("orbitChat", JSON.stringify(contents));
}

function scrollDown() {
  chat.scrollTop = chat.scrollHeight;
}

function renderMarkdown(text) {
  return marked.parse(text || "");
}

function enhanceCodeBlocks(container) {
  Prism.highlightAllUnder(container);
}

function createWrapper(role) {
  const wrapper = document.createElement("div");
  wrapper.className = `aiWrapper ${role}`;
  chat.appendChild(wrapper);
  return wrapper;
}

function addCopyControls(wrapper, text) {
  const controls = document.createElement("div");
  controls.style.display = "flex";
  controls.style.gap = "14px";
  controls.style.marginTop = "6px";

  const copyBtn = document.createElement("button");
  copyBtn.className = "aiMessageCopy";
  copyBtn.innerHTML = `<i class="fa-solid fa-copy"></i> Copy`;

  copyBtn.onclick = () => {
    navigator.clipboard.writeText(text).then(() => {
      copyBtn.innerHTML = `<i class="fa-solid fa-check"></i> Copied`;
      setTimeout(() => {
        copyBtn.innerHTML = `<i class="fa-solid fa-copy"></i> Copy`;
      }, 1200);
    });
  };

  const regenBtn = document.createElement("button");
  regenBtn.className = "aiMessageCopy";
  regenBtn.innerHTML = `<i class="fa-solid fa-rotate"></i> Regenerate`;

  regenBtn.onclick = regenerateLast;

  controls.appendChild(copyBtn);
  controls.appendChild(regenBtn);
  wrapper.appendChild(controls);
}

function addMessage(role, text, save = true) {
  const wrapper = createWrapper(role);
  const bubble = document.createElement("div");
  bubble.className = `aiMsg ${role}`;
  bubble.innerHTML = renderMarkdown(text);
  wrapper.appendChild(bubble);
  enhanceCodeBlocks(bubble);

  if (role === "model") {
    addCopyControls(wrapper, text);
  }

  scrollDown();

  if (save) {
    contents.push({ role, content: text });
    saveChat();
  }
}

async function sendToAI(userText) {
  addMessage("user", userText);

  const wrapper = createWrapper("model");
  const bubble = document.createElement("div");
  bubble.className = "aiMsg model";
  bubble.innerText = "Thinking...";
  wrapper.appendChild(bubble);
  scrollDown();

  try {
    const messages = [
      { role: "system", content: systemPrompt },
      ...contents.map(m => ({
        role: m.role === "model" ? "assistant" : m.role,
        content: m.content
      }))
    ];

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        model: "openai",
        jsonMode: false,
        seed: Math.floor(Math.random() * 10000)
      })
    });

    const data = await res.json();
    const reply =
      data?.choices?.[0]?.message?.content ||
      "No response received.";

    bubble.innerHTML = renderMarkdown(reply);
    enhanceCodeBlocks(bubble);

    contents.push({ role: "model", content: reply });
    saveChat();

  } catch (err) {
    bubble.innerText = "Request failed.";
  }
}

function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  input.value = "";
  sendToAI(text);
}

async function regenerateLast() {
  for (let i = contents.length - 1; i >= 0; i--) {
    if (contents[i].role === "model") {
      contents.splice(i, 1);
      break;
    }
  }

  chat.querySelectorAll(".aiWrapper.model").forEach((el, index, arr) => {
    if (index === arr.length - 1) el.remove();
  });

  saveChat();

  const lastUser = [...contents].reverse().find(m => m.role === "user");
  if (lastUser) {
    sendToAI(lastUser.content);
  }
}

function clearChat() {
  if (!confirm("Delete entire chat history?")) return;
  contents = [];
  chat.innerHTML = "";
  localStorage.removeItem("orbitChat");
}

imageBtn.addEventListener("click", () => {
  input.value = "Generate an image of ";
  input.focus();
});

attachBtn.addEventListener("click", () => fileInput.click());

trashBtn.addEventListener("click", clearChat);

sendBtn.addEventListener("click", sendMessage);

input.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

window.addEventListener("load", () => {
  if (contents.length === 0) {
    addMessage("model", "Hello. I'm **Orbit AI**. How can I assist you?", false);
  } else {
    contents.forEach(msg => {
      addMessage(msg.role, msg.content, false);
    });
  }
});
