<script>
    // @ts-nocheck
    import { browser } from "$app/environment";
    import { fade } from "svelte/transition";
    import MarkdownIt from "markdown-it";
    import hljs from "highlight.js";
    import mkitdeflist from "markdown-it-deflist";
    let md = new MarkdownIt().use(mkitdeflist);
    let createBubble,
        setBubblel,
        createErrorBubble,
        onEnter,
        appendHistory,
        initHistory,
        resumeHistory,
        clearConversation,
        inputText = "",
        token = "null";
    let initMessageList = [
        "Hi there! 我是Nomen，有什么帮得上的忙吗？",
        "你好！Nomen随时为你解答API疑问",
        "嗯，有什么需要帮助的吗？",
        "你猜猜你要刷新多少次才能随机到这个句子？",
        "你好呀，我是Nomen，你的智能助手",
        "这里是Nomen！有什么需要帮助的吗？"
    ];
    let isFocused = false;
    let isComposing = false;
    let isSending = false;
    function handleCompositionStart() {
        isComposing = true;
    }
    function handleCompositionEnd() {
        isComposing = false;
    }
    let initMessage = function () {
        return initMessageList[
            Math.floor(Math.random() * initMessageList.length)
        ];
    };
    let parser = (text) => {
        return md.render(text);
    };
    let tipContent = `使用Nomen AI助理，可以回答更详细的问题  
          例如：  
          "你好，你能告诉我world.onTick怎么用吗"  
          "你能帮我写一个每tick在控制台打印当前tick的代码吗？"  
          "再给我一个例子吧"  
          或者 [联系Nomen](https://shequ.codemao.cn/user/4436413)
          
-- 欢迎加入Nomen小队或者在Github上面帮助开发这个网页！  
-- 网站搭建需要成本，能不能给我资助一下呀...`;
    if (browser) {
        window.NomenMain = {
            wsSending: false,
        };
        let script_md_block = document.createElement("script");
        script_md_block.src =
            "https://cdn.jsdelivr.net/npm/marked/marked.min.js";
        document.head.appendChild(script_md_block);
        let key = "NomenMainHistory/Box3";
        let ws = window.NomenMain.ws;
        if (!window.NomenMain.ws) {
            ws = window.NomenMain.ws = new WebSocket(
                "wss://radeo2.laf.dev/__websocket__"
            );
            ws.onclose = function () {
                window.NomenMain.ws = null;
            };
            ws.onmessage = function (res) {
                let data;
                try {
                    data = JSON.parse(res.data);
                } catch (err) {
                    return;
                }
                if (data.id == 1 && data.sys) {
                    if (data.token) token = data.token;
                } else if ((data.id == -3 || data.id == -4 || data.id == -5 || data.id == -6) && data.sys) {
                    createErrorBubble(data.message);
                    console.error(data.message);
                    NomenMain.wsSending = false;
                    isSending = false;
                }
                if (data.message == "init" && data.sys) {
                    createBubble(0, { text: "", id: data.id });
                    scrollListDown();
                } else if (data.message != "init" && !data.sys && data.id) {
                    setBubblel(data.id, { text: data.message }, true);
                } else if (
                    data.sys &&
                    data.result &&
                    data.message == "finish"
                ) {
                    NomenMain.wsSending = false;
                    isSending = false;
                    appendHistory(data.result.text, data.result.id, 0);
                }
            };
            ws.onerror = function (e) {
                createErrorBubble("连接错误，请尝试刷新");
                console.error(e);
            };
        }
        function scrollListDown() {
            document.getElementById("nomen-main-list-body").scrollTop =
                document.getElementById("nomen-main-list-body").scrollHeight;
        }
        window.createBubble = createBubble = function (
            side,
            { text, id, head },
            error = false
        ) {
            let bubble = document.createElement("div");
            bubble.setAttribute(
                "class",
                `col-start-${[1, 6][side]} col-end-${[8, 13][side]
                } p-3 rounded-lg)`
            );
            bubble.innerHTML = `<div class="flex items-center ${["flex-row", "justify-start flex-row-reverse"][side]
                }">
          <div
            class="${[
                    "flex items-center justify-center h-10 w-10 rounded-full bg-main flex-shrink-0 text-amber-500 text-xs",
                    "",
                ][side]
                }"
          >
            ${head !== undefined ? head : ["Nomen", ""][side]}
          </div>
          <div
            class="${[
                    "relative ml-3 text-sm bg-white py-2 px-4 shadow rounded-xl",
                    "relative mr-3 text-sm bg-amber-300 py-2 px-4 shadow rounded-xl",
                ][side]
                } ${error ? "text-red-600" : ""}"
          >
          <div><div id="${id}"></div></div>
          </div>`;
            document.querySelector("#nomen-main-chat-body").appendChild(bubble);
            let r = document.createElement("div");
            r.innerHTML = parser(text);
            document.getElementById(id).appendChild(r);
            document.querySelectorAll("#nomen-main a").forEach((v) => {
                v.style.color = "#2c96d3";
                v.setAttribute("target", "_blank");
            });
        };
        window.setBubblel = setBubblel = function (
            id,
            { text },
            parse = false
        ) {
            if (parse) {
                let r = document.createElement("div");
                r.innerHTML = parser(text);
                document.getElementById(id).innerHTML = "";
                document.getElementById(id).appendChild(r);
                document.querySelectorAll("#nomen-main a").forEach((v) => {
                    v.style.color = "#2c96d3";
                    v.setAttribute("target", "_blank");
                });
            } else {
                document.getElementById(id).innerText = text;
            }
        };
        window.createErrorBubble = createErrorBubble = function (error) {
            createBubble(0, { text: error, id: `err-${Date.now()}` }, true);
        };
        window.initHistory = initHistory = function (key) {
            localStorage.removeItem(key);
            if (!localStorage.getItem(key))
                localStorage.setItem(key, JSON.stringify({ history: [] }));
        };
        window.appendHistory = appendHistory = function (text, id, teller) {
            if (!text || !text.length) return;
            let r;
            try {
                r = JSON.parse(localStorage.getItem(key));
                if (!r.history) throw new Error("History Cache missing");
            } catch (err) {
                window.initHistory(key);
                window.appendHistory(text, id, teller);
                return;
            }
            r.history.push({ message: text, id, teller });
            localStorage.setItem(key, JSON.stringify(r));
        };
        window.resumeHistory = resumeHistory = function () {
            let r;
            try {
                r = JSON.parse(localStorage.getItem(key));
                if (!r) throw new Error("History Cache Missing");
            } catch (err) {
                window.initHistory(key);
                return;
            }
            for (let i = 0; i < r.history.length; i++) {
                createBubble(r.history[i].teller, {
                    text: r.history[i].message,
                    id: r.history[i].id,
                });
            }
            scrollListDown();
        };
        window.onEnter = onEnter = function (fc) {
            if (inputText.length && !NomenMain.wsSending && (isFocused || fc)) {
                createBubble(1, { text: inputText.toString(), id: Date.now() });
                if (!window.NomenMain.ws) {
                    createErrorBubble("连接丢失，尝试重连... ");
                    appendHistory(inputText.toString(), Date.now(), 1);
                    setTimeout(() => window.location.reload(), 2 * 1000);
                } else {
                    try {
                        let pmdList = JSON.parse(
                            localStorage.getItem(key)
                        ).history;
                        let parentMessageId = pmdList
                            .filter((v) => v.teller == 0)
                            .slice(-1)[0]?.id;
                        ws.send(
                            JSON.stringify({
                                message: inputText.toString(),
                                parentMessageId: parentMessageId || undefined,
                                token
                            })
                        );
                        appendHistory(inputText.toString(), Date.now(), 1);
                        NomenMain.wsSending = true;
                        isSending = true;
                    } catch (err) {
                        if (err.message.includes("Still in CONNECTING state")) {
                            createErrorBubble(
                                `正在连接，请稍后尝试`
                            );
                        } else {
                            createErrorBubble(
                                `抱歉，出现了一些意外错误，请联系Nomen解决，错误信息: ${err.message}`
                            );
                        }
                    }
                }
                inputText = "";
            }
        };
        window.clearConversation = clearConversation = function () {
            document.querySelector("#nomen-main-chat-body").innerHTML = "";
            createBubble(0, { text: initMessage(), id: -1 });
            createBubble(0, { text: tipContent, id: -2, head: "" });
            localStorage.setItem(key, JSON.stringify({ history: [] }));
        };
        setTimeout(() => {
            resumeHistory();
        }, 100);
    }
