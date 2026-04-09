#!/usr/bin/env node

import { Command } from "commander";
import { registerListCommand } from "./commands/list";
import { registerReadCommand } from "./commands/read";
import { registerSearchCommand } from "./commands/search";
import { registerCreateCommand } from "./commands/create";
import { registerUpdateCommand } from "./commands/update";
import { registerDeleteCommand } from "./commands/delete";
import { registerConnectCommand } from "./commands/connect";
import { registerLoginCommand } from "./commands/login";

const program = new Command();

program
  .storeOptionsAsProperties(false)
  .passCommandToAction(false);

program
  .name("mnotes")
  .description("CLI for m-notes AI knowledge base")
  .version(process.env.npm_package_version ?? "1.0.0")
  .option("--api-key <key>", "API key (or set MNOTES_API_KEY)")
  .option("--url <url>", "Base URL (or set MNOTES_URL)")
  .option("--json", "Output as JSON");

registerListCommand(program);
registerReadCommand(program);
registerSearchCommand(program);
registerCreateCommand(program);
registerUpdateCommand(program);
registerDeleteCommand(program);
registerConnectCommand(program);
registerLoginCommand(program);

program.parseAsync(process.argv).catch((err: Error) => {
  process.stderr.write(`Error: ${err.message}\n`);
  process.exit(1);
});
