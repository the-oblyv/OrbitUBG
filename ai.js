const endpoint = "https://9.dmvdriverseducation.org/worker/ai/chat";

const input = document.getElementById("aiInput");
const chat = document.getElementById("aiChat");
const sendBtn = document.getElementById("sendBtn");
const attachBtn = document.getElementById("attachBtn");
const fileInput = document.getElementById("aiFile");

let contents = [];
let pendingAttachments = [];
let identityInjected = false;
let lastUserParts = null;

const starters = [
  { starterName: "Explain quantum computing simply", starterText: "Explain quantum computing simply" },
  { starterName: "Help me write a resume", starterText: "Help me write a resume" },
  { starterName: "Give me a coding project idea", starterText: "Give me a coding project idea" },
  { starterName: "Summarize a topic for me", starterText: "Summarize a topic for me" }
];

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
        setTimeout(() => { btn.innerHTML = `<i class="fa-solid fa-copy"></i> Copy code`; }, 1200);
      });
    };
    pre.appendChild(btn);
  });
}

function enhance(container) {
  Prism.highlightAllUnder(container);
  addCodeCopyButtons(container);
}

function addActions(wrapper, text) {
  const actions = document.createElement("div");
  actions.style.display = "flex";
  actions.style.gap = "6px";
  actions.style.marginTop = "6px";

  const copyBtn = document.createElement("button");
  copyBtn.className = "aiMessageCopy";
  copyBtn.innerHTML = `<i class="fa-regular fa-copy"></i> Copy`;
  copyBtn.onclick = () => {
    navigator.clipboard.writeText(text).then(() => {
      copyBtn.innerHTML = `<i class="fa-solid fa-check"></i> Copied`;
      setTimeout(() => { copyBtn.innerHTML = `<i class="fa-regular fa-copy"></i> Copy`; }, 1200);
    });
  };

  const regenBtn = document.createElement("button");
  regenBtn.className = "aiRegenerateBtn";
  regenBtn.innerHTML = `<i class="fa-solid fa-rotate"></i> Regenerate`;
  regenBtn.onclick = () => {
    if (!lastUserParts) return;
    wrapper.remove();
    contents.pop();
    sendMessage(true);
  };

  actions.appendChild(copyBtn);
  actions.appendChild(regenBtn);
  wrapper.appendChild(actions);
}

function addUserTextMessage(text) {
  const wrapper = createWrapper("user");
  const msg = createMessage("user", wrapper);
  msg.innerHTML = renderMarkdown(text);
  enhance(msg);
}

function renderStarters() {
  const container = document.createElement("div");
  container.className = "aiStarters";
  starters.forEach(starter => {
    const btn = document.createElement("button");
    btn.className = "aiStarterBtn";
    btn.textContent = starter.starterName;
    btn.onclick = () => {
      input.value = starter.starterText;
      container.remove();
      sendMessage();
    };
    container.appendChild(btn);
  });
  document.querySelector(".aiInputWrapper").before(container);
}

async function sendMessage(isRegenerate = false) {
  if (!isRegenerate && !input.value.trim() && pendingAttachments.length === 0) return;

  const parts = [];

  if (!identityInjected) {
    parts.push({ text: "You are Orbit AI, an AI assistant created by gmacbride for https://orbit.foo.ng/. Provide helpful responses." });
    identityInjected = true;
  }

  if (!isRegenerate) {
    if (input.value.trim()) parts.push({ text: input.value.trim() });

    if (pendingAttachments.length) {
      const promises = pendingAttachments.map(file => new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result.split(",")[1];
          resolve({ inlineData: { mimeType: file.type || "application/octet-stream", data: base64 } });
        };
        reader.readAsDataURL(file.file);
      }));
      const loadedFiles = await Promise.all(promises);
      parts.push(...loadedFiles);
      pendingAttachments = [];
    }

    lastUserParts = parts;
    contents.push({ role: "user", parts });

    if (input.value.trim()) addUserTextMessage(input.value.trim());
    input.value = "";
    const startersDiv = document.querySelector(".aiStarters");
    if (startersDiv) startersDiv.remove();
  } else {
    contents.push({ role: "user", parts: lastUserParts });
  }

  const wrapper = createWrapper("model");
  const loading = createMessage("model", wrapper);
  loading.innerHTML = renderMarkdown("_Thinking..._");

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents, generationConfig: { temperature: 0.7 } })
    });
    const json = await res.json();
    const responseText = json?.candidates?.[0]?.content?.parts?.[0]?.text || json?.text || "(No response)";

    contents.push({ role: "model", parts: [{ text: responseText }] });
    loading.innerHTML = renderMarkdown(responseText);
    enhance(loading);
    addActions(wrapper, responseText);

  } catch (err) {
    loading.innerHTML = "Request Failed: " + err.message;
  }

  chat.scrollTop = chat.scrollHeight;
}

function sendInitialMessage() {
  const welcomeText = "Hello! I'm Orbit AI. How can I help you today?";
  const wrapper = createWrapper("model");
  const msg = createMessage("model", wrapper);
  msg.innerHTML = renderMarkdown(welcomeText);
  enhance(msg);
  addActions(wrapper, welcomeText);
  contents.push({ role: "model", parts: [{ text: welcomeText }] });
  renderStarters();
}

attachBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", () => {
  Array.from(fileInput.files).forEach(file => {
    pendingAttachments.push({ file });
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

sendInitialMessage();
