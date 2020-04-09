const knex = require("knex")(
  require("../knexfile")[process.env.NODE_ENV || "development"]
);

const dayMap = {
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  "1": 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
};
const timeMap = {
  上: "a",
  下: "p",
  a: "a",
  p: "p",
  A: "a",
  P: "p",
};

async function updatePrice(userId, price, dayOfWeek, ampm) {
  const index =
    dayOfWeek !== undefined && ampm !== undefined
      ? (dayMap[dayOfWeek] - 1) * 2 + (timeMap[ampm] === "a" ? 1 : 2)
      : 0;

  // check if already exist
  const row = await knex("prices").where("user_id", userId).first();

  if (row !== undefined && "values" in row) {
    // already exist, update
    const prices = JSON.parse(row["values"]);
    prices[index] = parseInt(price);
    await knex("prices")
      .where({ user_id: userId })
      .update({ values: JSON.stringify(prices) });
  } else {
    // not exist, insert
    const prices = new Array(13).fill(0);
    prices[index] = parseInt(price);
    await knex("prices").insert({
      user_id: userId,
      values: JSON.stringify(prices),
    });
  }
}

async function getPrices(userId) {
  const row = await knex("prices").where("user_id", userId).first();

  return "values" in row ? JSON.parse(row["values"]) : new Array(13).fill(0);
}

async function deletePrices(userId) {
  await knex("prices").where("user_id", userId).delete();
}

module.exports = {
  deletePrices,
  getPrices,
  updatePrice,
};
