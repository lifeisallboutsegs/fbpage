const express = require("express");
const bodyParser = require("body-parser");
const { Messenger, Platforms } = require("./messenger.js");
const {
  logger,
  morganMiddleware,
  performanceLogger,
  errorLogger,
} = require("./utils/logger.js");
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

async function checkRestartStatus() {
  const filePath = "data/restart.json";

  if (await fs.stat(filePath).catch(() => false)) {
    const data = await fs.readFile(filePath);
    const restartInfo = JSON.parse(data);

    if (restartInfo.restarted) {
      const restartTime = new Date(restartInfo.timestamp).toLocaleString();
      logger.info(
        `Bot restarted. Restart took ${Date.now() - restartInfo.timestamp}ms`
      );
      messenger.sendTextMessage(
        restartInfo.senderId,
        `✅ Bot restarted, took ${
          (Date.now() - restartInfo.timestamp) / 1000
        } seconds.`
      );


      restartInfo.restarted = false;
      await fs.writeFile(filePath, JSON.stringify(restartInfo));
    }
  }
}

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

app.get("/terms-of-service", (req, res) => {
  res.status(200).sendFile(path.join(__dirname, "terms_of_service.html"));
});

app.get("/data-deletion", (req, res) => {
  res.status(200).sendFile(path.join(__dirname, "data_deletion.html"));
});

app.post("/webhook", async (req, res) => {
  const { body } = req;
  if (body.object === "page") {
    for (const entry of body.entry) {
      const messagingEvents = entry.messaging;
      for (let i = 0; i < messagingEvents.length; i++) {
        const event = messagingEvents[i];
        const sender = event.sender.id;

        if (event.message && event.message.text) {
          if (await fs.stat("data/restart.json").catch(() => false)) {
            const data = await fs.readFile("data/restart.json");
            const restartInfo = JSON.parse(data);

            if (event.message.mid === restartInfo.mid) {
              return res.status(200).send("EVENT_RECEIVED");
            }
            await handleCommand(messenger, sender, event.message.text, event);
          }
        }
      }
    }
    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.sendStatus(404);
  }
});


app.use(errorLogger); 


process.on("unhandledRejection", (error) => {
  logger.error("Unhandled rejection:", error);
});

async function init() {
  try {
    await checkRestartStatus();
    await app.listen(port);
    logger.info(`Bot running on port ${port}`);
    metrics.recordStartTime();
  } catch (error) {
    logger.error("Initialization failed:", error);
    process.exit(1);
  }
}

init();
