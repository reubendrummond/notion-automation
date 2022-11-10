"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseId = void 0;
const client_1 = require("@notionhq/client");
const client = new client_1.Client({
    auth: process.env.NOTION_TOKEN,
});
exports.databaseId = {
    day: "55cfc7e2993643eeb90c8ba36453fa08",
    workouts: "b11cba0c1fde4657bc9b5b0fb9d3b692",
};
exports.default = client;
