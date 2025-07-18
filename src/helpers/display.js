import signale from "signale";
import chalk from "chalk";

export function displayMemoryDetails(memory, index = null) {
  const prefix = index ? `[${index}] ` : "";

  console.log("\n" + chalk.blue("=".repeat(60)));
  console.log(chalk.blue.bold(prefix + memory.title));
  console.log(
    chalk.gray(`${memory.repo} • ${memory.category} • ID: ${memory.id}`)
  );
  if (memory.similarity) {
    console.log(
      chalk.magenta(`Similarity: ${(memory.similarity * 100).toFixed(1)}%`)
    );
  }

  console.log(chalk.blue("=".repeat(60)));

  console.log(chalk.yellow.bold("\nDocument:"));
  console.log(memory.document);

  if (memory.tech_stack && memory.tech_stack.length > 0) {
    console.log(chalk.yellow.bold("\nTech Stack:"));
    console.log(memory.tech_stack.join(", "));
  }

  console.log(chalk.blue("=".repeat(60) + "\n"));
}

export function displayResults(memories, showFullDetails = false) {
  if (memories.length === 0) {
    signale.info("No memories found matching your search criteria");
    return;
  }

  signale.success(`Found ${memories.length} matching memories:\n`);

  memories.forEach((memory, index) => {
    if (showFullDetails) {
      displayMemoryDetails(memory, index + 1);
    } else {
      console.log(chalk.blue(`[${index + 1}] ${memory.title}`));
      console.log(
        chalk.gray(
          `    ${memory.repo} • ${memory.category} • ${new Date(
            memory.created_at
          ).toLocaleDateString()}`
        )
      );
      console.log(
        chalk.dim(
          `    ${memory.document.slice(0, 100)}${
            memory.document.length > 100 ? "…" : ""
          }`
        )
      );

      if (memory.tech_stack && memory.tech_stack.length > 0) {
        console.log(
          chalk.yellow(`    Tech Stack: ${memory.tech_stack.join(", ")}`)
        );
      }

      console.log(); // Empty line
    }
  });
}
