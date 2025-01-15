const axios = require("axios");

const globalChatHistory = {};
const userChatHistories = {};

module.exports = {
  name: "ai",
  category: "AI",
  description: "Interact with an AI assistant.",

  async execute(messenger, senderId, args, event) {
    try {
      const messageContent = args.join(" ").trim();

      if (!messageContent) {
        await messenger.sendTextMessage(
          senderId,
          "⚠️ Please provide a message for the AI to respond to."
        );
        return;
      }

      if (!userChatHistories[senderId]) {
        userChatHistories[senderId] = [
          { role: "system", content: "You are a helpful assistant." },
        ];
      }

      userChatHistories[senderId].push({
        role: "user",
        content: messageContent,
      });

      const payload = {
        model: "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo",
        messages: userChatHistories[senderId],
        max_tokens: 512,
        temperature: 1.19,
        top_p: 0.7,
        top_k: 50,
        repetition_penalty: 1,
        stop: ["<|eot_id|>", "<|eom_id|>"],
        stream: true,
      };

      const response = await axios({
        method: 'post',
        url: "https://api.together.xyz/v1/chat/completions",
        data: payload,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`,
          Accept: "text/event-stream"
        },
        responseType: 'stream'
      });

      let aiMessage = "";
      const decoder = new TextDecoder();
      let buffer = "";

      response.data.on('readable', () => {
        let chunk;
        while (null !== (chunk = response.data.read())) {
          buffer += decoder.decode(chunk, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop();
          
          for (const line of lines) {
            if (line.trim() === '' || line.trim() === 'data: [DONE]') continue;
            
            if (line.startsWith('data: ')) {
              try {
                const json = JSON.parse(line.slice(6));
                const content = json.choices[0]?.delta?.content || '';
                aiMessage += content;
              } catch (err) {
                console.error('Error parsing SSE data:', err);
              }
            }
          }
        }
      });

      await new Promise((resolve, reject) => {
        response.data.on('end', async () => {
          if (buffer.length > 0) {
            const line = buffer.trim();
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const json = JSON.parse(line.slice(6));
                const content = json.choices[0]?.delta?.content || '';
                aiMessage += content;
              } catch (err) {
                console.error('Error parsing final SSE data:', err);
              }
            }
          }

          userChatHistories[senderId].push({
            role: "assistant",
            content: aiMessage,
          });

          if (!globalChatHistory[senderId]) {
            globalChatHistory[senderId] = [];
          }

          globalChatHistory[senderId].push({
            user: messageContent,
            assistant: aiMessage,
          });

          try {
            const messageResponse = await messenger.sendTextMessage(
              senderId,
              aiMessage
            );

            if (messageResponse && messageResponse.message_id) {
              [...global.replyHandlers.entries()].forEach(([mid, handler]) => {
                if (handler.recipientId === event.sender.id) {
                  global.replyHandlers.delete(mid);
                }
              });

              global.replyHandlers.set(messageResponse.message_id, {
                recipientId: event.sender.id,
                commandName: "ai",
              });
            }
            resolve();
          } catch (error) {
            reject(error);
          }
        });

        response.data.on('error', reject);
      });

    } catch (error) {
      console.error("Execute error:", error);
      await messenger.sendTextMessage(
        senderId,
        "⚠️ Sorry, I couldn't process your request right now. Please try again later."
      );
    }
  },

  async replyExecute(messenger, senderId, event) {
    try {
      const messageContent = event.message.text.trim();

      if (!userChatHistories[senderId]) {
        userChatHistories[senderId] = [
          { role: "system", content: "You are a helpful assistant." },
        ];
      }

      userChatHistories[senderId].push({
        role: "user",
        content: messageContent,
      });

      const payload = {
        model: "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo",
        messages: userChatHistories[senderId],
        max_tokens: 512,
        temperature: 1.19,
        top_p: 0.7,
        top_k: 50,
        repetition_penalty: 1,
        stop: ["<|eot_id|>", "<|eom_id|>"],
        stream: true,
      };

      const response = await axios({
        method: 'post',
        url: "https://api.together.xyz/v1/chat/completions",
        data: payload,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`,
          Accept: "text/event-stream"
        },
        responseType: 'stream'
      });

      let aiMessage = "";
      const decoder = new TextDecoder();
      let buffer = "";

      response.data.on('readable', () => {
        let chunk;
        while (null !== (chunk = response.data.read())) {
          buffer += decoder.decode(chunk, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop();
          
          for (const line of lines) {
            if (line.trim() === '' || line.trim() === 'data: [DONE]') continue;
            
            if (line.startsWith('data: ')) {
              try {
                const json = JSON.parse(line.slice(6));
                const content = json.choices[0]?.delta?.content || '';
                aiMessage += content;
              } catch (err) {
                console.error('Error parsing SSE data:', err);
              }
            }
          }
        }
      });

      await new Promise((resolve, reject) => {
        response.data.on('end', async () => {
          if (buffer.length > 0) {
            const line = buffer.trim();
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const json = JSON.parse(line.slice(6));
                const content = json.choices[0]?.delta?.content || '';
                aiMessage += content;
              } catch (err) {
                console.error('Error parsing final SSE data:', err);
              }
            }
          }

          userChatHistories[senderId].push({
            role: "assistant",
            content: aiMessage,
          });

          if (!globalChatHistory[senderId]) {
            globalChatHistory[senderId] = [];
          }

          globalChatHistory[senderId].push({
            user: messageContent,
            assistant: aiMessage,
          });

          try {
            if (event.message.reply_to) {
              global.replyHandlers.delete(event.message.reply_to.mid);
            }

            const messageResponse = await messenger.sendTextMessage(
              senderId,
              aiMessage
            );

            if (messageResponse && messageResponse.message_id) {
              global.replyHandlers.set(messageResponse.message_id, {
                recipientId: event.sender.id,
                commandName: "ai",
              });
            }
            resolve();
          } catch (error) {
            reject(error);
          }
        });

        response.data.on('error', reject);
      });

    } catch (error) {
      console.error("ReplyExecute error:", error);
      await messenger.sendTextMessage(
        senderId,
        "⚠️ Sorry, I couldn't process your reply right now. Please try again later."
      );
    }
  },
};
