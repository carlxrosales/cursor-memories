import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import signale from "signale";
import prompts from "prompts";
import {
  validateEnvironment,
  displayResults,
  displayMemoryDetails,
  searchMemories,
  extractFiltersFromArgs,
  CATEGORIES,
} from "../../helpers/index.js";

// CLI Arguments:
// --query, -q: Search query text
// --repo, -r: Filter by repository
// --category, -c: Filter by category (Database, Architecture, Components, etc.)
// --tech_stack, -t: Filter by tech stack
// --threshold: Similarity match threshold (0.0-1.0, default: 0.3)
// --limit: Maximum number of results (default: 10)
// --full : Show full details for all results (for agents)

const argv = yargs(hideBin(process.argv))
  .option("query", {
    alias: "q",
    type: "string",
    description: "Search query text",
  })
  .option("repo", {
    alias: "r",
    type: "string",
    description: "Filter by repository",
  })
  .option("category", {
    alias: "c",
    type: "string",
    description: "Filter by category",
  })
  .option("tech_stack", {
    alias: "t",
    type: "string",
    description: "Filter by tech stack",
  })
  .option("threshold", {
    type: "number",
    default: 0.3,
    description: "Similarity match threshold (0.0-1.0)",
  })
  .option("limit", {
    type: "number",
    default: 10,
    description: "Maximum number of results",
  })
  .option("full", {
    type: "boolean",
    default: false,
    description: "Show full details for all results",
  })
  .help().argv;

async function getInput({ message, interactive = false }) {
  if (interactive) {
    const response = await prompts({
      type: "text",
      name: "value",
      message,
    });
    return response.value;
  }
  return "";
}

async function interactiveSearch() {
  const searchInput = await getInput({
    message: "Search query (keywords, concepts):",
    interactive: true,
  });

  const filters = {};

  // Optional filters
  const addFilters = await prompts({
    type: "confirm",
    name: "value",
    message: "Add filters?",
    initial: false,
  });

  if (addFilters.value) {
    const repoFilter = await prompts({
      type: "text",
      name: "repo",
      message: "Filter by repository (optional, leave blank for all):",
      initial: "",
    });

    if (repoFilter.repo) {
      filters.repo = repoFilter.repo;
    }

    const categoryFilter = await prompts({
      type: "select",
      name: "category",
      message: "Filter by category (optional):",
      choices: [
        { title: "All categories", value: null },
        ...CATEGORIES.map((category) => ({ title: category, value: category })),
      ],
    });

    if (categoryFilter.category) {
      filters.category = categoryFilter.category;
    }
  }

  return { query: searchInput, filters };
}

async function showMemoryDetails(memories) {
  if (memories.length === 0) return;

  const choices = memories.map((memory, index) => ({
    title: `[${index + 1}] ${memory.title} (${memory.repo})`,
    value: memory,
  }));

  choices.unshift({ title: "Skip details", value: null });

  const selection = await prompts({
    type: "select",
    name: "memory",
    message: "View detailed memory?",
    choices,
  });

  if (selection.memory) {
    displayMemoryDetails(selection.memory);
  }
}

async function handleSearchQuery(query, filters, showFullDetails) {
  if (!query && !showFullDetails && Object.keys(filters).length === 0) {
    const searchParameters = await interactiveSearch();
    return {
      query: searchParameters.query,
      filters: { ...filters, ...searchParameters.filters },
    };
  }

  return { query, filters };
}

const run = async () => {
  const showFullDetails = argv.full || false;

  try {
    signale.info("Searching memories database…");

    if (!validateEnvironment()) {
      return;
    }

    let query = argv.query || argv.q;
    let filters = extractFiltersFromArgs(argv);

    const searchParameters = await handleSearchQuery(
      query,
      filters,
      showFullDetails
    );
    query = searchParameters.query;
    filters = searchParameters.filters;

    if (!query && Object.keys(filters).length === 0 && !showFullDetails) {
      signale.info("No search criteria provided, showing all memories…");
    }

    signale.pending("Searching…");

    const memories = await searchMemories(query, filters);

    displayResults(memories, showFullDetails);

    // Option to view details interactively (skip if full details already shown)
    if (memories.length > 0 && !showFullDetails) {
      await showMemoryDetails(memories);
    }
  } catch (error) {
    signale.error("Search failed:", error.message);
  }
};

export default run;

run();
