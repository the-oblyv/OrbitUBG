const endpoint = "https://9.dmvdriverseducation.org/worker/ai/chat";

const input = document.getElementById("aiInput");
const chat = document.getElementById("aiChat");
const sendBtn = document.getElementById("sendBtn");
const attachBtn = document.getElementById("attachBtn");
const fileInput = document.getElementById("aiFile");

let contents = [];
let pendingAttachments = [];
let lastUserParts = null;

function scrollDown() {
  chat.scrollTop = chat.scrollHeight;
}

function createWrapper(role) {
  const wrapper = document.createElement("div");
  wrapper.className = `aiWrapper ${role}`;
  chat.appendChild(wrapper);
  return wrapper;
}

function renderMarkdown(text) {
  return marked.parse(text || "");
}

function enhanceCodeBlocks(container) {
  Prism.highlightAllUnder(container);
  container.querySelectorAll("pre").forEach(pre => {
    if (pre.querySelector(".aicopy-btn")) return;
    const btn = document.createElement("button");
    btn.className = "aicopy-btn";
    btn.innerHTML = `<i class="fa-solid fa-copy"></i> Copy code`;
    const code = pre.querySelector("code");
    btn.onclick = () => {
      navigator.clipboard.writeText(code.innerText).then(() => {
        btn.innerHTML = `<i class="fa-solid fa-check"></i> Copied`;
        setTimeout(() => {
          btn.innerHTML = `<i class="fa-solid fa-copy"></i> Copy code`;
        }, 1200);
      });
    };
    pre.appendChild(btn);
  });
}

function addCopyControls(wrapper, text) {
  const controls = document.createElement("div");
  controls.style.display = "flex";
  controls.style.gap = "14px";
  controls.style.marginTop = "6px";
  controls.style.alignItems = "center";

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
  regenBtn.onclick = () => regenerateLast();

  controls.appendChild(copyBtn);
  controls.appendChild(regenBtn);
  wrapper.appendChild(controls);
}

function addMessage(role, text) {
  const wrapper = createWrapper(role);
  const bubble = document.createElement("div");
  bubble.className = `aiMsg ${role}`;
  bubble.innerHTML = renderMarkdown(text);
  wrapper.appendChild(bubble);
  enhanceCodeBlocks(bubble);
  if (role === "model") addCopyControls(wrapper, text);
  scrollDown();
  return bubble;
}

function addAttachmentPreview(file, dataUrl) {
  const wrapper = createWrapper("user");
  const bubble = document.createElement("div");
  bubble.className = "aiMsg user";

  if (file.type.startsWith("image/")) {
    bubble.innerHTML = `
      <div><strong>Attached:</strong> ${file.name}</div>
      <img src="${dataUrl}" style="max-width:250px;border-radius:12px;margin-top:8px;">
    `;
  } else if (file.type.startsWith("audio/")) {
    bubble.innerHTML = `
      <div><strong>Attached:</strong> ${file.name}</div>
      <audio controls src="${dataUrl}" style="margin-top:8px;"></audio>
    `;
  } else if (file.type.startsWith("video/")) {
    bubble.innerHTML = `
      <div><strong>Attached:</strong> ${file.name}</div>
      <video controls src="${dataUrl}" style="max-width:300px;border-radius:12px;margin-top:8px;"></video>
    `;
  } else {
    bubble.innerHTML = `<div><strong>Attached:</strong> ${file.name}</div>`;
  }

  wrapper.appendChild(bubble);
  scrollDown();
}

async function sendToAI() {
  const loadingBubble = addMessage("model", "_Thinking..._");

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.3,
          topP: 0.8,
          topK: 40
        }
      })
    });

    const json = await res.json();

    const responseText =
      json?.candidates?.[0]?.content?.parts?.[0]?.text ||
      json?.text ||
      "No response received.";

    contents.push({
      role: "model",
      parts: [{ text: responseText }]
    });

    const wrapper = loadingBubble.parentElement;
    wrapper.innerHTML = "";
    const bubble = document.createElement("div");
    bubble.className = "aiMsg model";
    bubble.innerHTML = renderMarkdown(responseText);
    wrapper.appendChild(bubble);
    enhanceCodeBlocks(bubble);
    addCopyControls(wrapper, responseText);
    scrollDown();
  } catch (err) {
    loadingBubble.innerHTML = "Request Failed: " + err.message;
  }
}

async function sendMessage() {
  const text = input.value.trim();
  if (!text && pendingAttachments.length === 0) return;

  if (text) addMessage("user", text);

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
  lastUserParts = parts;

  input.value = "";
  pendingAttachments = [];

  await sendToAI();
}

async function regenerateLast() {
  if (!lastUserParts) return;

  const modelWrappers = chat.querySelectorAll(".aiWrapper.model");
  if (modelWrappers.length > 0) {
    modelWrappers[modelWrappers.length - 1].remove();
  }

  for (let i = contents.length - 1; i >= 0; i--) {
    if (contents[i].role === "model") {
      contents.splice(i, 1);
      break;
    }
  }

  await sendToAI();
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

window.addEventListener("load", () => {
  addMessage("model", "Hello. I'm **Orbit AI**. How can I assist you?");
});
