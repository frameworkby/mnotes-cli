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
exports.registerDeleteCommand = registerDeleteCommand;
const readline = __importStar(require("readline"));
const config_1 = require("../config");
const client_1 = require("../client");
const output_1 = require("../output");
function confirm(message) {
    if (!process.stdin.isTTY) {
        process.stderr.write("Error: Use --yes to confirm deletion in non-interactive mode.\n");
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
function registerDeleteCommand(program) {
    program
        .command("delete <id>")
        .description("Delete a note")
        .option("--yes", "Skip confirmation prompt")
        .action(async (id, opts) => {
        const globalOpts = program.opts();
        const config = (0, config_1.resolveConfig)(globalOpts);
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        if (!opts.yes) {
            const ok = await confirm(`Delete note ${id}?`);
            if (!ok) {
                process.stderr.write("Aborted.\n");
                process.exit(0);
            }
        }
        const result = await client.deleteNote(id);
        if (globalOpts.json) {
            (0, output_1.printJson)(result.data);
        }
        else {
            (0, output_1.printSuccess)(`Deleted note ${result.data.id}`);
        }
    });
}
