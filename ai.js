var converter = new showdown.Converter();
    const chatInput = document.querySelector("#chat-input");
    const sendButton = document.querySelector("#send-btn");
    const chatContainer = document.querySelector(".chat-container");
    const deleteButton = document.querySelector("#delete-btn");
    const imageButton = document.querySelector("#image-btn");
    const sysprompt = ()=>{return document.getElementById("system-prompt")}
    const initialInputHeight = chatInput.scrollHeight;
    let userText = null;
    
    const defaultText = `<div class="default-text">
                                <h1>Orbit AI</h1>
                            </div>`

    const defaultSystemPrompt = `You are Orbit AI, an AI assistant made by gmacbride for https://orbit.foo.ng. Respond in the user's language as concisely as possible.
    
Current Date: __DATE__
User Language: __LANGUAGE__
            
When the user asks to generate an image, insert the following markdown "![{description}](<https://image.pollinations.ai/prompt/{description}?width={width}&height={height}>)" and fill in the information inside the brackets`
    
    async function ProcessImage(img, language = "por") {
        const worker = await Tesseract.createWorker(language);
        const ret = await worker.recognize(img);
        console.log(ret.data.text);
        await worker.terminate();
    }

    function addCopyButtonsToPreElements(container) {
        const pres = container.querySelectorAll('pre');
        pres.forEach(pre => {
            if (!pre.querySelector('.code-copy-btn')) {
                let btn = document.createElement('button');
                btn.className = 'code-copy-btn';
                btn.innerHTML = '<i class="fas fa-copy"></i> Copy';
                btn.onclick = function() { 
                    let clone = pre.cloneNode(true);
                    let btnInClone = clone.querySelector('.code-copy-btn');
                    if(btnInClone) btnInClone.remove();
                    
                    let codeBlock = clone.querySelector('code');
                    let codeText = codeBlock ? (codeBlock.innerText || codeBlock.textContent) : (clone.innerText || clone.textContent);
                    
                    codeText = codeText.trim();
                    
                    if (!codeText) return;

                    navigator.clipboard.writeText(codeText).then(() => {
                        let originalIcon = btn.querySelector('i');
                        originalIcon.className = "fas fa-check";
                        setTimeout(() => {
                            originalIcon.className = "fas fa-copy";
                        }, 2000);
                    }).catch(err => {
                        console.error('Failed to copy: ', err);
                        alert("Could not copy code automatically. Please select and copy manually.");
                    });
                };
                pre.appendChild(btn);
            }
        });
    }
    
    const chatHistory = {
        history: [],
        toHTML: (json) => {
            if (!json)
                json = chatHistory.history
            const maindiv = document.createElement("div")
            if (json.length) {
                for (let i = 0; i < json.length; i++) {
                    const message = json[i];
    
                    const roleclass = message.role == "user" ? "outgoing" : "incoming"
                    const assistant_buttons = message.role != "user" ? `<span onclick="msgActions.retry(this)"><i class="fas fa-rotate-left"></i></span>` : ""
                    const html = `<div class="chat ${roleclass}">
                                <div class="chat-content">
                                        <div class="chat-details">
                                            <div class="msg-markdown">${converter.makeHtml(message.content)}</div>
                                        </div>
                                        <div class="chat-actions">
                                            <span onclick="msgActions.copy(this)"><i class="fas fa-copy"></i></span>
                                            <span onclick="msgActions.edit(this)"><i class="fas fa-pencil"></i></span>
                                            <span onclick="msgActions.delete(this)"><i class="fas fa-trash"></i></span>
                                            ${assistant_buttons}
                                        </div>
                                    </div>
                                </div>`;
                    maindiv.innerHTML += html
                }
            } else {
                maindiv.innerHTML = defaultText
            }
            return maindiv
        },
        getHistoryJson: (elem) => {
            if (elem) {
                const role = elem.querySelector(".msg-markdown").className.split(" ").includes("outgoing") ? "user" : "assistant";
                const isUser = elem.parentElement.parentElement.classList.contains("outgoing");
                return { role: isUser ? "user" : "assistant", content: converter.makeMarkdown(elem.querySelector(".msg-markdown").innerHTML).trim() }
            }
            else {
                const chatContainer = document.querySelector(".chat-container").children;
                if (chatContainer.length && chatContainer[0].classList.contains("default-text"))
                    return [];
                let chathistory = [];
                const istyping = document.querySelector(".chat-container").querySelector(".typing-animation")
                for (let i = 0; i < chatContainer.length - (istyping ? 1 : 0); i++) {
                    const container = chatContainer[i];
                    let message = converter.makeMarkdown(container.querySelector(".msg-markdown").innerHTML).trim() || container.innerText.trim() || container.querySelector("textarea").value.trim();
                    if (container.classList.contains("outgoing")) {
                        chathistory.push({ role: 'user', content: message })
                    } else {
                        chathistory.push({ role: 'assistant', content: message })
                    }
                }
                return chathistory;
            }
    
        },
        add: (data, role = "assistant") => {
            data = { role: role, content: data }
            chatHistory.history.push(data);
        },
        remove: (index) => {
            if (index != undefined) {
                chatHistory.history.splice(index, 1)
            } else {
                chatHistory.history.splice(chatHistory.history.length - 1, 1)
            }
        },
        changeRole: (index, container, indexhistory) => {
            const roles = ["system", "user", "assistant"]
            const roleVal = container.querySelector("select").value;
            container.classList.remove("incoming"); container.classList.remove("outgoing")
            
            if (roleVal == "user")
            {
                container.classList.add("outgoing");
            } else {
                container.classList.add("incoming");
            };
            chatHistory.history[indexhistory].role = roleVal;
        },
        clear: () => {
            chatHistory.history = [];
        },
        JSON: () => {
            return chatHistory.history;
        },
        save: (fromhtml) => {
            if (fromhtml)
                chatHistory.history = chatHistory.getHistoryJson();
            localStorage.setItem("chatHistory", JSON.stringify(chatHistory.history))
        },
        load: (writechat) => {
            if (writechat) {
                chatHistory.history = writechat
                chatHistory.save();
                chatHistory.update();
            }
            return JSON.parse(localStorage.getItem("chatHistory")) ?? []
        },
        update: () => {
            chatContainer.innerHTML = chatHistory.toHTML().innerHTML
            addCopyButtonsToPreElements(chatContainer);
        }
    }
    const msgActions = {
        copy: (copyBtn) => {
            const reponseTextElement = copyBtn.parentElement.previousElementSibling.querySelector(".msg-markdown");
            navigator.clipboard.writeText(converter.makeMarkdown(reponseTextElement.innerHTML));
            const icon = copyBtn.querySelector("i");
            icon.classList.remove("fa-copy");
            icon.classList.add("fa-check");
            setTimeout(() => {
                icon.classList.remove("fa-check");
                icon.classList.add("fa-copy");
            }, 1000);
        },
        edit: (editBtn) => {
            const actionsDiv = editBtn.parentElement;
            const detailsDiv = actionsDiv.previousElementSibling;
            if (detailsDiv.querySelector("textarea") == undefined) {
                const responseTextElement = detailsDiv.querySelector(".msg-markdown");
                const textArea = document.createElement("textarea")
                textArea.className = "chat w-full"
                textArea.style.width = "100%";
                textArea.style.background = "var(--panel2)";
                textArea.style.color = "var(--text)";
                textArea.style.padding = "15px";
                textArea.style.borderRadius = "14px";
                textArea.style.marginBottom = "10px";
                textArea.value = converter.makeMarkdown(responseTextElement.innerHTML);
                detailsDiv.insertBefore(textArea, responseTextElement);
                responseTextElement.remove();
            } else {
                const textareaElement = detailsDiv.querySelector("textarea");
                const divElem = document.createElement("div");
                divElem.className = "msg-markdown"
                divElem.innerHTML = converter.makeHtml(textareaElement.value)
                detailsDiv.insertBefore(divElem, textareaElement);
                textareaElement.remove();
                chatHistory.history = chatHistory.getHistoryJson()
                addCopyButtonsToPreElements(divElem);
            }
        },
        delete: (deleteBtn) => {
            chatHistory.remove([].indexOf.call(chatContainer.children, deleteBtn.parentNode.parentNode.parentNode));
            chatHistory.update();
        },
        retry: (retryBtn) => {
            chatContainer.lastChild.remove();
            chatHistory.remove([].indexOf.call(chatContainer.children, retryBtn.parentNode.parentNode.parentNode));
            getChatResponse();
        }
    }
    const createChatElement = (content, className) => {
        const chatDiv = document.createElement("div");
        chatDiv.classList.add("chat", className);
        chatDiv.innerHTML = content;
        return chatDiv;
    }
    
    const getChatResponse = async () => {
        const sysPromptEl = sysprompt();
        if (sysPromptEl) {
            localStorage.setItem("sys-prompt", sysPromptEl.value);
        }
        let userText = chatInput.value.trim();

        chatInput.value = "";
        chatInput.style.height = `${initialInputHeight}px`;
        chatContainer.querySelector(".default-text")?.remove();

        const lowerUserText = userText.toLowerCase();

        if (lowerUserText.startsWith("generate an image of")) {
            chatHistory.add(userText, "user");
            chatHistory.update();
            
            showTypingAnimation();

            const prompt = userText.replace(/^generate an image of/i, "").trim();
            try {
                const dataUrl = await generateImage(prompt);
                
                const loading = document.querySelector(".chat.incoming:last-child");
                if(loading) loading.remove();

                if (dataUrl) {
                    chatHistory.add(`<img src="${dataUrl}" alt="Generated Image" style="max-width: 100%; border-radius: 12px; margin-top: 10px;">`, "assistant");
                } else {
                    chatHistory.add("Sorry, I couldn't generate the image.", "assistant");
                }
            } catch (error) {
                console.error(error);
                const loading = document.querySelector(".chat.incoming:last-child");
                if(loading) loading.remove();
                chatHistory.add("Error generating image: " + error.message, "assistant");
            }
            chatHistory.update();
            return;
        }

        const API_URL = "https://text.pollinations.ai/openai";
        if (userText != "")
            chatHistory.add(userText, "user");
        chatHistory.update();
        showTypingAnimation();
        let messages = [
            { role: 'system', content: ProcessText(sysPromptEl ? sysPromptEl.value : defaultSystemPrompt) },
        ];
        messages = messages.concat(chatHistory.getHistoryJson(null, true))
        const requestOptions = {
            method: "POST",
            headers: {
                "Content-Type": "application/json;charset=UTF-8",
            },
            body: JSON.stringify({
                messages: messages,
                model: document.getElementById("model_list") ? document.getElementById("model_list").selectedOptions[0].value : "openai",
                jsonMode: false,
                seed: userText != "" ? 42 : Math.round(Math.random() * 1000),
            })
        }
        try {
            const response = await (await fetch(API_URL, requestOptions)).text();
            const content = JSON.parse(response).choices[0].message.content || content
            chatHistory.add(content);
        } catch (error) {
            chatHistory.add("Oops! Something went wrong while retrieving the response. Please try again.");
        }
        chatHistory.update();
    }
    const showTypingAnimation = () => {
        const html = `<div class="chat-content">
                        <div class="chat-details">
                            <div class="msg-markdown">
                                <div class="typing-animation">
                                    <div class="typing-dot"></div>
                                    <div class="typing-dot"></div>
                                    <div class="typing-dot"></div>
                                </div>
                            </div>
                        </div>
                    </div>`;
        const incomingChatDiv = createChatElement(html, "incoming");
        chatContainer.appendChild(incomingChatDiv);
        chatContainer.scrollTo(0, chatContainer.scrollHeight);
        return incomingChatDiv;
    }
    
    
    deleteButton.addEventListener("click", () => {
        if (confirm("Are you sure you want to delete all the chats?")) {
            chatHistory.clear();
            chatHistory.save();
            loadDataFromLocalstorage();
        }
    });

    imageButton.addEventListener("click", () => {
        chatInput.value += "Generate an image of ";
        chatInput.focus();
    });
    
    chatInput.addEventListener("input", () => {
        chatInput.style.height = `${initialInputHeight}px`;
        chatInput.style.height = `${chatInput.scrollHeight}px`;
    });
    
    chatInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 800) {
            e.preventDefault();
            getChatResponse();
        }
    });
    
    sendButton.addEventListener("click", getChatResponse);
    
    const loadDataFromLocalstorage = () => {
        const sysPromptEl = sysprompt();
        if (sysPromptEl) {
            sysPromptEl.value = localStorage.getItem("sys-prompt") ?? sysPromptEl.value;
        }
        chatHistory.history = chatHistory.load();
        chatHistory.update();
        chatContainer.scrollTo(0, chatContainer.scrollHeight);
    }
    window.onload = () => {
        const sysPromptEl = sysprompt();
        if (sysPromptEl) {
            sysPromptEl.value = defaultSystemPrompt;
        }
        loadDataFromLocalstorage();
    }
    window.onbeforeunload = () => {
        chatHistory.save(true);
    }
    
    function ProcessText(text) {
        text = text.replaceAll("__DATE__", new Date().toString())
        text = text.replaceAll("__LANGUAGE__", navigator.language);
        return text
    }
