#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const list_1 = require("./commands/list");
const read_1 = require("./commands/read");
const search_1 = require("./commands/search");
const create_1 = require("./commands/create");
const update_1 = require("./commands/update");
const delete_1 = require("./commands/delete");
const connect_1 = require("./commands/connect");
const login_1 = require("./commands/login");
const workspace_1 = require("./commands/workspace");
const program = new commander_1.Command();
program
    .name("mnotes")
    .description("CLI for m-notes AI knowledge base")
    .version(process.env.npm_package_version ?? "1.2.0")
    .option("--api-key <key>", "API key (or set MNOTES_API_KEY)")
    .option("--url <url>", "Base URL (or set MNOTES_URL)")
    .option("--json", "Output as JSON");
(0, list_1.registerListCommand)(program);
(0, read_1.registerReadCommand)(program);
(0, search_1.registerSearchCommand)(program);
(0, create_1.registerCreateCommand)(program);
(0, update_1.registerUpdateCommand)(program);
(0, delete_1.registerDeleteCommand)(program);
(0, connect_1.registerConnectCommand)(program);
(0, login_1.registerLoginCommand)(program);
(0, workspace_1.registerWorkspaceCommand)(program);
program.parseAsync(process.argv).catch((err) => {
    process.stderr.write(`Error: ${err.message}\n`);
    process.exit(1);
});
