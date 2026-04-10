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
/** Save a directory → workspace mapping in config. */
function saveDirectoryMapping(dir, workspaceId) {
    const stored = (0, login_1.readConfig)();
    if (!stored) {
        process.stderr.write("Error: not logged in. Run `mnotes login` first.\n");
        process.exit(1);
    }
    const workspaces = stored.workspaces ?? {};
    workspaces[dir] = workspaceId;
    (0, login_1.writeConfig)({ ...stored, workspaces });
}
/** Remove a directory → workspace mapping from config. */
function removeDirectoryMapping(dir) {
    const stored = (0, login_1.readConfig)();
    if (!stored?.workspaces?.[dir])
        return false;
    delete stored.workspaces[dir];
    (0, login_1.writeConfig)(stored);
    return true;
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
        const cwd = process.cwd();
        const dirMapped = stored?.workspaces?.[cwd];
        const globalDefault = stored?.workspaceId;
        for (const w of workspaces) {
            const markers = [];
            if (w.isDefault)
                markers.push("default");
            if (w.id === dirMapped)
                markers.push("linked");
            else if (w.id === globalDefault)
                markers.push("global");
            const suffix = markers.length > 0 ? `  (${markers.join(", ")})` : "";
            console.log(`  ${w.name} [${w.slug}]${suffix}`);
        }
    });
    ws.command("select")
        .description("Select workspace for current directory (saved to config)")
        .option("--global", "Set as global default instead of per-directory")
        .action(async (opts) => {
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
        const cwd = process.cwd();
        const currentId = stored?.workspaces?.[cwd] || stored?.workspaceId;
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stderr,
        });
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
            const selected = workspaces[choice - 1];
            if (opts.global) {
                const existing = stored ?? { apiKey: config.apiKey, serverUrl: config.baseUrl };
                (0, login_1.writeConfig)({ ...existing, workspaceId: selected.id });
                console.log(`Global default workspace: ${selected.name} [${selected.slug}]`);
            }
            else {
                saveDirectoryMapping(cwd, selected.id);
                console.log(`Linked ${cwd} → ${selected.name} [${selected.slug}]`);
            }
        }
        finally {
            rl.close();
        }
    });
    ws.command("link")
        .description("Link current directory to a workspace")
        .argument("[workspace-id]", "Workspace ID or slug (interactive if omitted)")
        .action(async (workspaceIdOrSlug) => {
        const globalOpts = program.opts();
        const config = (0, config_1.resolveConfig)(globalOpts);
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        const res = await client.listWorkspaces();
        const workspaces = res.data;
        if (workspaces.length === 0) {
            console.log("No workspaces found. Create one with: mnotes workspace create <name>");
            return;
        }
        const cwd = process.cwd();
        let selected;
        if (workspaceIdOrSlug) {
            selected = workspaces.find((w) => w.id === workspaceIdOrSlug || w.slug === workspaceIdOrSlug);
            if (!selected) {
                process.stderr.write(`Error: workspace "${workspaceIdOrSlug}" not found.\n`);
                process.exit(1);
            }
        }
        else {
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stderr,
            });
            try {
                process.stderr.write("\nWorkspaces:\n");
                for (let i = 0; i < workspaces.length; i++) {
                    const w = workspaces[i];
                    process.stderr.write(`  ${i + 1}. ${w.name} [${w.slug}]\n`);
                }
                const answer = await ask(rl, `\nLink to workspace [1-${workspaces.length}]: `);
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
        }
        saveDirectoryMapping(cwd, selected.id);
        console.log(`Linked ${cwd} → ${selected.name} [${selected.slug}]`);
    });
    ws.command("unlink")
        .description("Remove workspace mapping for current directory")
        .action(async () => {
        const cwd = process.cwd();
        const removed = removeDirectoryMapping(cwd);
        if (removed) {
            console.log(`Unlinked ${cwd}`);
        }
        else {
            console.log(`No workspace linked to ${cwd}`);
        }
    });
    ws.command("create")
        .description("Create a new workspace")
        .argument("<name>", "Workspace name")
        .action(async (name) => {
        const globalOpts = program.opts();
        const config = (0, config_1.resolveConfig)(globalOpts);
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        const res = await client.createWorkspace(name);
        console.log(`Created workspace: ${res.data.name} [${res.data.slug}]`);
        // Auto-link to current directory
        const cwd = process.cwd();
        saveDirectoryMapping(cwd, res.data.id);
        console.log(`Linked ${cwd} → ${res.data.name}`);
    });
    ws.command("current")
        .description("Show workspace for current directory")
        .action(async () => {
        const stored = (0, login_1.readConfig)();
        const cwd = process.cwd();
        // Check directory mapping first
        const dirMapped = stored?.workspaces?.[cwd];
        const effectiveId = dirMapped || stored?.workspaceId;
        const source = dirMapped ? "linked" : stored?.workspaceId ? "global" : null;
        if (!effectiveId) {
            console.log(`No workspace for ${cwd}`);
            console.log("Run: mnotes workspace select");
            return;
        }
        const config = (0, config_1.resolveConfig)(program.opts());
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        try {
            const res = await client.listWorkspaces();
            const current = res.data.find((w) => w.id === effectiveId);
            if (current) {
                console.log(`${current.name} [${current.slug}] (${source})`);
            }
            else {
                console.log(`${effectiveId} (${source}, not found on server)`);
            }
        }
        catch {
            console.log(`${effectiveId} (${source})`);
        }
    });
    ws.command("mappings")
        .description("Show all directory → workspace mappings")
        .action(async () => {
        const stored = (0, login_1.readConfig)();
        const workspaces = stored?.workspaces;
        if (!workspaces || Object.keys(workspaces).length === 0) {
            console.log("No directory mappings. Use: mnotes workspace link");
            return;
        }
        for (const [dir, wsId] of Object.entries(workspaces)) {
            console.log(`  ${dir} → ${wsId}`);
        }
        if (stored?.workspaceId) {
            console.log(`\n  Global default: ${stored.workspaceId}`);
        }
    });
}
