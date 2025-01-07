const axios = require("axios");

const globalChatHistory = {}; // Stores chat history globally
const userChatHistories = {}; // Stores chat history per user

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

      // Initialize chat history for the user if not already present
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
        model: "llama-3.3-70b-versatile",
        messages: userChatHistories[senderId],
      };

      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer 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`,
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
        // Delete previous handlers for this user before setting the new one
        [...global.replyHandlers.entries()].forEach(([mid, handler]) => {
          if (handler.recipientId === event.recipient.id) {
            global.replyHandlers.delete(mid);
          }
        });

        // Add the new handler
        global.replyHandlers.set(messageResponse.message_id, {
          recipientId: event.recipient.id,
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
        model: "llama-3.3-70b-versatile",
        messages: userChatHistories[senderId],
      };

      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer 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`,
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

      // Remove the old reply handler if it exists
      if (event.message.reply_to) {
        global.replyHandlers.delete(event.message.reply_to.mid);
      }

      const messageResponse = await messenger.sendTextMessage(
        senderId,
        aiMessage
      );

      if (messageResponse && messageResponse.message_id) {
        // Add the new reply handler
        global.replyHandlers.set(messageResponse.message_id, {
          recipientId: event.recipient.id,
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