</script>

<title>Nomen Chat</title>
<base target="_blank" />
<div class="flex h-screen antialiased text-gray-800" id="nomen-main">
    <div class="flex flex-row h-full w-full overflow-x-hidden">
        <div class="flex flex-col flex-auto h-full p-2">
            <div class="flex flex-col flex-auto flex-shrink-0 rounded-2xl bg-gray-100 h-full p-4"
                style="box-shadow: 1px 3px 10px 0px rgb(0 0 0 / 18%);">
                <div class="flex flex-col h-full overflow-x-auto mb-1" id="nomen-main-list-body">
                    <div class="flex flex-col h-full">
                        <div class="col-start-1 col-end-8 p-2 rounded-lg">
                            <div class="flex items-center flex-row">
                                <div class="relative ml-3 text-sm bg-white py-2 px-4 shadow rounded-xl text-gray-400">
                                    <div>
                                        这是一个由ChatGPT3.5生成的文本，可能存在违规内容，如果出现意外的违规内容，请联系Nomen
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="" id="nomen-main-chat-body">
                            <style>
                                #nomen-main a {
                                    color: #2c96d3 !important;
                                }
                            </style>
                            <div class="col-start-1 col-end-8 p-3 rounded-lg">
                                <div class="flex items-center flex-row">
                                    <div
                                        class="flex items-center justify-center h-10 w-10 rounded-full bg-main flex-shrink-0 text-amber-500 text-xs">
                                        Nomen
                                    </div>
                                    <div class="relative ml-3 text-sm bg-white py-2 px-4 shadow rounded-xl">
                                        <div>{initMessage()}</div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-start-1 col-end-8 p-3 rounded-lg">
                                <div class="flex items-center flex-row">
                                    <div
                                        class="flex items-center justify-center h-10 w-10 rounded-full bg-main flex-shrink-0 text-amber-500 text-xs" />
                                    <div class="relative ml-3 text-sm bg-white py-2 px-4 shadow rounded-xl">
                                        <div>{@html parser(tipContent)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="flex flex-row items-center h-16 rounded-xl bg-white w-full px-4">
                    <div>
                        <button class="flex items-center justify-center text-gray-400 hover:text-gray-600"
                            on:click={clearConversation}>
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 48 48"
                                xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd" clip-rule="evenodd"
                                    d="M20 5.91406H28V13.9141H43V21.9141H5V13.9141H20V5.91406Z" stroke="#333"
                                    stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
                                <path d="M8 40H40V22H8V40Z" fill="none" stroke="#333" stroke-width="4"
                                    stroke-linejoin="round" />
                                <path d="M16 39.8976V33.9141" stroke="#333" stroke-width="4" stroke-linecap="round"
                                    stroke-linejoin="round" />
                                <path d="M24 39.8977V33.8977" stroke="#333" stroke-width="4" stroke-linecap="round"
                                    stroke-linejoin="round" />
                                <path d="M32 39.8976V33.9141" stroke="#333" stroke-width="4" stroke-linecap="round"
                                    stroke-linejoin="round" />
                                <path d="M12 40H36" stroke="#333" stroke-width="4" stroke-linecap="round"
                                    stroke-linejoin="round" />
                            </svg>
                        </button>
                    </div>
                    <div class="flex-grow ml-4">
                        <div class="relative w-full">
                            <input type="text"
                                class="flex w-full border rounded-xl focus:outline-none focus:border-amber-300 pl-4 h-10"
                                placeholder="Input message" bind:value={inputText} on:keydown={(e)=> {
                            if (e.code == "Enter" && isFocused && !isComposing) onEnter();
                            }}
                            on:focus={() => {
                            isFocused = true;
                            }}
                            on:blur={() => {
                            isFocused = false;
                            }}
                            on:compositionstart={handleCompositionStart}
                            on:compositionend={handleCompositionEnd}
                            />
                        </div>
                    </div>
                    <div class="ml-4" on:click={()=> {
                        onEnter(true);
                        }}
                        >
                        <button
                            class="flex items-center justify-center bg-amber-500 hover:bg-amber-600 rounded-xl text-white px-4 py-1 flex-shrink-0">
                            <span />
                            <span class="p-1">
                                <svg class="w-4 h-4 transform rotate-45 -mt-px" fill="none" stroke="currentColor"
                                    viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>