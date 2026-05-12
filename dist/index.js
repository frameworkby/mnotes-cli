#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildProgram = buildProgram;
const commander_1 = require("commander");
const node_crypto_1 = require("node:crypto");
const client_1 = require("./client");
const note_1 = require("./commands/note");
const workspace_1 = require("./commands/workspace");
const folder_1 = require("./commands/folder");
const file_1 = require("./commands/file");
const kb_1 = require("./commands/kb");
const graph_1 = require("./commands/graph");
const session_1 = require("./commands/session");
const cluster_1 = require("./commands/cluster");
const timeline_1 = require("./commands/timeline");
const moc_1 = require("./commands/moc");
const smart_folder_1 = require("./commands/smart-folder");
const task_1 = require("./commands/task");
const note_ext_1 = require("./commands/note-ext");
const recipe_1 = require("./commands/recipe");
const object_type_1 = require("./commands/object-type");
const bulk_1 = require("./commands/bulk");
const note_ops_1 = require("./commands/note-ops");
const tag_1 = require("./commands/tag");
const ws_1 = require("./commands/ws");
const info_1 = require("./commands/info");
const composite_1 = require("./commands/composite");
const wiki_1 = require("./commands/wiki");
const read_1 = require("./commands/read");
const search_1 = require("./commands/search");
const create_1 = require("./commands/create");
const update_1 = require("./commands/update");
const delete_1 = require("./commands/delete");
const connect_1 = require("./commands/connect");
const login_1 = require("./commands/login");
function buildProgram() {
    const program = new commander_1.Command();
    program
        .name("mnotes")
        .description("CLI for m-notes AI knowledge base")
        .version(require("../package.json").version)
        .option("--api-key <key>", "API key (or set MNOTES_API_KEY)")
        .option("--url <url>", "Base URL (or set MNOTES_URL)")
        .option("--json", "Output as JSON");
    (0, note_1.registerNoteGroup)(program);
    (0, workspace_1.registerWorkspaceGroup)(program);
    (0, folder_1.registerFolderGroup)(program);
    (0, file_1.registerFileGroup)(program);
    (0, kb_1.registerKbGroup)(program);
    (0, graph_1.registerGraphGroup)(program);
    (0, session_1.registerSessionGroup)(program);
    (0, cluster_1.registerClusterGroup)(program);
    (0, timeline_1.registerTimelineGroup)(program);
    (0, moc_1.registerMocGroup)(program);
    (0, smart_folder_1.registerSmartFolderGroup)(program);
    (0, task_1.registerTaskGroup)(program);
    (0, note_ext_1.registerNoteExtGroup)(program);
    (0, recipe_1.registerRecipeGroup)(program);
    (0, object_type_1.registerObjectTypeGroup)(program);
    (0, bulk_1.registerBulkGroup)(program);
    (0, note_ops_1.registerNoteOpsGroup)(program);
    (0, tag_1.registerTagGroup)(program);
    (0, ws_1.registerWsGroup)(program);
    (0, info_1.registerInfoGroup)(program);
    (0, composite_1.registerCompositeGroup)(program);
    (0, wiki_1.registerWikiGroup)(program);
    (0, read_1.registerReadCommand)(program);
    (0, search_1.registerSearchCommand)(program);
    (0, create_1.registerCreateCommand)(program);
    (0, update_1.registerUpdateCommand)(program);
    (0, delete_1.registerDeleteCommand)(program);
    (0, connect_1.registerConnectCommand)(program);
    (0, login_1.registerLoginCommand)(program);
    return program;
}
if (require.main === module) {
    // Tag every outgoing request from this CLI invocation with one session id, so
    // they group into a single SessionTrace row visible on /activity.
    const sessionId = process.env.MNOTES_SESSION_ID || (0, node_crypto_1.randomUUID)();
    const sessionLabel = process.argv.slice(2).filter((a) => !a.startsWith("-")).join(" ").slice(0, 255) || undefined;
    (0, client_1.setCliSession)({ sessionId, sessionLabel });
    buildProgram()
        .parseAsync(process.argv)
        .catch((err) => {
        process.stderr.write(`Error: ${err.message}\n`);
        process.exit(1);
    });
}
