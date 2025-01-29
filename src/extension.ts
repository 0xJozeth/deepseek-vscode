import Ollama from "ollama";
import { Stream } from "stream";
import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "deepseek-vscode.openChat",
    () => {
      const panel = vscode.window.createWebviewPanel(
        "deepChat",
        "Deep Seek Chat",
        vscode.ViewColumn.One,
        { enableScripts: true }
      );

      panel.webview.html = getWebviewContent();

      panel.webview.onDidReceiveMessage(async (message: any) => {
        if (message.command === "sendMessage") {
          const userPrompt = message.text;
          let responseText = "";

          try {
            const streamResponse = await Ollama.chat({
              model: "deepseek-r1:7b",
              messages: [{ role: "user", content: userPrompt }],
              stream: true,
            });

            for await (const part of streamResponse) {
              responseText += part.message.content;
              panel.webview.postMessage({
                command: "chatResponse",
                text: responseText,
              });
            }
          } catch (err) {
            panel.webview.postMessage({
              command: "chatResponse",
              text: `Error: ${String(err)}`,
            });
          }
        }
      });
    }
  );

  context.subscriptions.push(disposable);
}
vscode.commands.executeCommand("deepseek-vscode.openChat");

function getWebviewContent(): string {
  return /*html*/ `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Deep Seek Chat</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 10px;
                display: flex;
                flex-direction: column;
                height: 100vh;
                background-color: #1e1e1e;
                color: white;
            }
            #chat-container {
                flex-grow: 1;
                overflow-y: auto;
                border: 1px solid #444;
                padding: 10px;
                border-radius: 5px;
                background-color: #252526;
            }
            #input-container {
                display: flex;
                margin-top: 10px;
            }
            #chat-input {
                flex-grow: 1;
                padding: 8px;
                border: none;
                border-radius: 5px;
                background-color: #333;
                color: white;
            }
            #send-btn {
                margin-left: 10px;
                padding: 8px 12px;
                border: none;
                background-color: #007acc;
                color: white;
                border-radius: 5px;
                cursor: pointer;
            }
            #send-btn:hover {
                background-color: #005f99;
            }
        </style>
    </head>
    <body>
        <div id="chat-container"></div>
        <div id="input-container">
            <input type="text" id="chat-input" placeholder="Type a message..." />
            <button id="send-btn">Send</button>
        </div>

        <script>
            const vscode = acquireVsCodeApi();



            const chatContainer = document.getElementById('chat-container');
            const chatInput = document.getElementById('chat-input');
            const sendBtn = document.getElementById('send-btn');

            function appendMessage(message, isUser = false) {
                const msgDiv = document.createElement('div');
                msgDiv.textContent = message;
                msgDiv.style.padding = '8px';
                msgDiv.style.borderRadius = '5px';
                msgDiv.style.marginBottom = '5px';
                msgDiv.style.backgroundColor = isUser ? '#007acc' : '#444';
                msgDiv.style.alignSelf = isUser ? 'flex-end' : 'flex-start';
                chatContainer.appendChild(msgDiv);
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }

            sendBtn.addEventListener('click', () => {
                const message = chatInput.value.trim();
                if (message) {
                    appendMessage(message, true);
                    vscode.postMessage({ command: 'sendMessage', text: message });
                    chatInput.value = '';
                }
            });


            window.addEventListener('message', event => {
                const message = event.data.text;
                appendMessage(message, false);
            });
        </script>
    </body>
    </html>
	`;
}

export function deactivate() {}
