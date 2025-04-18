

//gemini
require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Validate API key immediately with better error message
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey || apiKey.trim() === "") {
  throw new Error("❌ Missing or empty GEMINI_API_KEY in .env file. Get one from https://aistudio.google.com");
}

// Initialize Gemini with recommended settings
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-pro-latest",
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 2000,
    topP: 0.9,
  },
  safetySettings: [
    {
      category: "HARM_CATEGORY_HARASSMENT",
      threshold: "BLOCK_ONLY_HIGH"
    }
  ]
});

/**
 * Generates a structured quiz using Gemini API
 * @param {string} transcript - The text to generate quiz questions from
 * @returns {Promise<Object>} - Quiz object with questions and answers
 */
const generateQuiz = async (transcript) => {
  // Validate input
  if (!transcript || typeof transcript !== "string" || transcript.trim().length < 50) {
    throw new Error("Transcript must be a non-empty string with at least 50 characters");
  }

  try {
    console.log("Starting quiz generation...");
    const truncatedTranscript = transcript.substring(0, 10000); // Limit to 10k chars

    const prompt = `
      Generate a quiz in STRICT JSON format based on this transcript:
      - 3 MCQs (4 options each, mark correct answer)
      - 2 True/False questions
      - 2 Fill-in-the-blank questions
      
      Required JSON structure:
      {
        "mcqs": [{
          "question": "...",
          "options": ["...", "...", "...", "..."],
          "answer": "..."
        }],
        "trueFalse": [{
          "question": "...", 
          "answer": boolean
        }],
        "fillInTheBlank": [{
          "question": "...___...", 
          "answer": "..."
        }]
      }

      Transcript: ${truncatedTranscript}
    `;

    console.log("Sending request to Gemini API...");
    const result = await model.generateContent({
      contents: [{ 
        role: "user", 
        parts: [{ 
          text: prompt 
        }] 
      }]
    });

    if (!result.response || !result.response.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error("Invalid response format from Gemini API");
    }

    const responseText = result.response.candidates[0].content.parts[0].text;
    console.log("Raw Gemini response:", responseText.slice(0, 200) + "..."); // Log first 200 chars

    // Robust JSON extraction
    const jsonStart = Math.max(0, responseText.indexOf('{'));
    const jsonEnd = Math.min(responseText.length, responseText.lastIndexOf('}') + 1);
    
    if (jsonStart < 0 || jsonEnd <= jsonStart) {
      throw new Error("Could not find valid JSON in response");
    }

    const jsonString = responseText.slice(jsonStart, jsonEnd);
    const quiz = JSON.parse(jsonString);

    // Validate quiz structure
    if (!quiz.mcqs || !quiz.trueFalse || !quiz.fillInTheBlank) {
      throw new Error("Generated quiz missing required sections");
    }

    console.log("Quiz generated successfully");
    return quiz;

  } catch (error) {
    console.error("‼️ Quiz generation failed:", {
      error: error.message,
      stack: error.stack
    });
    throw new Error(`Quiz generation failed: ${error.message}`);
  }
};

module.exports = generateQuiz;




