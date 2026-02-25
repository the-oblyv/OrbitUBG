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

function addMessage(role, text, save = true) {
  const wrapper = createWrapper(role);
  const bubble = document.createElement("div");
  bubble.className = `aiMsg ${role}`;
  bubble.innerHTML = renderMarkdown(text);
  wrapper.appendChild(bubble);
  enhanceCodeBlocks(bubble);
  scrollDown();

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


function fakeStreamText(fullText, bubble, speed = 12) {
  let index = 0;
  bubble.innerHTML = "";

  function type() {
    if (index < fullText.length) {
      bubble.innerText += fullText[index];
      index++;
      scrollDown();
      setTimeout(type, speed);
    } else {
      bubble.innerHTML = renderMarkdown(fullText);
      enhanceCodeBlocks(bubble);
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

async function generateText(prompt) {
  const url = `${POLL_TEXT_API}?q=${encodeURIComponent(prompt)}`;
  const res = await fetch(url);

  if (!res.ok) throw new Error("Text API error");
  const text = await res.text();
  return text || "No response.";
}


async function sendToAI(userText) {
  addMessage("user", userText);

  if (userText.toLowerCase().startsWith("generate an image of")) {
    const prompt = userText.replace("generate an image of", "").trim();
    const bubble = addMessage("assistant", "Generating image...", false);

    try {
      const imgUrl = await generateImage(prompt);
      bubble.innerHTML = `<img src="${imgUrl}" style="max-width:100%;border-radius:12px;">`;
      contents.push({
        role: "assistant",
        content: `![${prompt}](${imgUrl})`
      });
      saveChat();
    } catch {
      bubble.innerText = "Image generation failed.";
    }
    return;
  }

  const wrapper = createWrapper("assistant");
  const bubble = document.createElement("div");
  bubble.className = "aiMsg assistant";
  wrapper.appendChild(bubble);

  startThinkingAnimation(bubble);

  const historyText = contents.map(m => `${m.role}: ${m.content}`).join("\n");
  const fullPrompt = `You are Orbit AI.\n${historyText}\nuser: ${userText}\nassistant:`;

  try {
    const reply = await generateText(fullPrompt);
    stopThinkingAnimation();

    fakeStreamText(reply, bubble, 12);

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

imageBtn.addEventListener("click", () => {
  input.value = "Generate an image of ";
  input.focus();
});
attachBtn.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => {
  const files = Array.from(fileInput.files);
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      input.value += `\n![uploaded image](${e.target.result})`;
    };
    reader.readAsDataURL(file);
  });
});
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
    addMessage("assistant", "Hello. I'm **Orbit AI**. How can I assist you?", false);
  } else {
    contents.forEach(msg => addMessage(msg.role, msg.content, false));
  }
});
