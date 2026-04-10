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
exports.registerWorkspaceCommand = registerWorkspaceCommand;
const readline = __importStar(require("readline"));
const config_1 = require("../config");
const client_1 = require("../client");
const login_1 = require("./login");
function ask(rl, question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.trim());
        });
    });
}
function registerWorkspaceCommand(program) {
    const ws = program
        .command("workspace")
        .description("Manage workspaces");
    ws.command("list")
        .description("List all workspaces")
        .action(async () => {
        const globalOpts = program.opts();
        const config = (0, config_1.resolveConfig)(globalOpts);
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        const res = await client.listWorkspaces();
        const workspaces = res.data;
        if (workspaces.length === 0) {
            console.log("No workspaces found. Create one with: mnotes workspace create <name>");
            return;
        }
        const stored = (0, login_1.readConfig)();
        const selectedId = stored?.workspaceId;
        for (const w of workspaces) {
            const markers = [];
            if (w.isDefault)
                markers.push("default");
            if (w.id === selectedId)
                markers.push("selected");
            const suffix = markers.length > 0 ? `  (${markers.join(", ")})` : "";
            console.log(`  ${w.name} [${w.slug}]${suffix}`);
        }
    });
    ws.command("select")
        .description("Select default workspace (saved to config)")
        .action(async () => {
        const globalOpts = program.opts();
        const config = (0, config_1.resolveConfig)(globalOpts);
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        const res = await client.listWorkspaces();
        const workspaces = res.data;
        if (workspaces.length === 0) {
            console.log("No workspaces found. Create one with: mnotes workspace create <name>");
            return;
        }
        const stored = (0, login_1.readConfig)();
        const selectedId = stored?.workspaceId;
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stderr,
        });
        try {
            process.stderr.write("\nWorkspaces:\n");
            for (let i = 0; i < workspaces.length; i++) {
                const w = workspaces[i];
                const marker = w.id === selectedId ? " *" : "";
                process.stderr.write(`  ${i + 1}. ${w.name} [${w.slug}]${marker}\n`);
            }
            const answer = await ask(rl, `\nSelect workspace [1-${workspaces.length}]: `);
            const choice = parseInt(answer, 10);
            if (choice < 1 || choice > workspaces.length || isNaN(choice)) {
                process.stderr.write("Invalid selection.\n");
                process.exit(1);
            }
            const selected = workspaces[choice - 1];
            const existing = stored ?? { apiKey: config.apiKey, serverUrl: config.baseUrl };
            (0, login_1.writeConfig)({ ...existing, workspaceId: selected.id });
            console.log(`Selected workspace: ${selected.name} [${selected.slug}]`);
        }
        finally {
            rl.close();
        }
    });
    ws.command("create <name>")
        .description("Create a new workspace")
        .action(async (name) => {
        const globalOpts = program.opts();
        const config = (0, config_1.resolveConfig)(globalOpts);
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        const res = await client.createWorkspace(name);
        console.log(`Created workspace: ${res.data.name} [${res.data.slug}]`);
        const stored = (0, login_1.readConfig)();
        if (!stored?.workspaceId) {
            const existing = stored ?? { apiKey: config.apiKey, serverUrl: config.baseUrl };
            (0, login_1.writeConfig)({ ...existing, workspaceId: res.data.id });
            console.log("Auto-selected as default workspace.");
        }
    });
    ws.command("current")
        .description("Show currently selected workspace")
        .action(async () => {
        const stored = (0, login_1.readConfig)();
        if (stored?.workspaceId) {
            const config = (0, config_1.resolveConfig)(program.opts());
            const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
            try {
                const res = await client.listWorkspaces();
                const current = res.data.find((w) => w.id === stored.workspaceId);
                if (current) {
                    console.log(`Current workspace: ${current.name} [${current.slug}]`);
                }
                else {
                    console.log(`Current workspace ID: ${stored.workspaceId} (not found on server)`);
                }
            }
            catch {
                console.log(`Current workspace ID: ${stored.workspaceId}`);
            }
        }
        else {
            console.log("No workspace selected. Run: mnotes workspace select");
        }
    });
}
