import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import signale from "signale";
import {
  CATEGORIES,
  validateMemoryData,
  validateEnvironment,
  saveMemory,
  parseCliArgs,
} from "../../helpers/index.js";

const argv = yargs(hideBin(process.argv))
  .option("repo", {
    alias: "r",
    type: "string",
    description: "Repository",
  })
  .option("category", {
    alias: "c",
    type: "string",
    description: "Category",
    choices: CATEGORIES,
  })
  .option("tech_stack", {
    type: "string",
    description: "Tech stack (comma-separated)",
  })
  .option("title", {
    alias: "t",
    type: "string",
    description: "Memory title",
  })
  .option("document", {
    alias: "d",
    type: "string",
    description:
      "Memory document (use single quotes to avoid shell interpretation)",
  })
  .help()
  .alias("h", "help").argv;

// Show usage if --help
if (argv.help || argv.h) {
  console.log(`
Memory Storage CLI

Usage:
  # Use single quotes to avoid shell interpretation of special characters
  memories add --repo="Repo Name" --category="Category" --tech_stack="Tech, Stack" --title="Your Title" --document='Memory Document'

Options:
  --repo, -r          Repository
  --category, -c      Category (${CATEGORIES.join(", ")})
  --tech_stack        Tech stack (comma-separated)
  --title, -t         Memory title
  --document, -d      Memory document (use single quotes for special chars)
  --help, -h          Show this help

Examples:
  # Simple document with single quotes (recommended)
  memories add --repo="my-project" --category="Architecture" --title="API Design Pattern" --document='This is a pattern for REST API design with special chars: $, &, *, !'

  # Multi-line document with newlines
  memories add --repo="my-project" --category="Database" --title="Migration Strategy" --document='This is a multi-line document.__NEWLINE____NEWLINE__It supports newlines and special characters.__NEWLINE____NEWLINE__Use __NEWLINE__ for line breaks.'

  # Document with code examples
  memories add --repo="my-project" --category="Components" --title="React Hook Pattern" --document='Here is a custom hook:__NEWLINE__\`\`\`javascript__NEWLINE__const useCustomHook = () => {__NEWLINE__  // Implementation__NEWLINE__};__NEWLINE__\`\`\`'

Tips:
  - Always use single quotes around the document to avoid shell interpretation
  - Use __NEWLINE__ for line breaks in multi-line documents
  - Escape any single quotes within the document with backslash: \\'
  - For very long documents, consider breaking them into multiple memories
	`);
  process.exit(0);
}

const run = async () => {
  try {
    signale.start("Starting memory storage…");

    // Check Supabase connection
    if (!validateEnvironment()) {
      process.exit(1);
    }

    const memoryData = parseCliArgs(argv);

    // Validate data
    const errors = validateMemoryData(memoryData);
    if (errors.length > 0) {
      signale.error("Validation errors:");
      errors.forEach((error) => signale.error(`  - ${error}`));
      process.exit(1);
    }

    // Save to database
    signale.pending("Saving memory…");
    const savedMemory = await saveMemory(memoryData);

    signale.success(`Memory saved successfully! ID: ${savedMemory.id}`);
    signale.info(
      `Search for it later with: memories search --query="${memoryData.title
        .split(" ")
        .slice(0, 3)
        .join(" ")}"`
    );
  } catch (error) {
    signale.error("Error:", error.message);
    process.exit(1);
  }
};

run();
