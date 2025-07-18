import { CATEGORIES } from "./constants.js";
import signale from "signale";

export function validateMemoryData(data) {
  const errors = [];

  if (!data.category || !CATEGORIES.includes(data.category)) {
    errors.push(`Category must be one of: ${CATEGORIES.join(", ")}`);
  }

  if (!data.title) {
    errors.push("Title is required");
  }

  if (!data.document) {
    errors.push("Document is required");
  }

  return errors;
}

export function validateEnvironment() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    signale.error(
      "Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY"
    );
    return false;
  }

  return true;
}
