const endpoint = "https://9.dmvdriverseducation.org/worker/ai/chat";

const input = document.getElementById("aiInput");
const chat = document.getElementById("aiChat");
const sendBtn = document.getElementById("sendBtn");
const attachBtn = document.getElementById("attachBtn");
const fileInput = document.getElementById("aiFile");

let contents = [];
let pendingAttachments = [];
let identityInjected = false;

function createWrapper(role) {
  const wrapper = document.createElement("div");
  wrapper.className = `aiWrapper ${role}`;
  chat.appendChild(wrapper);
  chat.scrollTop = chat.scrollHeight;
  return wrapper;
}

function createMessage(role, wrapper) {
  const div = document.createElement("div");
  div.className = `aiMsg ${role}`;
  wrapper.appendChild(div);
  return div;
}

function renderMarkdown(text) {
  return marked.parse(text || "");
}

function addCodeCopyButtons(container) {
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

function addMessageButtons(wrapper, rawText) {
  const container = document.createElement("div");
  container.style.display = "flex";
  container.style.gap = "10px";
  container.style.marginTop = "6px";

  const copyBtn = document.createElement("button");
  copyBtn.className = "aiMessageCopy";
  copyBtn.innerHTML = `<i class="fa-regular fa-copy"></i> Copy`;
  copyBtn.onclick = () => {
    navigator.clipboard.writeText(rawText).then(() => {
      copyBtn.innerHTML = `<i class="fa-solid fa-check"></i> Copied`;
      setTimeout(() => {
        copyBtn.innerHTML = `<i class="fa-regular fa-copy"></i> Copy`;
      }, 1200);
    });
  };

  const regenBtn = document.createElement("button");
  regenBtn.className = "aiMessageCopy";
  regenBtn.innerHTML = `<i class="fa-solid fa-arrows-rotate"></i> Regenerate`;
  regenBtn.onclick = async () => {
    contents = contents.filter(
      m => !(m.role === "model" && m.parts?.[0]?.text === rawText)
    );
    wrapper.remove();
    await sendMessage();
  };

  container.appendChild(copyBtn);
  container.appendChild(regenBtn);
  wrapper.appendChild(container);
}

function enhance(container) {
  Prism.highlightAllUnder(container);
  addCodeCopyButtons(container);
}

function addUserTextMessage(text) {
  const wrapper = createWrapper("user");
  const msg = createMessage("user", wrapper);
  msg.innerHTML = renderMarkdown(text);
  enhance(msg);
}

async function sendMessage(textOverride) {
  const text = textOverride || input.value.trim();
  if (!text && pendingAttachments.length === 0) return;

  if (!textOverride && text) addUserTextMessage(text);

  const parts = [];

  if (!identityInjected) {
    contents.push({
      role: "model",
      parts: [
        {
          text: "Hello! I'm Orbit AI. How can I help you today?"
        }
      ]
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

  if (parts.length > 0) contents.push({ role: "user", parts });

  if (!textOverride) input.value = "";
  pendingAttachments = [];

  const wrapper = createWrapper("model");
  const loadingMsg = createMessage("model", wrapper);
  loadingMsg.innerHTML = renderMarkdown("_Thinking..._");

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
    enhance(loadingMsg);
    addMessageButtons(wrapper, responseText);
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
        mimeType: file.type || "application/octet-stream",
        base64
      });
    };
    reader.readAsDataURL(file);
  });
  fileInput.value = "";
});

sendBtn.addEventListener("click", () => sendMessage());

input.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

sendMessage();
