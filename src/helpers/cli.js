import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const defaultArgv = yargs(hideBin(process.argv)).argv;

export function parseCliArgs(argv = defaultArgv) {
  const decodeArg = (arg) => {
    if (!arg || typeof arg !== "string") {
      return arg;
    }

    // Handle newline markers and other special characters
    return arg
      .replace(/__NEWLINE__/g, "\n")
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\r/g, "\r");
  };

  return {
    repo: argv.repo || argv.r,
    category: argv.category || argv.c,
    tech_stack: argv.tech_stack
      ? argv.tech_stack
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
    title: argv.title || argv.t,
    document: decodeArg(argv.document || argv.d),
  };
}

export function extractFiltersFromArgs(argv = defaultArgv) {
  const filters = {};
  if (argv.repo || argv.r) filters.repo = argv.repo || argv.r;
  if (argv.category || argv.c) filters.category = argv.category || argv.c;
  if (argv.tech_stack || argv.t) filters.tech_stack = argv.tech_stack || argv.t;
  if (argv.threshold) filters.match_threshold = parseFloat(argv.threshold);
  if (argv.limit) filters.match_count = parseInt(argv.limit, 10);
  return filters;
}
