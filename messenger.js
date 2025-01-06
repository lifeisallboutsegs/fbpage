/* Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const fetch = require("node-fetch"); // Keep this only if Node.js version < 18

const Platforms = {
  Messenger: "messenger",
  Instagram: "instagram",
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
}

module.exports = { Platforms, Messenger };
