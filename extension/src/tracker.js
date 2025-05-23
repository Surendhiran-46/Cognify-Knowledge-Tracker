// ==================== Data ====================
const siteCategories = {
  "www.geeksforgeeks.org": { "purpose": "Computer Science", "type": "good" },
  "www.wikipedia.org": { "purpose": "General Knowledge", "type": "good" },
  "www.instagram.com": { "purpose": "Social Media", "type": "bad" },
  "www.chess.com": { "purpose": "Cognitive Skill", "type": "good" },
  "www.youtube.com": { "purpose": "Video Learning", "type": "neutral" }
};

// ==================== Helper Functions ====================
function classifySite(domain) {
  return siteCategories[domain] || { purpose: "unknown", type: "neutral" };
}

function getCurrentTimestamp() {
  return new Date().toISOString();
}

function logVisit(data) {
  chrome.storage.local.get(["visitLog"], (result) => {
    const logs = result.visitLog || [];
    logs.push(data);
    chrome.storage.local.set({ visitLog: logs });
  });
}

function extractMetadataFromPage() {
  const metaTags = document.getElementsByTagName("meta");
  let description = "";
  let keywords = "";

  for (let tag of metaTags) {
    if (tag.name === "description") {
      description = tag.content;
    } else if (tag.name === "keywords") {
      keywords = tag.content;
    }
  }

  if (!description) {
    const textContent = document.body.innerText;
    description = textContent?.split("\n").slice(0, 5).join(" ").slice(0, 300);
  }

  return { description, keywords };
}

function classifyByContent({ description, keywords }) {
  const text = `${description} ${keywords}`.toLowerCase();

  if (text.includes("computer") || text.includes("programming")) {
    return { purpose: "Computer Science", type: "good" };
  } else if (text.includes("history") || text.includes("science")) {
    return { purpose: "General Knowledge", type: "good" };
  } else if (text.includes("instagram") || text.includes("social media")) {
    return { purpose: "Social Media", type: "bad" };
  } else if (text.includes("game") || text.includes("chess")) {
    return { purpose: "Cognitive Skill", type: "good" };
  } else if (text.includes("youtube") || text.includes("video")) {
    return { purpose: "Video Learning", type: "neutral" };
  }

  return { purpose: "unknown", type: "neutral" };
}

function getDuration(startTime) {
  const endTime = Date.now();
  return Math.round((endTime - startTime) / 1000);
}

async function classifyWithAI(domain, title, description) {
  try {
    const response = await fetch("http://localhost:3000/classify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ domain, title, description })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("AI classification failed:", error);
    return null;
  }
}


// ==================== Main Script ====================
console.log("Tracker script loaded");

const startTime = Date.now();
const url = window.location.href;
const domain = new URL(url).hostname;

const category = classifySite(domain);
const purpose = category.purpose;
const type = category.type;
console.log("Domain:", domain);

window.addEventListener("beforeunload", async () => {
  const duration = getDuration(startTime);
  const timestamp = getCurrentTimestamp();
  const metadata = extractMetadataFromPage();
  const title = document.title;

  let finalCategory;

  if (siteCategories[domain]) {
    finalCategory = classifySite(domain);
  } else {
    const aiResult = await classifyWithAI(domain, title, metadata.description);
    if (aiResult && aiResult.type) {
      finalCategory = aiResult;
    } else {
      finalCategory = classifyByContent(metadata);
    }
  }
  logVisit({
    domain,
    url,
    category: finalCategory.purpose,
    type: finalCategory.type,
    duration,
    timestamp
  });
});
