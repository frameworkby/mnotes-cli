#!/usr/bin/env node

import { Command } from "commander";
import { registerGroup } from "./commands/_register-group";
import { listAction } from "./commands/note/list";
import { registerFolderGroup } from "./commands/folder";
import { registerFileGroup } from "./commands/file";
import { registerKbGroup } from "./commands/kb";
import { registerReadCommand } from "./commands/read";
import { registerSearchCommand } from "./commands/search";
import { registerCreateCommand } from "./commands/create";
import { registerUpdateCommand } from "./commands/update";
import { registerDeleteCommand } from "./commands/delete";
import { registerConnectCommand } from "./commands/connect";
import { registerLoginCommand } from "./commands/login";
import { registerWorkspaceCommand } from "./commands/workspace";
import { registerParityCommand } from "./commands/parity";

export function buildProgram(): Command {
  const program = new Command();

  program
    .name("mnotes")
    .description("CLI for m-notes AI knowledge base")
    .version(require("../package.json").version)
    .option("--api-key <key>", "API key (or set MNOTES_API_KEY)")
    .option("--url <url>", "Base URL (or set MNOTES_URL)")
    .option("--json", "Output as JSON");

  // New group-based registration. Hidden top-level alias `mnotes list` is kept
  // by `listAction.aliases`.
  registerGroup(program, "note", [listAction]);
  registerFolderGroup(program);
  registerFileGroup(program);
  registerKbGroup(program);

  // Legacy flat commands still register as before. They will migrate into
  // groups in subsequent sprint stories.
  registerReadCommand(program);
  registerSearchCommand(program);
  registerCreateCommand(program);
  registerUpdateCommand(program);
  registerDeleteCommand(program);
  registerConnectCommand(program);
  registerLoginCommand(program);
  registerWorkspaceCommand(program);
  registerParityCommand(program);

  return program;
}

if (require.main === module) {
  buildProgram()
    .parseAsync(process.argv)
    .catch((err: Error) => {
      process.stderr.write(`Error: ${err.message}\n`);
      process.exit(1);
    });
}
