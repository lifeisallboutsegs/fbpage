const express = require("express");
const bodyParser = require("body-parser");
const { Messenger, Platforms } = require("./messenger.js");
const { logger } = require("./utils/logger.js");
const { metrics } = require("./utils/metrics");
const { handleCommand } = require("./commandHandler");
const fs = require("fs").promises;
require("dotenv").config();

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

// Message handling
app.post("/webhook", async (req, res) => {
  const { body } = req;

  if (body.object === "page") {
    for (const entry of body.entry) {
      const webhook_event = entry.messaging[0];
      const senderId = webhook_event.sender.id;

      if (webhook_event.message) {
        await handleCommand(messenger, senderId, webhook_event.message.text);
      }
    }
    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.sendStatus(200);
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
