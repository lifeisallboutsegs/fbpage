module.exports = {
  name: "uid",
  category: "utility",
  description: "Sends the UID of the sender",
  execute(messenger, senderId) {
    messenger.sendTextMessage(senderId, `Your UID is: ${senderId}`);
  },
};