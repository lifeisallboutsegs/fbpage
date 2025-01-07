const axios = require("axios");

const globalChatHistory = {}; // Stores chat history globally
const userChatHistories = {}; // Stores chat history per user

module.exports = {
  name: "ai",
  category: "AI",
  description: "Interact with an AI assistant.",
  
  async execute(messenger, senderId, args, event) {
    try {
      const messageContent = args.join(" ");
      
      if (!messageContent.trim()) {
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

      userChatHistories[senderId].push({ role: "user", content: messageContent });

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
      userChatHistories[senderId].push({ role: "assistant", content: aiMessage });

      if (!globalChatHistory[senderId]) {
        globalChatHistory[senderId] = [];
      }
      globalChatHistory[senderId].push({
        user: messageContent,
        assistant: aiMessage,
      });

      const messageResponse = await messenger.sendTextMessage(senderId, aiMessage);
      
      // Set reply handler for the new message, removing any previous handlers for this user
      if (messageResponse && messageResponse.message_id) {
        // Remove old handlers for this recipient
        for (const [mid, handler] of global.replyHandlers.entries()) {
          if (handler.recipientId === event.recipient.id) {
            global.replyHandlers.delete(mid);
          }
        }
        
        // Set new handler
        global.replyHandlers.set(messageResponse.message_id, {
          recipientId: event.recipient.id,
          commandName: "ai"
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
      const messageContent = event.message.text;
      
      if (!userChatHistories[senderId]) {
        userChatHistories[senderId] = [
          { role: "system", content: "You are a helpful assistant." },
        ];
      }

      userChatHistories[senderId].push({ role: "user", content: messageContent });

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
      userChatHistories[senderId].push({ role: "assistant", content: aiMessage });

      if (!globalChatHistory[senderId]) {
        globalChatHistory[senderId] = [];
      }
      globalChatHistory[senderId].push({
        user: messageContent,
        assistant: aiMessage,
      });

      // Delete the old reply handler before sending the new message
      if (event.message.reply_to) {
        global.replyHandlers.delete(event.message.reply_to.mid);
      }

      const messageResponse = await messenger.sendTextMessage(senderId, aiMessage);
      
      // Set new handler for this message
      if (messageResponse && messageResponse.message_id) {
        global.replyHandlers.set(messageResponse.message_id, {
          recipientId: event.recipient.id,
          commandName: "ai"
        });
      }
    } catch (error) {
      console.error("AI reply execution error:", error.message);
      await messenger.sendTextMessage(
        senderId,
        "⚠️ Sorry, I couldn't process your reply right now. Please try again later."
      );
    }
  }
};