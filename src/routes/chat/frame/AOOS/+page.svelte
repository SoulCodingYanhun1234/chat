<script>
  import { browser } from '$app/environment';
  import { fade } from 'svelte/transition';
  let createBubble, setBubblel, createErrorBubble, onEnter, appendHistory, initHistory, resumeHistory, clearConversation, inputText = "";
  let initMessageList = ["Hi, I'm AOOS Ai Assistant, is there anything I can do to help?", "Hello! How can I help you?"];
  let isFocused = false;
  let isSending = false;
  let initMessage = function () {
    return initMessageList[Math.floor(Math.random() * initMessageList.length)];
  }
  if (browser) {
    window.NomenMain = {
      wsSending: false
    };
    let key = "NomenMainHistory";
    let ws = window.NomenMain.ws;
    if (!window.NomenMain.ws) {
      ws = window.NomenMain.ws = new WebSocket("wss://r2ifmn.laf.dev/__websocket__");
      ws.onclose = function () {
        window.NomenMain.ws = null;
      };
      ws.onmessage = function (res) {
        let data;
        try {
          data = JSON.parse(res.data);
        } catch (err) {
          return;
        };
        if (data.message == "init" && data.sys) {
          createBubble(0, { text: "", id: data.id });
          scrollListDown();
        } else if (data.message != "init" && !data.sys && data.id) {
          setBubblel(data.id, { text: data.message });
        } else if (data.sys && data.result && data.message == "finish") {
          NomenMain.wsSending = false;
          isSending = false;
          appendHistory(data.result.text, data.result.id, 0);
        }
      };
      ws.onerror = function (e) {
        createErrorBubble("Something went wrong, please refresh");
        console.error(e);
      }
    }
    function scrollListDown() {
      document.getElementById("nomen-main-list-body").scrollTop = document.getElementById("nomen-main-list-body").scrollHeight;
    }
    window.createBubble = createBubble = function (side, { text, id }, error = false) {
      let bubble = document.createElement("div");
      bubble.setAttribute("class", `col-start-${[1, 6][side]} col-end-${[8, 13][side]} p-3 rounded-lg)`);
      bubble.innerHTML = `<div class="flex items-center ${["flex-row", "justify-start flex-row-reverse"][side]}">
        <div
          class="${["flex items-center justify-center h-10 w-10 rounded-full bg-main flex-shrink-0 text-indigo-500 text-xs",
          "flex items-center justify-center h-10 w-10 rounded-full bg-transparent flex-shrink-0 text-indigo-500"][side]}"
        >
          ${["AOOS", "Me"][side]}
        </div>
        <div
          class="${["relative ml-3 text-sm bg-white py-2 px-4 shadow rounded-xl",
          "relative mr-3 text-sm bg-indigo-100 py-2 px-4 shadow rounded-xl"][side]} ${error ? "text-red-600" : ""}"
        >
          <div id="${id}"></div>
        </div>`;
      document.querySelector("#nomen-main-chat-body").appendChild(bubble);
      document.getElementById(id).innerText=text;
    };
    window.setBubblel = setBubblel = function (id, { text }) {
      document.getElementById(id).innerText = text;
    };
    window.createErrorBubble = createErrorBubble = function (error) {
      createBubble(0, { text: error, id: `err-${Date.now()}` }, true);
    };
    window.initHistory = initHistory = function (key) {
      localStorage.removeItem(key);
      if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({ history: [] }));
    }
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
        if (!r) throw new Error("History Cache Missing")
      } catch (err) {
        window.initHistory(key);
        return;
      }
      for (let i = 0; i < r.history.length; i++) {
        createBubble(r.history[i].teller, { text: r.history[i].message, id: r.history[i].id });
      };
      scrollListDown();
    }
    window.onEnter = onEnter = function (fc) {
      if (inputText.length && !NomenMain.wsSending && (isFocused || fc)) {
        createBubble(1, { text: inputText.toString(), id: Date.now() });
        if (!window.NomenMain.ws) {
          createErrorBubble("Connection lost, trying to reconnect... ");
          appendHistory(inputText.toString(), Date.now(), 1);
          setTimeout(() => window.location.reload(), 2 * 1000)
        } else {
          try {
            let pmdList = JSON.parse(localStorage.getItem(key)).history;
            let parentMessageId = pmdList.filter(v => v.teller == 0).slice(-1)[0]?.id;
            ws.send(JSON.stringify({ message: inputText.toString(), parentMessageId: parentMessageId || undefined }));
            appendHistory(inputText.toString(), Date.now(), 1);
            NomenMain.wsSending = true;
            isSending = true;
          } catch (err) {
            createErrorBubble(`Sorry, something went wrong, Error Message: ${err.message}`)
          }
        }
        inputText = "";
      }
    };
    window.clearConversation = clearConversation = function () {
      document.querySelector("#nomen-main-chat-body").innerHTML = "";
      createBubble(0, { text: initMessage(), id: -1 });
      localStorage.setItem(key, JSON.stringify({ history: [] }));
    }
    setTimeout(() => { resumeHistory(); }, 1)
  }
