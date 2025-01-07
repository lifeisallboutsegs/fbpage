const axios = require("axios");

const globalChatHistory = {}; // Stores chat history globally
const userChatHistories = {}; // Stores chat history per user

module.exports = {
  name: "ai",
  category: "AI",
  description: "Interact with an AI assistant.",
  async execute(messenger, senderId, args) {
    try {
      // Join the arguments into a single message
      const messageContent = args.join(" ");
      
      if (!messageContent.trim()) {
        await messenger.sendTextMessage(
          senderId,
          "⚠️ Please provide a message for the AI to respond to."
        );
        return;
      }

      // Initialize the sender's chat history if it doesn't exist
      if (!userChatHistories[senderId]) {
        userChatHistories[senderId] = [
          { role: "system", content: "You are a helpful assistant." },
        ];
      }

      // Add user's message to their chat history
      userChatHistories[senderId].push({ role: "user", content: messageContent });

      // Prepare the payload for the API call
      const payload = {
        model: "llama-3.3-70b-versatile",
        messages: userChatHistories[senderId],
      };

      // Make the API call
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer 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`, // Replace with your actual API key
          },
        }
      );

      // Extract the AI's response from the API response
      const aiMessage = response.data.choices[0].message.content;

      // Add the AI's response to the user's chat history
      userChatHistories[senderId].push({ role: "assistant", content: aiMessage });

      // Update global chat history
      if (!globalChatHistory[senderId]) {
        globalChatHistory[senderId] = [];
      }
      globalChatHistory[senderId].push({
        user: messageContent,
        assistant: aiMessage,
      });

      // Send the AI's response to the user
      const data = await messenger.sendTextMessage(senderId, aiMessage);
      console.log(data);
    } catch (error) {
      console.error("AI command error:", error.message);
      await messenger.sendTextMessage(
        senderId,
        "⚠️ Sorry, I couldn't process your request right now. Please try again later."
      );
    }
  },
};
