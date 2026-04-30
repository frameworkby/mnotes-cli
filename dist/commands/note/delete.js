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
exports.deleteNoteAction = void 0;
const readline = __importStar(require("readline"));
const config_1 = require("../../config");
const client_1 = require("../../client");
const output_1 = require("../../output");
function confirm(message) {
    if (!process.stdin.isTTY) {
        process.stderr.write("Error: Use --force to confirm deletion in non-interactive mode.\n");
        process.exit(1);
    }
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stderr,
        });
        rl.question(`${message} [y/N] `, (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === "y");
        });
    });
}
exports.deleteNoteAction = {
    name: "delete",
    describe: "Delete a note",
    mcpTool: "delete_note",
    positional: ["id"],
    args: (cmd) => cmd
        .argument("<id>", "Note ID")
        .option("--force", "Skip confirmation prompt"),
    run: async (input, ctx) => {
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        if (!input.force && !ctx.json) {
            const ok = await confirm(`Delete note ${input.id}?`);
            if (!ok) {
                process.stderr.write("Aborted.\n");
                process.exit(0);
            }
        }
        const res = await client.deleteNote(input.id);
        return res.data;
    },
    renderHuman: (output) => {
        (0, output_1.printSuccess)(`Deleted note ${output.id}`);
    },
};
