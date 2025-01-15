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

      const response = await axios.post(
        "https://api.together.xyz/v1/chat/completions",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer e29ff7078735895d5cbd3c29e5ae9fc803d9b96c5bd469c9b501dbc10934d5bc`,
          },
        }
      );

      const aiMessage = response.data.choices[0].message.content;
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
    } catch (error) {
      console.error("AI command error:", error.message);
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

      const response = await axios.post(
        "https://api.together.xyz/v1/chat/completions",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer e29ff7078735895d5cbd3c29e5ae9fc803d9b96c5bd469c9b501dbc10934d5bc`,
          },
        }
      );

      const aiMessage = response.data.choices[0].message.content;
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
    } catch (error) {
      console.error("AI reply execution error:", error.message);
      await messenger.sendTextMessage(
        senderId,
        "⚠️ Sorry, I couldn't process your reply right now. Please try again later."
      );
    }
  },
};
