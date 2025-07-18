import axios from "axios";
import signale from "signale";

export async function generateEmbedding(text) {
  if (!process.env.OPENAI_API_KEY) {
    signale.warn(
      "OpenAI API key not configured, skipping embedding generation"
    );
    return null;
  }

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/embeddings",
      {
        model: "text-embedding-3-small",
        input: text,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.data[0].embedding;
  } catch (error) {
    signale.warn("Error generating embedding:", error.message);
    return null;
  }
}
