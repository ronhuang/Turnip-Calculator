"use strict";

const express = require("express");
const line = require("@line/bot-sdk");
const url = require("url");
const { renderToBuffer } = require("./chart");
const codec = require("json-url")("lzw");
const knex = require("knex")(
  require("../knexfile")[process.env.NODE_ENV || "development"]
);

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const zhTWNumberMap = {
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
};

const baseUrl = process.env.BASE_URL;
if (!baseUrl) {
  throw new Error("No base URL");
}

const app = express();
const client = new line.Client(config);

// event webhook handler
async function handleEvent(event) {
  if (event.type !== "message" || event.message.type !== "text") {
    // focus on text message for now...
    return Promise.resolve(null);
  }

  const text = event.message.text;

  if (/我的分析圖/g.test(text)) {
    const fake = [
      93,
      null,
      null,
      180,
      356,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ];
    const id = await codec.compress(fake);

    return client.replyMessage(event.replyToken, {
      type: "image",
      originalContentUrl: url.resolve(baseUrl, `/chart/${id}`),
      previewImageUrl: url.resolve(baseUrl, `/chart/${id}`),
    });
  }

  const inputRe = /^\s*(週|星期)(一|二|三|四|五|六)\s*(上|下)午\s*(\d+)\s*$/g;
  const inputMatch = inputRe.exec(text);
  if (inputMatch) {
    const dayOfWeek = inputMatch[2];
    const ampm = inputMatch[3];
    const price = inputMatch[4];
    const index = (zhTWNumberMap[dayOfWeek] - 1) * 2 + (ampm === "上" ? 1 : 2);

    const records = await knex("prices")
      .select("prices")
      .where("user_id", event.source.userId);
    console.log(`records: ${JSON.stringify(records)}`);
    if (
      Array.isArray(records) &&
      records.length === 1 &&
      "prices" in records[0]
    ) {
      const prices = JSON.parse(records[0]["prices"]);
      prices[index] = price;
      await knex("prices")
        .where({ user_id: event.source.userId })
        .update({ prices: JSON.stringify(prices) });
    } else {
      const prices = new Array(13).fill(0);
      prices[index] = price;
      await knex("prices").insert({
        user_id: event.source.userId,
        prices: JSON.stringify(prices),
      });
    }

    const updatedRecords = await knex("prices")
      .select("prices")
      .where("user_id", event.source.userId);
    console.log(`updated records: ${JSON.stringify(updatedRecords)}`);

    return client.replyMessage(event.replyToken, {
      type: "text",
      text: `週${dayOfWeek} ${ampm}午 ${price} 鈴錢`,
    });
  }

  if (/^清除全部資料$/g.test(text)) {
    return client.replyMessage(event.replyToken, {
      type: "text",
      text: "清除全部資料",
    });
  }

  if (/^幫助$/g.test(text)) {
    return client.replyMessage(event.replyToken, {
      type: "text",
      text: "幫助",
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

app.get("/chart/:id", async (req, res) => {
  const id = req.params.id;
  const filter = await codec.decompress(id);
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
