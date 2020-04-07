"use strict";

const express = require("express");
const line = require("@line/bot-sdk");
const { renderToBuffer } = require("./chart");

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const app = express();
const client = new line.Client(config);

// event webhook handler
function handleEvent(event) {
  if (event.type !== "message" || event.message.type !== "text") {
    return Promise.resolve(null);
  }

  const text = event.message.text;

  if (text === "預測") {
    return client.replyMessage(event.replyToken, {
      type: "image",
      originalContentUrl: "https://b772096c.ngrok.io/predict?key=xxx",
      previewImageUrl: "https://b772096c.ngrok.io/predict?key=xxx",
    });
  } else {
    return client.replyMessage(event.replyToken, {
      type: "text",
      text: event.message.text,
    });
  }
}

// register a webhook handler with middleware
app.post("/webhook", line.middleware(config), (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

app.get("/predict", async (req, res) => {
  const key = req.query.key;
  const filter = [
    93,
    undefined,
    undefined,
    180,
    356,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
  ];
  const img = await renderToBuffer(filter);

  res.writeHead(200, {
    "Content-Type": "image/png",
    "Content-Length": img.length,
  });
  res.end(img);
});

// error handling
app.use((err, req, res, next) => {
  if (err instanceof line.SignatureValidationFailed) {
    res.status(401).send(err.signature);
    return;
  } else if (err instanceof line.JSONParseError) {
    res.status(400).send(err.raw);
    return;
  }
  next(err); // will throw default 500
});

// listen on port
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});
