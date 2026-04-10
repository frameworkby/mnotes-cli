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
exports.resolveWorkspaceInteractively = resolveWorkspaceInteractively;
const readline = __importStar(require("readline"));
const path = __importStar(require("path"));
const client_1 = require("../../client");
function ask(rl, question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.trim());
        });
    });
}
/**
 * Resolves the workspace ID interactively.
 * - If exactly one workspace exists, auto-selects it with confirmation (AC-4).
 * - If multiple exist, prompts user to select or create (AC-1).
 * - If none exist, prompts to create one (AC-2, AC-3).
 */
async function resolveWorkspaceInteractively(baseUrl, apiKey) {
    const client = (0, client_1.createClient)(baseUrl, apiKey);
    let workspaces;
    try {
        const res = await client.listWorkspaces();
        workspaces = res.data;
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(`Failed to fetch workspaces: ${message}`);
    }
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stderr,
    });
    try {
        // AC-4: Single workspace — auto-select with confirmation
        if (workspaces.length === 1) {
            const ws = workspaces[0];
            const answer = await ask(rl, `Use workspace "${ws.name}" (${ws.id})? [Y/n] `);
            if (answer === "" || answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
                return { id: ws.id, name: ws.name };
            }
            // User said no — fall through to create
            return await promptCreateWorkspace(rl, client);
        }
        // AC-1: Multiple workspaces — select or create
        if (workspaces.length > 0) {
            process.stderr.write("\nAvailable workspaces:\n");
            for (let i = 0; i < workspaces.length; i++) {
                const ws = workspaces[i];
                const defaultTag = ws.isDefault ? " (default)" : "";
                process.stderr.write(`  ${i + 1}. ${ws.name}${defaultTag}\n`);
            }
            process.stderr.write(`  ${workspaces.length + 1}. Create new workspace\n`);
            const answer = await ask(rl, `\nSelect workspace [1-${workspaces.length + 1}]: `);
            const choice = parseInt(answer, 10);
            if (choice >= 1 && choice <= workspaces.length) {
                const ws = workspaces[choice - 1];
                return { id: ws.id, name: ws.name };
            }
            if (choice === workspaces.length + 1) {
                return await promptCreateWorkspace(rl, client);
            }
            throw new Error(`Invalid selection: "${answer}". Expected a number between 1 and ${workspaces.length + 1}.`);
        }
        // No workspaces — must create
        process.stderr.write("No workspaces found. Let's create one.\n");
        return await promptCreateWorkspace(rl, client);
    }
    finally {
        rl.close();
    }
}
async function promptCreateWorkspace(rl, client) {
    const dirName = path.basename(process.cwd());
    const answer = await ask(rl, `Workspace name [${dirName}]: `);
    const name = answer || dirName;
    try {
        const res = await client.createWorkspace(name);
        process.stderr.write(`Created workspace "${res.data.name}" (${res.data.id})\n`);
        return { id: res.data.id, name: res.data.name };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(`Failed to create workspace: ${message}`);
    }
}
