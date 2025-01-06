/* Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const fetch = require("node-fetch"); // Keep this only if Node.js version < 18
const { metrics } = require('./utils/metrics');

const Platforms = {
  Messenger: "messenger",
  Instagram: "instagram",
};

const MessageTypes = {
  RESPONSE: "RESPONSE",
  UPDATE: "UPDATE",
  MESSAGE_TAG: "MESSAGE_TAG",
};

const SenderActions = {
  TYPING_ON: "typing_on",
  TYPING_OFF: "typing_off",
  MARK_SEEN: "mark_seen",
};

class Messenger {
  apiDomain = "graph.facebook.com";
  apiVersion = "15.0";
  apiUrl;
  platform;
  pageId;
  accessToken;

  constructor(platform, pageId, accessToken) {
    this.apiUrl = `https://${this.apiDomain}/v${this.apiVersion}`;
    this.platform = platform;
    this.pageId = pageId;
    this.accessToken = accessToken;
  }

  async #sendApiRequest(api, parameters, method = "GET") {
    parameters["access_token"] = this.accessToken;
    const queryString = new URLSearchParams(parameters);
    try {
      const response = await fetch(
        `${this.apiUrl}/${api}?${queryString.toString()}`,
        { method }
      );
      if (!response.ok) {
        throw new Error(
          `HTTP Error: ${response.status} - ${response.statusText}`
        );
      }
      return await response.json();
    } catch (error) {
      console.error("API Request failed:", error.message);
      throw error;
    }
  }

  async getConversations() {
    return this.#sendApiRequest(`${this.pageId}/conversations`, {
      platform: this.platform,
    });
  }

  async getConversationMessages(conversationId) {
    return this.#sendApiRequest(`${conversationId}`, {
      fields: "id,messages",
    });
  }

  async getMessageDetails(messageId) {
    return this.#sendApiRequest(`${messageId}`, {
      fields: "id,to,from,message",
    });
  }

  async sendTextMessage(userId, message) {
    metrics.incrementCount();
    return this.#sendApiRequest(
      `${this.pageId}/messages`,
      {
        recipient: JSON.stringify({ id: userId }),
        messaging_type: "RESPONSE",
        message: JSON.stringify({ text: message }),
      },
      "POST"
    );
  }

  async sendImage(userId, imageUrl) {
    return this.#sendApiRequest(
      `${this.pageId}/messages`,
      {
        recipient: JSON.stringify({ id: userId }),
        messaging_type: "RESPONSE",
        message: JSON.stringify({
          attachment: {
            type: "image",
            payload: {
              url: imageUrl,
            },
          },
        }),
      },
      "POST"
    );
  }

  // New methods below

  async sendTypingIndicator(userId, action = SenderActions.TYPING_ON) {
    return this.#sendApiRequest(
      `${this.pageId}/messages`,
      {
        recipient: JSON.stringify({ id: userId }),
        sender_action: action,
      },
      "POST"
    );
  }

  async sendVideo(userId, videoUrl) {
    return this.#sendApiRequest(
      `${this.pageId}/messages`,
      {
        recipient: JSON.stringify({ id: userId }),
        messaging_type: "RESPONSE",
        message: JSON.stringify({
          attachment: {
            type: "video",
            payload: {
              url: videoUrl,
            },
          },
        }),
      },
      "POST"
    );
  }

  async sendAttachmentMessage(userId, attachmentUrl, type = "file") {
    const validTypes = ["file", "audio", "image", "video"];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid attachment type. Must be one of: ${validTypes.join(", ")}`);
    }

    return this.#sendApiRequest(
      `${this.pageId}/messages`,
      {
        recipient: JSON.stringify({ id: userId }),
        messaging_type: "RESPONSE",
        message: JSON.stringify({
          attachment: {
            type: type,
            payload: {
              url: attachmentUrl,
              is_reusable: true,
            },
          },
        }),
      },
      "POST"
    );
  }

  async sendQuickReplies(userId, text, quickReplies) {
    return this.#sendApiRequest(
      `${this.pageId}/messages`,
      {
        recipient: JSON.stringify({ id: userId }),
        messaging_type: "RESPONSE",
        message: JSON.stringify({
          text: text,
          quick_replies: quickReplies,
        }),
      },
      "POST"
    );
  }

  async sendTemplate(userId, templateName, languageCode, components) {
    return this.#sendApiRequest(
      `${this.pageId}/messages`,
      {
        recipient: JSON.stringify({ id: userId }),
        messaging_type: "RESPONSE",
        message: JSON.stringify({
          attachment: {
            type: "template",
            payload: {
              template_type: "generic",
              template_name: templateName,
              language: {
                code: languageCode,
              },
              components: components,
            },
          },
        }),
      },
      "POST"
    );
  }

  async markMessageSeen(userId) {
    return this.sendTypingIndicator(userId, SenderActions.MARK_SEEN);
  }

  async sendBulkMessages(userIds, message) {
    const promises = userIds.map(userId => this.sendTextMessage(userId, message));
    return Promise.all(promises);
  }

  async sendCustomPayload(userId, payload) {
    return this.#sendApiRequest(
      `${this.pageId}/messages`,
      {
        recipient: JSON.stringify({ id: userId }),
        messaging_type: "RESPONSE",
        message: JSON.stringify(payload),
      },
      "POST"
    );
  }
}

module.exports = {
  Platforms,
  MessageTypes,
  SenderActions,
  Messenger,
};