#!/usr/bin/env node

import { Command } from "commander";
import { registerNoteGroup } from "./commands/note";
import { registerWorkspaceGroup } from "./commands/workspace";
import { registerFolderGroup } from "./commands/folder";
import { registerFileGroup } from "./commands/file";
import { registerKbGroup } from "./commands/kb";
import { registerGraphGroup } from "./commands/graph";
import { registerSessionGroup } from "./commands/session";
import { registerClusterGroup } from "./commands/cluster";
import { registerTimelineGroup } from "./commands/timeline";
import { registerMocGroup } from "./commands/moc";
import { registerSmartFolderGroup } from "./commands/smart-folder";
import { registerTaskGroup } from "./commands/task";
import { registerNoteExtGroup } from "./commands/note-ext";
import { registerRecipeGroup } from "./commands/recipe";
import { registerObjectTypeGroup } from "./commands/object-type";
import { registerBulkGroup } from "./commands/bulk";
import { registerNoteOpsGroup } from "./commands/note-ops";
import { registerTagGroup } from "./commands/tag";
import { registerWsGroup } from "./commands/ws";
import { registerInfoGroup } from "./commands/info";
import { registerCompositeGroup } from "./commands/composite";
import { registerReadCommand } from "./commands/read";
import { registerSearchCommand } from "./commands/search";
import { registerCreateCommand } from "./commands/create";
import { registerUpdateCommand } from "./commands/update";
import { registerDeleteCommand } from "./commands/delete";
import { registerConnectCommand } from "./commands/connect";
import { registerLoginCommand } from "./commands/login";

export function buildProgram(): Command {
  const program = new Command();

  program
    .name("mnotes")
    .description("CLI for m-notes AI knowledge base")
    .version(require("../package.json").version)
    .option("--api-key <key>", "API key (or set MNOTES_API_KEY)")
    .option("--url <url>", "Base URL (or set MNOTES_URL)")
    .option("--json", "Output as JSON");

  registerNoteGroup(program);
  registerWorkspaceGroup(program);
  registerFolderGroup(program);
  registerFileGroup(program);
  registerKbGroup(program);
  registerGraphGroup(program);
  registerSessionGroup(program);
  registerClusterGroup(program);
  registerTimelineGroup(program);
  registerMocGroup(program);
  registerSmartFolderGroup(program);
  registerTaskGroup(program);
  registerNoteExtGroup(program);
  registerRecipeGroup(program);
  registerObjectTypeGroup(program);
  registerBulkGroup(program);
  registerNoteOpsGroup(program);
  registerTagGroup(program);
  registerWsGroup(program);
  registerInfoGroup(program);
  registerCompositeGroup(program);

  registerReadCommand(program);
  registerSearchCommand(program);
  registerCreateCommand(program);
  registerUpdateCommand(program);
  registerDeleteCommand(program);
  registerConnectCommand(program);
  registerLoginCommand(program);

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
