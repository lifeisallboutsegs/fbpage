const axios = require("axios");

module.exports = {
  name: "meme",
  category: "media",
  description: "Fetch and send a random meme.",
  async execute(messenger, senderId) {
    try {
      await messenger.sendTextMessage(
        senderId,
        "🎭 Fetching a fresh meme for you..."
      );
      const response = await axios.get("https://meme-api.com/gimme");
      const memeData = response.data;

      if (memeData && memeData.url) {
        await messenger.sendImage(senderId, memeData.url);

        if (memeData.title) {
          await messenger.sendTextMessage(
            senderId,
            `🖼️ Meme: ${memeData.title}`
          );
        }
      } else {
        throw new Error("Invalid response from meme API.");
      }
    } catch (error) {
      console.error("Failed to fetch or send meme:", error.message);
      await messenger.sendTextMessage(
        senderId,
        "⚠️ Sorry, I couldn't fetch a meme at the moment. Please try again later."
      );
    }
  },
};