</script>

<title>AOOS AI Assistant</title>
<div class="flex h-screen antialiased text-gray-800">
  <div class="flex flex-row h-full w-full overflow-x-hidden">
    <div class="flex flex-col flex-auto h-full p-6">
      <div class="flex flex-col flex-auto flex-shrink-0 rounded-2xl bg-gray-100 h-full p-4">
        <div class="flex flex-col h-full overflow-x-auto mb-4" id="nomen-main-list-body">
          <div class="flex flex-col h-full">
            <div class="" id="nomen-main-chat-body">
              <div class="col-start-1 col-end-8 p-3 rounded-lg">
                <div class="flex items-center flex-row">
                  <div
                    class="flex items-center justify-center h-10 w-10 rounded-full bg-main flex-shrink-0 text-indigo-500 text-xs">
                    AOOS
                  </div>
                  <div class="relative ml-3 text-sm bg-white py-2 px-4 shadow rounded-xl">
                    <div>{initMessage()}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="flex flex-row items-center h-16 rounded-xl bg-white w-full px-4">
          <div>
            <button class="flex items-center justify-center text-gray-400 hover:text-gray-600"
              on:click="{clearConversation}">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 48 48"
                xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd"
                  d="M20 5.91406H28V13.9141H43V21.9141H5V13.9141H20V5.91406Z" stroke="#333" stroke-width="4"
                  stroke-linecap="round" stroke-linejoin="round" />
                <path d="M8 40H40V22H8V40Z" fill="none" stroke="#333" stroke-width="4" stroke-linejoin="round" />
                <path d="M16 39.8976V33.9141" stroke="#333" stroke-width="4" stroke-linecap="round"
                  stroke-linejoin="round" />
                <path d="M24 39.8977V33.8977" stroke="#333" stroke-width="4" stroke-linecap="round"
                  stroke-linejoin="round" />
                <path d="M32 39.8976V33.9141" stroke="#333" stroke-width="4" stroke-linecap="round"
                  stroke-linejoin="round" />
                <path d="M12 40H36" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>
          <div class="flex-grow ml-4">
            <div class="relative w-full">
              <input type="text"
                class="flex w-full border rounded-xl focus:outline-none focus:border-indigo-300 pl-4 h-10"
                placeholder="Input message" bind:value={inputText} on:keydown={(e)=>{if(e.code=="Enter")onEnter()}}
              on:focus={()=>{isFocused = true}} on:blur={()=>{isFocused = false}}/>
            </div>
          </div>
          <div class="ml-4" on:click={()=>{onEnter(true)}}>
            <button
              class="flex items-center justify-center bg-indigo-500 hover:bg-indigo-600 rounded-xl text-white px-4 py-1 flex-shrink-0">
              <span>{isSending?"AI is typing...":"Send"}</span>
              <span class="ml-2">
                <svg class="w-4 h-4 transform rotate-45 -mt-px" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                </svg>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>