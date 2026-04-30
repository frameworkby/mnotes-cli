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
exports.registerWorkspaceGroup = registerWorkspaceGroup;
const _register_group_1 = require("../_register-group");
const list_1 = require("./list");
const create_1 = require("./create");
const select_1 = require("./select");
const config_1 = require("../../config");
const client_1 = require("../../client");
const login_1 = require("../login");
const readline = __importStar(require("readline"));
function ask(rl, q) {
    return new Promise((resolve) => rl.question(q, (a) => resolve(a.trim())));
}
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
function removeDirectoryMapping(dir) {
    const stored = (0, login_1.readConfig)();
    if (!stored?.workspaces?.[dir])
        return false;
    delete stored.workspaces[dir];
    (0, login_1.writeConfig)(stored);
    return true;
}
function registerWorkspaceGroup(program) {
    (0, _register_group_1.registerGroup)(program, "workspace", [
        list_1.listWorkspacesAction,
        create_1.createWorkspaceAction,
        select_1.selectWorkspaceAction,
    ]);
    // Attach legacy local-config commands to the workspace group. These do not
    // map to MCP tools and stay outside the parity registry on purpose — they
    // manage *client-side* directory/global mappings, not server state.
    const ws = program.commands.find((c) => c.name() === "workspace");
    if (!ws)
        return;
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
            console.log("No workspaces found. Create one with: mnotes workspace create --name <name>");
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
            const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
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
        console.log(`Linked ${cwd} -> ${selected.name} [${selected.slug}]`);
    });
    ws.command("unlink")
        .description("Remove workspace mapping for current directory")
        .action(() => {
        const cwd = process.cwd();
        const removed = removeDirectoryMapping(cwd);
        console.log(removed ? `Unlinked ${cwd}` : `No workspace linked to ${cwd}`);
    });
    ws.command("current")
        .description("Show workspace for current directory")
        .action(async () => {
        const stored = (0, login_1.readConfig)();
        const cwd = process.cwd();
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
        .description("Show all directory -> workspace mappings")
        .action(() => {
        const stored = (0, login_1.readConfig)();
        const workspaces = stored?.workspaces;
        if (!workspaces || Object.keys(workspaces).length === 0) {
            console.log("No directory mappings. Use: mnotes workspace link");
            return;
        }
        for (const [dir, wsId] of Object.entries(workspaces)) {
            console.log(`  ${dir} -> ${wsId}`);
        }
        if (stored?.workspaceId) {
            console.log(`\n  Global default: ${stored.workspaceId}`);
        }
    });
}
