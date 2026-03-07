const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());

const VERIFY_TOKEN = "realestate123";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PROPERTIES = process.env.PROPERTIES || "No properties available";

app.get("/webhook", (req, res) => {
  console.log("Webhook verification request received");
  if (req.query["hub.verify_token"] === VERIFY_TOKEN) {
    res.send(req.query["hub.challenge"]);
  } else {
    res.sendStatus(403);
  }
});

app.post("/webhook", async (req, res) => {
  console.log("Incoming webhook:", JSON.stringify(req.body));
  res.sendStatus(200);
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;
    if (!messages || messages.length === 0) return;
    const message = messages[0];
    if (message.type !== "text") return;
    const from = message.from;
    const text = message.text.body;
    console.log(`Message from ${from}: ${text}`);
    const reply = await getAIReply(text);
    console.log(`Replying: ${reply}`);
    await sendWhatsAppMessage(from, reply);
  } catch (e) {
    console.error("Error:", e.message);
  }
});

async function getAIReply(userMessage) {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: `You are a professional real estate agent assistant in Saudi Arabia. Reply in the same language the client uses (Arabic or English). Be helpful, warm and professional.\n\nHere are the available properties:\n${PROPERTIES}\n\nClient message: ${userMessage}\n\nReply professionally and match properties to what the client needs.`
          }]
        }]
      }
    );
    return respons
