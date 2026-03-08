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
  if (req.query["hub.verify_token"] === VERIFY_TOKEN) {
    res.send(req.query["hub.challenge"]);
  } else {
    res.sendStatus(403);
  }
});

app.post("/webhook", async (req, res) => {
  res.sendStatus(200);
  try {
    const messages = req.body.entry?.[0]?.changes?.[0]?.value?.messages;
    if (!messages) return;
    const message = messages[0];
    if (message.type !== "text") return;
    const from = message.from;
    const text = message.text.body;
    const reply = await getAIReply(text);
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
            text: `You are a professional real estate agent in Saudi Arabia. Reply in the same language as the client (Arabic or English). Properties: ${PROPERTIES}. Client message: ${userMessage}`
          }]
        }]
      }
    );
    return response.data.candidates[0].content.parts[0].text;
  } catch (e) {
    return "Sorry, will get back to you shortly.";
  }
}

async function sendWhatsAppMessage(to, message) {
  await axios.post(
    `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
    { messaging_product: "whatsapp", to: to, text: { body: message } },
    { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` } }
  );
}

app.listen(process.env.PORT || 3000, () => console.log("Bot is running!"));
