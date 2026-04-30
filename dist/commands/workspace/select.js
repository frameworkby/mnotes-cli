"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectWorkspaceAction = void 0;
const readline = __importStar(require("readline"));
const config_1 = require("../../config");
const client_1 = require("../../client");
const login_1 = require("../login");
const output_1 = require("../../output");
function ask(rl, question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => resolve(answer.trim()));
    });
}
/**
 * `workspace select` — sets the server-side default workspace for the user
 * (PATCH /api/v1/workspaces/:id with { isDefault: true }).
 *
 * Behaviour matrix:
 *   <id> given            → server-side default flip (parity with MCP set_active_workspace)
 *   no id, --global       → interactive picker, persists to global config (legacy)
 *   no id, no flag        → interactive picker, persists per-directory mapping (legacy)
 */
exports.selectWorkspaceAction = {
    name: "select",
    describe: "Set the active (default) workspace",
    mcpTool: "set_active_workspace",
    positional: ["id"],
    args: (cmd) => cmd
        .argument("[id]", "Workspace ID or slug")
        .option("--global", "Set as global default in CLI config (no server change)"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        // ── Fast path: positional id provided → server-side default flip ──────
        if (input.id) {
            // Resolve slug → id if needed.
            let workspaceId = input.id;
            const list = await client.listWorkspaces();
            const found = list.data.find((w) => w.id === input.id || w.slug === input.id);
            if (!found) {
                process.stderr.write(`Error: workspace "${input.id}" not found.\n`);
                process.exit(1);
            }
            workspaceId = found.id;
            const res = await client.setActiveWorkspace(workspaceId);
            return res.data;
        }
        // ── Legacy interactive picker ─────────────────────────────────────────
        const list = await client.listWorkspaces();
        const workspaces = list.data;
        if (workspaces.length === 0) {
            process.stderr.write("No workspaces found. Create one with: mnotes workspace create --name <name>\n");
            process.exit(1);
        }
        const stored = (0, login_1.readConfig)();
        const cwd = process.cwd();
        const currentId = stored?.workspaces?.[cwd] || stored?.workspaceId;
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stderr,
        });
        let selected;
        try {
            process.stderr.write("\nWorkspaces:\n");
            for (let i = 0; i < workspaces.length; i++) {
                const w = workspaces[i];
                const marker = w.id === currentId ? " *" : "";
                process.stderr.write(`  ${i + 1}. ${w.name} [${w.slug}]${marker}\n`);
            }
            const answer = await ask(rl, `\nSelect workspace [1-${workspaces.length}]: `);
            const choice = parseInt(answer, 10);
            if (choice < 1 || choice > workspaces.length || isNaN(choice)) {
                process.stderr.write("Invalid selection.\n");
                process.exit(1);
            }
            selected = workspaces[choice - 1];
        }
        finally {
            rl.close();
        }
        if (input.global) {
            const existing = stored ?? { apiKey: config.apiKey, serverUrl: config.baseUrl };
            (0, login_1.writeConfig)({ ...existing, workspaceId: selected.id });
        }
        else {
            const existing = stored ?? { apiKey: config.apiKey, serverUrl: config.baseUrl };
            const workspacesMap = existing.workspaces ?? {};
            workspacesMap[cwd] = selected.id;
            (0, login_1.writeConfig)({ ...existing, workspaces: workspacesMap });
        }
        return selected;
    },
    renderHuman: (output) => {
        (0, output_1.printSuccess)(`Active workspace: ${output.name} [${output.slug}]`);
    },
};
