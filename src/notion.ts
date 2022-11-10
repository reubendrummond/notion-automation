import { Client } from "@notionhq/client";

const client = new Client({
  auth: process.env.NOTION_TOKEN,
});

export const databaseId = {
  day: "55cfc7e2993643eeb90c8ba36453fa08",
  workouts: "b11cba0c1fde4657bc9b5b0fb9d3b692",
};

export default client;
