import { createClient } from "@supabase/supabase-js";
import signale from "signale";
import { generateEmbedding } from "./embeddings.js";

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function saveMemory(memoryData) {
  try {
    const embedding = await generateEmbedding(memoryData.document);

    // Insert into Supabase
    const { data, error } = await supabase
      .from("memories")
      .insert({
        ...memoryData,
        embedding,
      })
      .select();

    if (error) {
      throw error;
    }

    return data[0];
  } catch (error) {
    throw new Error(`Failed to save memory: ${error.message}`);
  }
}

export async function searchMemories(query, filters = {}) {
  try {
    const matchThreshold = filters.match_threshold || 0.3;
    const matchCount = filters.match_count || 10;

    // Try vector search first if we have embeddings support and a query
    if (query && process.env.OPENAI_API_KEY) {
      signale.pending("Generating search embedding…");
      const queryEmbedding = await generateEmbedding(query);

      if (queryEmbedding) {
        signale.pending("Performing similarity search…");

        // Use the RPC function for vector similarity search
        const { data: vectorResults, error: vectorError } = await supabase.rpc(
          "search_memories",
          {
            query_embedding: queryEmbedding,
            match_threshold: matchThreshold,
            match_count: matchCount,
            filter_repo: filters.repo || null,
            filter_category: filters.category || null,
            filter_tech_stack: filters.tech_stack || null,
          }
        );

        if (vectorError) {
          signale.warn(
            "Vector search failed, falling back to text search:",
            vectorError.message
          );
        } else {
          signale.success("Vector similarity search completed");
          return vectorResults || [];
        }
      }
    }

    // Fall back to traditional query if vector search is not available or fails
    let supabaseQuery = supabase
      .from("memories")
      .select("id, repo, category, tech_stack, title, document, created_at");

    // Add filters
    if (filters.repo) {
      supabaseQuery = supabaseQuery.eq("repo", filters.repo);
    }

    if (filters.category) {
      supabaseQuery = supabaseQuery.eq("category", filters.category);
    }

    if (filters.tech_stack) {
      supabaseQuery = supabaseQuery.contains("tech_stack", [
        filters.tech_stack,
      ]);
    }

    // Text search if query provided
    if (query) {
      // Convert query to proper tsquery format (replace spaces with &)
      const tsQuery = query
        .split(" ")
        .filter((word) => word.trim())
        .join(" & ");
      supabaseQuery = supabaseQuery.textSearch("document", tsQuery);
    }

    supabaseQuery = supabaseQuery
      .order("created_at", { ascending: false })
      .limit(matchCount);

    const { data, error } = await supabaseQuery;

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  } catch (error) {
    signale.error("Search error:", error.message);
    return [];
  }
}
