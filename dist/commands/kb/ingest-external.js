"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ingestExternalAction = void 0;
const node_fs_1 = require("node:fs");
const config_1 = require("../../config");
const client_1 = require("../../client");
const SOURCE_TYPES = [
    "web_page",
    "pdf",
    "email",
    "slack",
    "meeting",
    "other",
];
exports.ingestExternalAction = {
    name: "ingest-external",
    describe: "Ingest external content (web page, PDF, email, slack, meeting, other) into the knowledge base. If --source-url matches an existing note's provenance, the note is updated; otherwise a new note is created. Content is capped at 100KB.",
    mcpTool: "ingest_external",
    args: (cmd) => cmd
        .option("--title <title>", "Note title")
        .option("--content <content>", "Inline content (markdown)")
        .option("--content-file <path>", "Path to a file whose contents become the note body")
        .option("--source-type <type>", `One of: ${SOURCE_TYPES.join(", ")}`)
        .option("--source-url <url>", "Canonical URL (enables upsert by URL)")
        .option("--source-ref <ref>", "Opaque reference (e.g. message ID); never triggers upsert")
        .option("--tags <csv>", "Comma-separated tags")
        .option("--folder-id <id>", "Target folder (defaults to workspace root)")
        .option("--folder <id>", "Alias for --folder-id"),
    run: async (input, ctx) => {
        if (!input.title)
            throw new Error("--title is required");
        if (!input.sourceType)
            throw new Error("--source-type is required");
        if (!SOURCE_TYPES.includes(input.sourceType)) {
            throw new Error(`Invalid --source-type. Must be one of: ${SOURCE_TYPES.join(", ")}`);
        }
        if (!input.content && !input.contentFile) {
            throw new Error("--content or --content-file is required");
        }
        if (input.content && input.contentFile) {
            throw new Error("--content and --content-file are mutually exclusive");
        }
        if (!input.sourceUrl && !input.sourceRef) {
            throw new Error("--source-url or --source-ref is required");
        }
        const content = input.contentFile
            ? (0, node_fs_1.readFileSync)(input.contentFile, "utf8")
            : input.content;
        const tags = input.tags
            ? input.tags
                .split(",")
                .map((t) => t.trim())
                .filter((t) => t.length > 0)
            : undefined;
        const config = (0, config_1.resolveConfig)(ctx.globalOpts);
        const workspaceId = config.workspaceId;
        if (!workspaceId) {
            throw new Error("No workspace configured. Run `mnotes login` or set MNOTES_WORKSPACE_ID.");
        }
        const client = (0, client_1.createClient)(config.baseUrl, config.apiKey);
        return client.ingestExternal({
            workspaceId,
            title: input.title,
            content,
            sourceType: input.sourceType,
            sourceUrl: input.sourceUrl,
            sourceRef: input.sourceRef,
            tags,
            folderId: input.folderId ?? input.folder,
        });
    },
};
