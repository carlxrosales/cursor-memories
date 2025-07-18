import signale from "signale";
import prompts from "prompts";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the package directory (where the setup script is located)
const packageDir = path.dirname(path.dirname(path.dirname(__dirname)));

const ENV_FILE = path.join(packageDir, ".env");

function loadExistingEnv() {
  const existing = {};
  if (fs.existsSync(ENV_FILE)) {
    const content = fs.readFileSync(ENV_FILE, "utf8");
    content.split("\n").forEach((line) => {
      const [key, value] = line.split("=");
      if (key && value) {
        existing[key.trim()] = value.trim();
      }
    });
  }

  return existing;
}

function saveEnvFile(envVars) {
  const lines = Object.entries(envVars)
    .filter(([key, value]) => key && value)
    .map(([key, value]) => `${key}=${value}`);

  fs.writeFileSync(ENV_FILE, lines.join("\n") + "\n");
}

async function copyCursorRules() {
  try {
    // Use the same package directory calculation as the top level
    const packageDir = path.dirname(path.dirname(path.dirname(__dirname)));
    const cursorRulesDir = path.join(packageDir, ".cursor", "rules");
    const targetCursorDir = path.join(process.cwd(), ".cursor");

    // Check if .cursor/rules directory exists in the package
    if (!fs.existsSync(cursorRulesDir)) {
      signale.warn(
        "Cursor rules not found in package directory (.cursor/rules)"
      );
      return false;
    }

    // Check if .cursor directory already exists in current directory
    if (fs.existsSync(targetCursorDir)) {
      const merge = await prompts({
        type: "confirm",
        name: "value",
        message:
          ".cursor directory already exists. Merge package rules into existing folder?",
        initial: true,
      });

      if (!merge.value) {
        signale.info("Skipping Cursor rules copy");
        return false;
      }

      // Merge files instead of overwriting
      await mergeCursorFiles(cursorRulesDir, targetCursorDir);
      signale.success("Cursor rules merged successfully!");
      return true;
    }

    // Create .cursor directory and copy rules (new installation)
    fs.mkdirSync(targetCursorDir, { recursive: true });
    fs.cpSync(cursorRulesDir, path.join(targetCursorDir, "rules"), {
      recursive: true,
    });
    signale.success("Cursor rules copied successfully!");
    return true;
  } catch (error) {
    signale.error("Failed to copy Cursor rules:", error.message);
    return false;
  }
}

async function mergeCursorFiles(sourceDir, targetDir) {
  const files = fs.readdirSync(sourceDir);
  const targetRulesDir = path.join(targetDir, "rules");

  // Ensure the rules directory exists in the target
  if (!fs.existsSync(targetRulesDir)) {
    fs.mkdirSync(targetRulesDir, { recursive: true });
  }

  for (const file of files) {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetRulesDir, file);

    if (fs.statSync(sourcePath).isDirectory()) {
      // If it's a directory, create it if it doesn't exist and merge recursively
      if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath, { recursive: true });
      }
      await mergeCursorFiles(sourcePath, targetPath);
    } else {
      // If it's a file, check if it already exists
      if (fs.existsSync(targetPath)) {
        const overwrite = await prompts({
          type: "confirm",
          name: "value",
          message: `File ${file} already exists in .cursor/rules. Overwrite?`,
          initial: false,
        });

        if (!overwrite.value) {
          signale.info(`Skipping ${file}`);
          continue;
        }
      }

      // Copy the file
      fs.copyFileSync(sourcePath, targetPath);
      signale.info(`Copied ${file} to .cursor/rules/`);
    }
  }
}

const run = async () => {
  try {
    signale.info("Setting up memory management environment…");

    const existing = loadExistingEnv();

    console.log(
      "\nThis script will help you configure the required environment variables for memory management."
    );
    console.log(
      "The .env file will be saved in the package directory so the memories script works from anywhere."
    );
    console.log("You'll need:");
    console.log("• Supabase project URL and service role key");
    console.log("• OpenAI API key");
    console.log("");

    const envVars = { ...existing };

    // Supabase URL
    const supabaseUrl = await prompts({
      type: "text",
      name: "value",
      message: "Supabase Project URL (https://xxx.supabase.co):",
      initial: existing.SUPABASE_URL || "",
    });
    if (supabaseUrl.value) envVars.SUPABASE_URL = supabaseUrl.value;

    // Supabase Service Role Key
    const supabaseKey = await prompts({
      type: "password",
      name: "value",
      message: "Supabase Service Role Key:",
      initial: existing.SUPABASE_SERVICE_ROLE_KEY || "",
    });
    if (supabaseKey.value)
      envVars.SUPABASE_SERVICE_ROLE_KEY = supabaseKey.value;

    // OpenAI API Key
    const openaiKey = await prompts({
      type: "password",
      name: "value",
      message: "OpenAI API Key:",
      initial: existing.OPENAI_API_KEY || "",
    });
    if (openaiKey.value) envVars.OPENAI_API_KEY = openaiKey.value;

    // Save to .env file
    const saveToFile = await prompts({
      type: "confirm",
      name: "value",
      message: `Save configuration to .env file in package directory?`,
      initial: true,
    });

    if (saveToFile.value) {
      saveEnvFile(envVars);
      signale.success(
        `.env file updated successfully in package directory: ${packageDir}`
      );

      // Check if .gitignore exists in package directory
      const packageGitignore = path.join(packageDir, ".gitignore");
      if (fs.existsSync(packageGitignore)) {
        const gitignore = fs.readFileSync(packageGitignore, "utf8");
        if (gitignore.includes(".env")) {
          signale.info(".env is already in package .gitignore file");
        } else {
          signale.warn("Make sure .env is in the package .gitignore file!");
        }
      } else {
        signale.warn(
          "No .gitignore found in package directory. Make sure to add .env to the package .gitignore file!"
        );
      }
    }

    // Copy Cursor rules
    console.log("\n" + "=".repeat(50));
    console.log("Setting up Cursor AI Integration");
    console.log("=".repeat(50));

    const copyRules = await prompts({
      type: "confirm",
      name: "value",
      message: "Copy Cursor rules for AI integration?",
      initial: true,
    });

    if (copyRules.value) {
      const copied = await copyCursorRules();
      if (copied) {
        console.log("\n✅ Cursor AI Integration Complete!");
        console.log("The AI will now:");
        console.log("• Store memories when discovering technical solutions");
        console.log("• Search memories before starting new work");
        console.log("• Apply patterns consistently across projects");
      }
    }

    console.log("\nNext steps:");
    console.log("1. Make sure your Supabase database has the memories table");
    console.log("2. Run: memories add --help to see available options");
    console.log("3. Run: memories search --help to see search options");
    console.log("");

    signale.success("Setup complete! 🎉");
  } catch (error) {
    signale.error("Setup failed:", error.message);
  }
};

export default run;

run();
