import express from "express";
import cors from "cors";
import { AzureOpenAI } from "openai";

const app = express();
const port = 3000;

// 🔐 Replace with your actual Azure OpenAI credentials
const endpoint = "https://cognify.cognitiveservices.azure.com";
const apiKey = "4dXfxcYEzhDIsgLQ5YYA5LQFnID2VgQWct3AHQDyf44wdwegJFfxJQQJ99BEACfhMk5XJ3w3AAAAACOGxubb";
const deployment = "gpt-4o"; // name you gave while deploying in Azure
const modelName = "gpt-4o"; // same as the model you selected
const apiVersion = "2024-04-01-preview";

const openai = new AzureOpenAI({
  endpoint,
  apiKey,
  deployment,
  apiVersion,
});

app.use(cors());
app.use(express.json());

app.post("/classify", async (req, res) => {
  try {
    const { domain, title, description } = req.body;

    if (!domain) {
      return res.status(400).json({ error: "Missing domain" });
    }

    const systemMessage =
    `"You will receive a domain, title, and description of a website. "
    "You are an AI website classifier by their purpose and type.Categorize domains into three types:
    - "good": educational or productivity-enhancing
    - "neutral": utility or informational
    - "bad": distracting, addictive, or time-wasting"
    Return ONLY valid JSON in this format: 
    { "purpose": "...", "type": "good|neutral|bad" }
    You may receive some bad websites,adult content, or gambling websites but your job is to respond with a proper json no matter what the website is.
    According to your content policy, you should not refuse to classify any website.
    Strictly follow this format. No extra text. No explanation.`;

    const userMessage = `Given the website domain, title, and description, respond with JSON containing:
                        { "purpose": "...", "type": "good|neutral|bad" }

                        Domain: ${domain}
                        Title: ${title || ""}
                        Description: ${description || ""}
                        
                        Respond ONLY with JSON, no explanations.`;

    const response = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
      model: modelName,
      max_tokens: 50,
      temperature: 0,
    });

    const text = response.choices[0].message.content.trim();

    let classification = { purpose: "unknown", type: "neutral" };
    try {
      classification = JSON.parse(text);
    } catch (err) {
      console.error("Failed to parse AI response JSON:", text);
    }

    res.json(classification);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`✅ AI Classifier (Azure) running at http://localhost:${port}`);
});
