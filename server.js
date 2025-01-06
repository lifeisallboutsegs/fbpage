const express = require("express");
const bodyParser = require("body-parser");
const { Messenger, Platforms } = require("./messenger.js");
const { logger } = require("./utils/logger.js");
const { metrics } = require("./utils/metrics");
const { handleCommand, loadCommands } = require("./commandHandler");
const fs = require("fs").promises;
const path = require("path");
require("dotenv").config();
loadCommands();
const app = express();
const port = process.env.PORT || 3000;
let startTime = Date.now();

const messenger = new Messenger(
  Platforms.Messenger,
  process.env.PAGE_ID,
  process.env.ACCESS_TOKEN
);

app.use(bodyParser.json());

// Webhook verification
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    logger.info("Webhook verified");
    res.status(200).send(challenge);
  } else {
    logger.warn("Webhook verification failed");
    res.sendStatus(403);
  }
});

app.get("/privacy-policy", (req, res) => {
  res.status(200).sendFile(path.join(__dirname, "privacy_policy.html"));
});

// Serve Terms of Service
app.get("/terms-of-service", (req, res) => {
  res.status(200).sendFile(path.join(__dirname, "terms_of_service.html"));
});

app.get("/data-deletion", (req, res) => {
  res.sendFile(path.join(__dirname, "data_deletion.html"));
});

// Message handling
app.post("/webhook", async (req, res) => {
  const { body } = req;
  console.log(body);

  if (body.object === "page") {
    for (const entry of body.entry) {
      const messagingEvents = entry.messaging;
      for (let i = 0; i < messagingEvents.length; i++) {
        const event = messagingEvents[i];
        const sender = event.sender.id;

        if (event.message && event.message.text) {
          await handleCommand(messenger, sender, event.message.text);
        }
      }
    }
    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.sendStatus(404);
  }
});


// Error handling
process.on("unhandledRejection", (error) => {
  logger.error("Unhandled rejection:", error);
});

async function init() {
  try {
    await app.listen(port);
    logger.info(`Bot running on port ${port}`);
    metrics.recordStartTime();
  } catch (error) {
    logger.error("Initialization failed:", error);
    process.exit(1);
  }
}

init();
