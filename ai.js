const TEXT_API = "https://text.pollinations.ai/";
const IMAGE_API = "https://image.pollinations.ai/prompt/";

const input = document.getElementById("aiInput");
const chat = document.getElementById("aiChat");
const sendBtn = document.getElementById("sendBtn");
const attachBtn = document.getElementById("attachBtn");
const imageBtn = document.getElementById("imageBtn");
const trashBtn = document.getElementById("trashBtn");
const fileInput = document.getElementById("aiFile");

let contents = JSON.parse(localStorage.getItem("orbitChat")) || [];
let thinkingInterval = null;

const systemPrompt = `
You are Orbit AI.
Respond clearly and professionally.
When generating images, insert markdown:
![{description}](<https://image.pollinations.ai/prompt/{description}?width={width}&height={height})>)
`;

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

  container.querySelectorAll("pre").forEach(block => {
    if (block.querySelector(".code-copy")) return;

    const btn = document.createElement("button");
    btn.innerText = "Copy";
    btn.className = "code-copy";

    btn.onclick = () => {
      const code = block.innerText;
      navigator.clipboard.writeText(code);
      btn.innerText = "Copied";
      setTimeout(() => btn.innerText = "Copy", 1200);
    };

    block.style.position = "relative";
    btn.style.position = "absolute";
    btn.style.top = "6px";
    btn.style.right = "6px";

    block.appendChild(btn);
  });
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

async function sendToAI(userText) {
  addMessage("user", userText);

  const wrapper = createWrapper("model");
  const bubble = document.createElement("div");
  bubble.className = "aiMsg model";
  wrapper.appendChild(bubble);

  startThinkingAnimation(bubble);

  try {
    const prompt = systemPrompt + "\n\n" + contents.map(m => `${m.role}: ${m.content}`).join("\n");

    const res = await fetch(TEXT_API + encodeURIComponent(prompt), {
      method: "GET"
    });

    stopThinkingAnimation();

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let result = "";

    bubble.innerHTML = "";
    contents.push({ role: "model", content: "" });

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      result += chunk;

      bubble.innerHTML = renderMarkdown(result);
      enhanceCodeBlocks(bubble);
      scrollDown();

      contents[contents.length - 1].content = result;
    }

    saveChat();

  } catch (err) {
    stopThinkingAnimation();
    bubble.innerText = "Request failed.";
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
      const img = `![uploaded image](${e.target.result})`;
      input.value += "\n" + img;
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
    addMessage("model", "Hello. I'm **Orbit AI**. How can I assist you?", false);
  } else {
    contents.forEach(msg => {
      addMessage(msg.role, msg.content, false);
    });
  }
});
