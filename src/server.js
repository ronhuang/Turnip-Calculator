"use strict";

const express = require("express");
const line = require("@line/bot-sdk");
const url = require("url");
const { renderToBuffer } = require("./chart");
const codec = require("json-url")("lzw");
const { deletePrices, getPrices, updatePrice } = require("./model");

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const baseUrl = process.env.BASE_URL;
if (!baseUrl) {
  throw new Error("No base URL");
}

const app = express();
const client = new line.Client(config);

const dayMap = {
  1: "一",
  2: "二",
  3: "三",
  4: "四",
  5: "五",
  6: "六",
  一: "一",
  二: "二",
  三: "三",
  四: "四",
  五: "五",
  六: "六",
};
const timeMap = {
  a: "上",
  p: "下",
  A: "上",
  P: "下",
  上: "上",
  下: "下",
};

const quickReply = {
  items: [
    {
      type: "action",
      action: {
        type: "message",
        label: "我的分析圖",
        text: "我的分析圖",
      },
    },
    {
      type: "action",
      action: {
        type: "message",
        label: "清除資料",
        text: "清除資料",
      },
    },
    {
      type: "action",
      action: {
        type: "message",
        label: "幫助",
        text: "幫助",
      },
    },
  ],
};
const helpText = `指令範例：

購買價格 100
購買100
b100
週一 上午 90
一上90
1a90
週三 下午 80
三下80
3p90
我的分析圖
清除資料`;

// event webhook handler
async function handleEvent(event) {
  if (event.type !== "message" || event.message.type !== "text") {
    // focus on text message for now...
    return Promise.resolve(null);
  }

  const text = event.message.text;

  if (/^((我|俺|林北|林祖媽)的)?分析圖$/gi.test(text)) {
    const prices = await getPrices(event.source.userId);
    const id = await codec.compress(prices);

    return client.replyMessage(event.replyToken, {
      type: "image",
      originalContentUrl: url.resolve(baseUrl, `/chart/${id}`),
      previewImageUrl: url.resolve(baseUrl, `/chart/${id}`),
      quickReply: event.source.type !== "group" ? quickReply : undefined,
    });
  }

  const buyRe = /^(購買|b)(價格)?\s*(\d+)\s*(鈴錢)?$/gi;
  const buyMatch = buyRe.exec(text);
  if (buyMatch) {
    const price = buyMatch[3];
    await updatePrice(event.source.userId, price);

    const updated = await getPrices(event.source.userId);
    console.log(`updated records: ${JSON.stringify(updated)}`);

    const msg = {
      type: "text",
      text: `購買價格 ${price} 鈴錢`,
      quickReply: quickReply,
    };
    // don't reply if in group
    if (event.source.type !== "group") {
      return client.replyMessage(event.replyToken, msg);
    }
  }

  const dailyRe = /^(週|星期)?(一|二|三|四|五|六|1|2|3|4|5|6)\s*(上|下|a|p)午?\s*(\d+)\s*(鈴錢)?$/gi;
  const dailyMatch = dailyRe.exec(text);
  if (dailyMatch) {
    const dayOfWeek = dailyMatch[2];
    const ampm = dailyMatch[3];
    const price = dailyMatch[4];
    await updatePrice(event.source.userId, price, dayOfWeek, ampm);

    const updated = await getPrices(event.source.userId);
    console.log(`updated records: ${JSON.stringify(updated)}`);

    const msg = {
      type: "text",
      text: `週${dayMap[dayOfWeek]}${timeMap[ampm]}午 ${price} 鈴錢`,
      quickReply: quickReply,
    };
    // don't reply if in group
    if (event.source.type !== "group") {
      return client.replyMessage(event.replyToken, msg);
    }
  }

  if (/^清除資料$/gi.test(text)) {
    await deletePrices(event.source.userId);

    const msg = {
      type: "text",
      text: "資料已清除",
      quickReply: quickReply,
    };
    // don't reply if in group
    if (event.source.type !== "group") {
      return client.replyMessage(event.replyToken, msg);
    }
  }

  if (/^(幫助|\?|？)$/gi.test(text)) {
    const msg = {
      type: "text",
      text: helpText,
      quickReply: quickReply,
    };
    // don't reply if in group
    if (event.source.type !== "group") {
      return client.replyMessage(event.replyToken, msg);
    }
  }

  if (/^debug$/gi.test(text)) {
    const prices = await getPrices(event.source.userId);

    const msg = {
      type: "text",
      text: JSON.stringify(prices),
      quickReply: quickReply,
    };
    // don't reply if in group
    if (event.source.type !== "group") {
      return client.replyMessage(event.replyToken, msg);
    }
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
app.listen(port, "127.0.0.1", () => {
  console.log(`listening on ${port}`);
});
