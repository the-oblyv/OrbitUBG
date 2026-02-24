const HF_TEXT_API =
  "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2";

const HF_IMAGE_API =
  "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0";

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
Respond clearly, professionally, and structured.
Avoid roleplay. Avoid emotions.
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
      navigator.clipboard.writeText(block.innerText);
      btn.innerText = "Copied";
      setTimeout(() => (btn.innerText = "Copy"), 1200);
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

async function generateHFText(prompt) {
  const response = await fetch(HF_TEXT_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${HF_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        max_new_tokens: 800,
        temperature: 0.7,
        return_full_text: false
      }
    })
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  return data[0]?.generated_text || "No response.";
}

async function generateHFImage(prompt) {
  const response = await fetch(HF_IMAGE_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${HF_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      inputs: prompt
    })
  });

  if (!response.ok) {
    throw new Error("Image generation failed");
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

async function sendToAI(userText) {
  addMessage("user", userText);

  // IMAGE REQUEST
  if (userText.toLowerCase().startsWith("generate an image of")) {
    const prompt = userText.replace("generate an image of", "").trim();
    const bubble = addMessage("model", "Generating image...", false);

    try {
      const imgUrl = await generateHFImage(prompt);
      bubble.innerHTML = `<img src="${imgUrl}" style="max-width:100%;border-radius:12px;">`;

      contents.push({
        role: "model",
        content: `![${prompt}](${imgUrl})`
      });

      saveChat();
    } catch (err) {
      bubble.innerText = "Image generation failed.";
    }

    return;
  }

  // TEXT REQUEST
  const wrapper = createWrapper("model");
  const bubble = document.createElement("div");
  bubble.className = "aiMsg model";
  wrapper.appendChild(bubble);

  startThinkingAnimation(bubble);

  try {
    const conversation =
      systemPrompt +
      "\n\n" +
      contents.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n") +
      `\nUSER: ${userText}\nASSISTANT:`;

    const reply = await generateHFText(conversation);

    stopThinkingAnimation();

    bubble.innerHTML = renderMarkdown(reply);
    enhanceCodeBlocks(bubble);

    contents.push({ role: "model", content: reply });
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
    addMessage("model", "Hello. I'm **Orbit AI**. How can I assist you?", false);
  } else {
    contents.forEach(msg => {
      addMessage(msg.role, msg.content, false);
    });
  }
});
