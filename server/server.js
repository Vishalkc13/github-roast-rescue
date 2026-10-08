const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));

const PORT = process.env.PORT || 5000;

// ==========================================
// GEMINI AI
// ==========================================

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// ==========================================
// TEST ROUTE
// ==========================================

app.get("/", (req, res) => {
  res.json({
    message: "GitHub Roast & Rescue API is running 🔥",
  });
});

// ==========================================
// GITHUB DATA
// ==========================================

app.get("/api/github/:username", async (req, res) => {
  try {
    const username = req.params.username;

    const headers = {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      "X-GitHub-Api-Version": "2022-11-28",
    };

    // Get GitHub profile
    const profileResponse = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}`,
      { headers }
    );

    const profile = await profileResponse.json();

    if (!profileResponse.ok) {
      return res.status(profileResponse.status).json({
        error: profile.message || "Unable to fetch GitHub profile",
      });
    }

    // Get repositories
    const reposResponse = await fetch(
      `https://api.github.com/users/${encodeURIComponent(
        username
      )}/repos?per_page=100&sort=updated`,
      { headers }
    );

    const repos = await reposResponse.json();

    if (!reposResponse.ok) {
      return res.status(reposResponse.status).json({
        error: repos.message || "Unable to fetch repositories",
      });
    }

    res.json({
      profile,
      repos,
    });
  } catch (error) {
    console.error("GitHub Error:", error);

    res.status(500).json({
      error: "Server error while fetching GitHub data.",
    });
  }
});

// ==========================================
// AI ROAST
// ==========================================

app.post("/api/roast", async (req, res) => {
  try {
    const { profile, repos, score } = req.body;

    if (!profile || !repos) {
      return res.status(400).json({
        error: "GitHub profile and repositories are required.",
      });
    }

    // Only send the first 10 repositories to Gemini.
    // This keeps the request small and makes AI analysis faster.
    const simplifiedRepos = repos.slice(0, 10).map((repo) => ({
      name: repo.name || "",
      description: repo.description || "",
      language: repo.language || "",
      stars: repo.stargazers_count || 0,
      forks: repo.forks_count || 0,
      isFork: Boolean(repo.fork),
      homepage: repo.homepage || "",
      topics: Array.isArray(repo.topics) ? repo.topics : [],
      updatedAt: repo.updated_at || "",
      createdAt: repo.created_at || "",
    }));

    // Only send useful profile information.
    const githubData = {
      profile: {
        username: profile.login || "",
        name: profile.name || "",
        bio: profile.bio || "",
        location: profile.location || "",
        blog: profile.blog || "",
        followers: profile.followers || 0,
        following: profile.following || 0,
        publicRepos: profile.public_repos || 0,
        publicGists: profile.public_gists || 0,
      },

      repositories: simplifiedRepos,

      healthScore: score || 0,
    };

    console.log(
      "AI payload size:",
      JSON.stringify(githubData).length,
      "characters"
    );

    const prompt = `
You are the AI engine for a hackathon product called
"GitHub Roast & Rescue".

Analyze this GitHub profile.

Your job is to give honest, funny and constructive feedback.

RULES:

1. Roast the GitHub profile and its presentation, NOT the person.
2. Never insult intelligence, appearance, background, education,
   personality, race, religion, gender or personal characteristics.
3. Never invent information.
4. Only use the supplied GitHub data.
5. Be funny and slightly savage, but useful.
6. Give practical improvements.
7. Think like a technical recruiter looking at the profile
   for approximately 30 seconds.

Return ONLY valid JSON.

Use exactly this structure:

{
  "roast": "short funny roast",
  "recruiterVerdict": {
    "rating": "STRONG YES | YES | MAYBE | NO",
    "summary": "short recruiter-style verdict"
  },
  "strengths": [
    "strength 1",
    "strength 2",
    "strength 3"
  ],
  "topProblems": [
    {
      "problem": "problem",
      "impact": "why it matters",
      "severity": "HIGH | MEDIUM | LOW"
    }
  ],
  "rescuePlan": [
    {
      "priority": 1,
      "action": "specific action",
      "reason": "why to do it",
      "estimatedTime": "30 minutes"
    }
  ],
  "quickWins": [
    "quick improvement 1",
    "quick improvement 2",
    "quick improvement 3"
  ]
}

Requirements:

- Roast: maximum 80 words.
- Exactly 3 strengths.
- 3 to 5 problems.
- 3 to 5 rescue actions.
- Exactly 3 quick wins.

GitHub data:

${JSON.stringify(githubData, null, 2)}
`;

    // Call Gemini
    const interaction = await ai.interactions.create({
      model: "gemini-3.5-flash-lite",
      input: prompt,
    });

    const text = interaction.output_text;

    if (!text) {
      throw new Error("Gemini returned an empty response.");
    }

    console.log("Gemini response received.");

    // Remove markdown code fences
    let cleanText = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    // Find JSON object
    const start = cleanText.indexOf("{");
    const end = cleanText.lastIndexOf("}");

    if (start === -1 || end === -1) {
      throw new Error("Gemini did not return valid JSON.");
    }

    cleanText = cleanText.substring(start, end + 1);

    const result = JSON.parse(cleanText);

    res.json(result);
  } catch (error) {
    console.error("AI Roast Error:", error);

    res.status(500).json({
      error: "AI analysis failed.",
      details: error.message,
    });
  }
});

// ==========================================
// EXPRESS ERROR HANDLER
// ==========================================

app.use((err, req, res, next) => {
  console.error("Express Error:", err);

  // Request body too large
  if (err.type === "entity.too.large") {
    return res.status(413).json({
      error: "Request too large.",
      details: "The GitHub data sent to the server is too large.",
    });
  }

  res.status(500).json({
    error: "Internal server error.",
    details: err.message,
  });
});

// ==========================================
// START SERVER
// ==========================================

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🔥 Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;