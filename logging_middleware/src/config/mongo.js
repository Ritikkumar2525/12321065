import { MongoClient } from "mongodb";
import { env } from "./env.js";

let client = null;
let db = null;

export const connectMongo = async () => {
  if (db) {
    return db;
  }

  client = new MongoClient(env.MONGO_URI);
  await client.connect();

  db = client.db(env.MONGO_DB_NAME);
  await db.command({ ping: 1 });

  console.log(`MongoDB connected: ${env.MONGO_DB_NAME}`);

  return db;
};

export const getMongoDb = () => {
  if (!db) {
    throw new Error("MongoDB is not connected. Call connectMongo() first.");
  }

  return db;
};

export const closeMongo = async () => {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
};
