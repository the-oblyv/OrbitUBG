const POLL_TEXT_API = "https://text.pollinations.ai/prompt";
const POLL_IMAGE_API = "https://image.pollinations.ai/prompt";

const input = document.getElementById("aiInput");
const chat = document.getElementById("aiChat");
const sendBtn = document.getElementById("sendBtn");
const attachBtn = document.getElementById("attachBtn");
const imageBtn = document.getElementById("imageBtn");
const trashBtn = document.getElementById("trashBtn");
const fileInput = document.getElementById("aiFile");

let contents = JSON.parse(localStorage.getItem("orbitChat")) || [];
let thinkingInterval = null;
let lastUserMessage = null;

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

function addControls(bubble, text) {
  const controls = document.createElement("div");
  controls.className = "aiControls";

  const copyBtn = document.createElement("button");
  copyBtn.textContent = "Copy";
  copyBtn.onclick = () => navigator.clipboard.writeText(text);

  const regenBtn = document.createElement("button");
  regenBtn.textContent = "Regenerate";
  regenBtn.onclick = () => {
    if (lastUserMessage) sendToAI(lastUserMessage, true);
  };

  controls.appendChild(copyBtn);
  controls.appendChild(regenBtn);
  bubble.appendChild(controls);
}

function addMessage(role, text, save = true) {
  const wrapper = createWrapper(role);
  const bubble = document.createElement("div");
  bubble.className = `aiMsg ${role}`;
  bubble.innerHTML = renderMarkdown(text);
  wrapper.appendChild(bubble);

  enhanceCodeBlocks(bubble);
  scrollDown();

  if (role === "assistant") {
    addControls(bubble, text);
  }

  if (save) {
    contents.push({ role, content: text });
    saveChat();
  }

  return bubble;
}

function startThinkingAnimation(bubble) {
  let dots = 1;
  bubble.innerText = "Thinking.";
  thinkingInterval = setInterval(() => {
    dots = (dots % 3) + 1;
    bubble.innerText = "Thinking" + ".".repeat(dots);
  }, 400);
}

function stopThinkingAnimation() {
  clearInterval(thinkingInterval);
}

function fakeStreamText(fullText, bubble, speed = 15) {
  let index = 0;
  let buffer = "";

  bubble.innerHTML = "";
  bubble.style.whiteSpace = "pre-wrap";

  function type() {
    if (index < fullText.length) {
      buffer += fullText[index];
      bubble.textContent = buffer;
      index++;
      scrollDown();
      setTimeout(type, speed);
    } else {
      bubble.style.whiteSpace = "";
      bubble.innerHTML = renderMarkdown(fullText);
      enhanceCodeBlocks(bubble);
      addControls(bubble, fullText);
      scrollDown();
    }
  }

  type();
}

async function generateImage(prompt) {
  const url = `${POLL_IMAGE_API}/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Image failed");
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

async function generateText(userText) {
  const prompt = `You are Orbit AI. Reply concisely.\n\n${userText}`;
  const url = `${POLL_TEXT_API}?q=${encodeURIComponent(prompt)}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Text API error");

  return await res.text();
}

async function sendToAI(userText, regenerate = false) {
  if (!regenerate) {
    addMessage("user", userText);
  }

  lastUserMessage = userText;

  const wrapper = createWrapper("assistant");
  const bubble = document.createElement("div");
  bubble.className = "aiMsg assistant";
  wrapper.appendChild(bubble);

  startThinkingAnimation(bubble);

  try {
    const reply = await generateText(userText);

    stopThinkingAnimation();

    fakeStreamText(reply.trim(), bubble, 15);

    contents.push({ role: "assistant", content: reply });
    saveChat();
  } catch (err) {
    stopThinkingAnimation();
    bubble.innerText = "Request failed.";
    console.error(err);
  }
}

function sendMessage() {
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  sendToAI(text);
}

function clearChat() {
  if (!confirm("Delete entire chat history?")) return;
  contents = [];
  chat.innerHTML = "";
  localStorage.removeItem("orbitChat");
}

imageBtn.onclick = () => {
  input.value = "Generate an image of ";
  input.focus();
};

attachBtn.onclick = () => fileInput.click();

fileInput.onchange = () => {
  const files = Array.from(fileInput.files);
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      input.value += `\n![uploaded image](${e.target.result})`;
    };
    reader.readAsDataURL(file);
  });
};

trashBtn.onclick = clearChat;
sendBtn.onclick = sendMessage;

input.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

window.onload = () => {
  if (contents.length === 0) {
    addMessage("assistant", "Hello. I'm **Orbit AI**. How can I assist you?", false);
  } else {
    contents.forEach(msg => addMessage(msg.role, msg.content, false));
  }
};
