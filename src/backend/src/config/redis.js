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

const getCache = async (key) => {
  try {
    if (!client.isOpen) return null;
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Error getting cache for ${key}:`, error.message);
    return null;
  }
};

const setCache = async (key, data, ttlSeconds = 3600) => {
  try {
    if (!client.isOpen) return;
    await client.setEx(key, ttlSeconds, JSON.stringify(data));
  } catch (error) {
    console.error(`Error setting cache for ${key}:`, error.message);
  }
};

const deleteCacheByPattern = async (pattern) => {
  try {
    if (!client.isOpen) return;
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
  } catch (error) {
    console.error(`Error deleting cache pattern ${pattern}:`, error.message);
  }
};

const incrementCache = async (key) => {
  try {
    if (!client.isOpen) return null;
    return await client.incr(key);
  } catch (error) {
    console.error(`Error incrementing cache for ${key}:`, error.message);
    return null;
  }
};

const expireCache = async (key, seconds) => {
  try {
    if (!client.isOpen) return false;
    return await client.expire(key, seconds);
  } catch (error) {
    console.error(`Error expiring cache for ${key}:`, error.message);
    return false;
  }
};

module.exports = {
  connect,
  client,
  getCache,
  setCache,
  deleteCacheByPattern,
  incrementCache,
  expireCache,
};
