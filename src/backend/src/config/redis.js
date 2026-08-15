const { createClient } = require("redis");

const client = createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
});

client.on("error", (err) => console.error("Redis Client Error", err));

const connect = async () => {
  try {
    await client.connect();
    console.log("Redis connected successfully");
  } catch (error) {
    console.error("Redis connection error:", error.message);
    throw error;
  }
};

module.exports = {
  connect,
  client,
};
