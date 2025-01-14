const fetch = require("node-fetch");
const { logger } = require("../../utils/logger");

module.exports = {
  name: "lyrics",
  description: "Search for song lyrics",
  category: "media",
  async execute(messenger, senderId, args, event) {
    if (!args.length) {
      return messenger.sendTextMessage(
        senderId,
        "Please provide a song name. Usage: /lyrics <song name>"
      );
    }

    const songName = args.join(" ");
    try {
       if (!songName) return messenger.sendTextMessage(
          senderId,
          "A song name is required."
        );
     const d = await messenger.sendTextMessage(
          senderId,
          "🔄Fetching lyrics..."
        );
      const response = await fetch(
        `https://app.only-fans.club/genius/lyrics?songname=${encodeURIComponent(songName)}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      let results = await response.json();
      
      if (!results.length) {
        return messenger.sendTextMessage(
          senderId,
          "No results found for this song."
        );
      }

      results = results.slice(0, 6);

    
      for (let i = 0; i < results.length; i++) {
        if (results[i].image) {
          const imageCaption = `${i + 1}. ${results[i].title} - ${results[i].artist}`;
          await messenger.sendImage(senderId, results[i].image);
          await messenger.sendTextMessage(senderId, imageCaption);
        }
      }

      
      const messageText = "Reply with the number to get lyrics:";

      
      const quickReplies = results.map((song, index) => ({
        content_type: "text",
        title: `${index + 1}`,
        payload: d.message_id
      }));

      
      const sentMessage = await messenger.sendQuickReplies(
        senderId,
        messageText,
        quickReplies
      );

 
      global.replyHandlers.set(d.message_id, {
        commandName: "lyrics",
        recipientId: senderId,
        results: results
      });

    } catch (error) {
      logger.error("Error in lyrics command:", error);
      await messenger.sendTextMessage(
        senderId,
        "Sorry, there was an error fetching the lyrics. Please try again later."
      );
    }
  },

  async replyExecute(messenger, senderId, event) {
    const handler = global.replyHandlers.get(event.message.quick_reply.payload);
    if (!handler || !handler.results) {
      return messenger.sendTextMessage(
        senderId,
        "Sorry, I couldn't find the song selection. Please try searching again."
      );
    }

    const selectedNumber = parseInt(event.message.text);
    if (isNaN(selectedNumber) || selectedNumber < 1 || selectedNumber > handler.results.length) {
      return messenger.sendTextMessage(
        senderId,
        "Please select a valid number from the list."
      );
    }

    const selectedSong = handler.results[selectedNumber - 1];
    
    try {

      const response = await fetch(
        `https://app.only-fans.club/genius/getlyrics?url=${encodeURIComponent(selectedSong.url)}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const lyricsData = await response.json();
      
     
      if (selectedSong.image) {
        await messenger.sendImage(senderId, selectedSong.image);
      }

      const lyricsMessage = `🎵 ${selectedSong.title}\n👤 ${selectedSong.artist}\n\n${lyricsData.lyrics}`;
      
      await messenger.sendTextMessage(senderId, lyricsMessage);
      
     
      global.replyHandlers.delete(event.message.quick_reply.payload);
    } catch (error) {
      logger.error("Error fetching lyrics:", error);
      await messenger.sendTextMessage(
        senderId,
        "Sorry, there was an error fetching the lyrics. Please try again."
      );
    }
  }
};
