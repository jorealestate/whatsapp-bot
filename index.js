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
  const body = req.body;
  if (body.object === "whatsapp_business_account") {
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (message && message.type === "text") {
      const from = message.from;
      const text = message.text.body;
      const reply = await getAIReply(text);
      await sendWhatsAppMessage(from, reply);
    }
  }
  res.sendStatus(200);
});

async function getAIReply(userMessage) {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: `You are a professional real estate agent assistant in Saudi Arabia. Reply in the same language the client uses (Arabic or English). Be helpful, warm and professional.

Here are the available properties:
${PROPERTIES}

Client message: ${userMessage}

Reply professionally and match properties to what the client needs.`
          }]
        }]
      }
    );
    return response.data.candidates[0].content.parts[0].text;
  } catch (e) {
    return "Sorry, I will get back to you shortly. / عذراً، سأرد عليك قريباً.";
  }
}

async function sendWhatsAppMessage(to, message) {
  await axios.post(
    `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to: to,
      text: { body: message }
    },
    { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` } }
  );
}

app.listen(3000, () => console.log("Bot is running!"));
