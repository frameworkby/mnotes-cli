"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setCliSession = setCliSession;
exports.createClient = createClient;
let cliSession = {};
/**
 * Called once at CLI startup so every subsequent `createClient` call automatically
 * tags requests with the same `X-Mnotes-Session-Id` — making one CLI invocation
 * produce one SessionTrace row server-side.
 */
function setCliSession(s) {
    cliSession = { sessionId: s.sessionId, sessionLabel: s.sessionLabel };
}
function createClient(baseUrl, apiKey, opts = {}) {
    const sessionId = opts.sessionId ?? cliSession.sessionId;
    const sessionLabel = opts.sessionLabel ?? cliSession.sessionLabel;
    const headers = {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
    };
    if (sessionId)
        headers["X-Mnotes-Session-Id"] = sessionId;
    if (sessionLabel)
        headers["X-Mnotes-Session-Label"] = sessionLabel;
    async function request(method, path, body) {
        const url = `${baseUrl}${path}`;
        const res = await fetch(url, {
            method,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
        if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
        }
        return res.json();
    }
    return {
        async listNotes(opts) {
            const params = new URLSearchParams();
            if (opts?.workspaceId)
                params.set("workspaceId", opts.workspaceId);
            if (opts?.folderId)
                params.set("folderId", opts.folderId);
            if (opts?.cursor)
                params.set("cursor", opts.cursor);
            if (opts?.limit)
                params.set("limit", String(opts.limit));
            const qs = params.toString();
            return request("GET", `/api/v1/notes${qs ? `?${qs}` : ""}`);
        },
        async getNote(id) {
            return request("GET", `/api/v1/notes/${encodeURIComponent(id)}`);
        },
        async searchNotes(opts) {
            return request("POST", "/api/v1/notes/search", opts);
        },
        async createNote(opts) {
            return request("POST", "/api/v1/notes", opts);
        },
        async updateNote(id, opts) {
            return request("PUT", `/api/v1/notes/${encodeURIComponent(id)}`, opts);
        },
        async deleteNote(id) {
            return request("DELETE", `/api/v1/notes/${encodeURIComponent(id)}`);
        },
        async listWorkspaces() {
            return request("GET", "/api/v1/workspaces");
        },
        async recallKnowledge(opts) {
            return request("POST", "/api/v1/knowledge/recall", {
                query: opts.query,
                workspaceId: opts.workspaceId,
                tags: opts.tags,
                limit: opts.limit,
            });
        },
        async queryGraph(opts) {
            const params = new URLSearchParams();
            if (opts?.workspaceId)
                params.set("workspaceId", opts.workspaceId);
            if (opts?.query)
                params.set("query", opts.query);
            if (opts?.nodeType)
                params.set("nodeType", opts.nodeType);
            if (opts?.neighbors)
                params.set("neighbors", opts.neighbors);
            if (opts?.depth)
                params.set("depth", String(opts.depth));
            if (opts?.limit)
                params.set("limit", String(opts.limit));
            const qs = params.toString();
            return request("GET", `/api/v1/graph${qs ? `?${qs}` : ""}`);
        },
        // ── Folders ────────────────────────────────────────────────────────
        async listFolders(opts) {
            const params = new URLSearchParams();
            params.set("workspaceId", opts.workspaceId);
            if (opts.cursor)
                params.set("cursor", opts.cursor);
            if (opts.limit)
                params.set("limit", String(opts.limit));
            return request("GET", `/api/v1/folders?${params.toString()}`);
        },
        async getWorkspaceSummary(workspaceId) {
            const params = new URLSearchParams({ workspaceId });
            return request("GET", `/api/v1/folders/summary?${params.toString()}`);
        },
        async createFolder(opts) {
            return request("POST", "/api/v1/folders", opts);
        },
        async renameFolder(id, name) {
            return request("PATCH", `/api/v1/folders/${encodeURIComponent(id)}`, { name });
        },
        async deleteFolder(id) {
            return request("DELETE", `/api/v1/folders/${encodeURIComponent(id)}`);
        },
        async listEmptyFolders(opts) {
            return request("POST", "/api/v1/folders/list-empty", opts);
        },
        async moveFolder(id, parentId) {
            return request("POST", `/api/v1/folders/${encodeURIComponent(id)}/move`, { parentId });
        },
        async getRecentNotes(opts) {
            const params = new URLSearchParams();
            params.set("since", opts.since);
            params.set("workspaceId", opts.workspaceId);
            if (opts.limit)
                params.set("limit", String(opts.limit));
            return request("GET", `/api/v1/notes/recent?${params.toString()}`);
        },
        async searchByTags(opts) {
            const params = new URLSearchParams();
            // Send repeated `tags` params for clarity; the API accepts both repeated
            // and CSV forms. Repeated is unambiguous when tag values themselves
            // contain commas.
            for (const t of opts.tags)
                params.append("tags", t);
            params.set("workspaceId", opts.workspaceId);
            if (opts.match)
                params.set("match", opts.match);
            if (opts.limit)
                params.set("limit", String(opts.limit));
            return request("GET", `/api/v1/notes/search-by-tags?${params.toString()}`);
        },
        // ── Knowledge ──────────────────────────────────────────────────────
        async knowledgeStore(opts) {
            return request("POST", "/api/v1/knowledge/store", opts);
        },
        async memoryUpsert(opts) {
            return request("POST", "/api/v1/knowledge/memory", opts);
        },
        async knowledgeIngest(opts) {
            return request("POST", "/api/v1/knowledge/ingest", opts);
        },
        async checkIngestedSources(opts) {
            return request("POST", "/api/v1/knowledge/check-ingested", opts);
        },
        async wikiLint(opts) {
            return request("POST", "/api/v1/notes/wiki-lint", opts);
        },
        async ingestExternal(opts) {
            return request("POST", "/api/v1/knowledge/ingest-external", opts);
        },
        async knowledgeDecay(opts) {
            return request("POST", "/api/v1/knowledge/decay", opts);
        },
        async archiveStaleMemories(opts) {
            return request("POST", "/api/v1/knowledge/archive-stale", opts);
        },
        async consolidateMemories(opts) {
            return request("POST", "/api/v1/knowledge/consolidate", opts);
        },
        /**
         * `format=markdown` returns `text/markdown`, not JSON. We surface the raw
         * text so the CLI can either print it (human mode) or wrap it in a JSON
         * envelope with `{ markdown }` if a future tool wants structured output.
         * `format=json` (default) returns the structured envelope.
         */
        async knowledgeSnapshot(opts) {
            const url = `${baseUrl}/api/v1/knowledge/snapshot`;
            const res = await fetch(url, {
                method: "POST",
                headers,
                body: JSON.stringify(opts),
            });
            if (!res.ok) {
                const text = await res.text().catch(() => "");
                throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
            }
            const ct = res.headers.get("content-type") ?? "";
            if (ct.includes("text/markdown")) {
                return { markdown: await res.text() };
            }
            return (await res.json());
        },
        async askNotes(opts) {
            return request("POST", "/api/v1/knowledge/ask", opts);
        },
        async knowledgeLink(opts) {
            return request("POST", "/api/v1/knowledge/link", opts);
        },
        async scanKnowledgeConflicts(opts) {
            return request("POST", "/api/v1/knowledge/scan-conflicts", opts);
        },
        async getKnowledgeConflicts(opts) {
            const params = new URLSearchParams({ workspaceId: opts.workspaceId });
            if (opts.classification)
                params.set("classification", opts.classification);
            return request("GET", `/api/v1/knowledge/conflicts?${params.toString()}`);
        },
        async getKbStats(workspaceId) {
            const params = new URLSearchParams({ workspaceId });
            return request("GET", `/api/v1/knowledge/stats?${params.toString()}`);
        },
        async uploadFile(opts) {
            return request("POST", "/api/v1/files", opts);
        },
        // ── Graph ────────────────────────────────────────────────────────────
        async getGraph(opts) {
            const params = new URLSearchParams({ workspaceId: opts.workspaceId });
            if (opts.query)
                params.set("query", opts.query);
            if (opts.nodeType)
                params.set("nodeType", opts.nodeType);
            if (opts.limit != null)
                params.set("limit", String(opts.limit));
            const res = await request("GET", `/api/v1/graph?${params.toString()}`);
            return res.data;
        },
        async getNeighbors(opts) {
            const params = new URLSearchParams({
                workspaceId: opts.workspaceId,
                neighbors: opts.nodeId,
            });
            if (opts.depth != null)
                params.set("depth", String(opts.depth));
            const res = await request("GET", `/api/v1/graph?${params.toString()}`);
            return res.data;
        },
        async graphTraverse(opts) {
            return request("POST", "/api/v1/graph/traverse", opts);
        },
        async findPath(opts) {
            return request("POST", "/api/v1/graph/find-path", opts);
        },
        async queryGraphAdvanced(opts) {
            return request("POST", "/api/v1/graph/query", opts);
        },
        async queryNoteGraph(opts) {
            return request("POST", "/api/v1/graph/query-note", opts);
        },
        async populateGraph(opts) {
            return request("POST", "/api/v1/graph/populate", opts);
        },
        async relatedNotes(id, opts) {
            const params = new URLSearchParams({ workspaceId: opts.workspaceId });
            if (opts.limit != null)
                params.set("limit", String(opts.limit));
            if (opts.minSimilarity != null)
                params.set("minSimilarity", String(opts.minSimilarity));
            return request("GET", `/api/v1/graph/related/${encodeURIComponent(id)}?${params.toString()}`);
        },
        async getBacklinks(id, workspaceId) {
            const params = new URLSearchParams({ workspaceId });
            return request("GET", `/api/v1/graph/backlinks/${encodeURIComponent(id)}?${params.toString()}`);
        },
        async getNoteLinks(id, workspaceId) {
            const params = new URLSearchParams({ workspaceId });
            return request("GET", `/api/v1/graph/links/${encodeURIComponent(id)}?${params.toString()}`);
        },
        async createGraphNode(opts) {
            return request("POST", "/api/v1/graph/nodes", opts);
        },
        async deleteGraphNode(id, workspaceId) {
            const params = new URLSearchParams({ workspaceId });
            return request("DELETE", `/api/v1/graph/nodes/${encodeURIComponent(id)}?${params.toString()}`);
        },
        async createGraphEdge(opts) {
            return request("POST", "/api/v1/graph/edges", opts);
        },
        async deleteGraphEdge(id, workspaceId) {
            const params = new URLSearchParams({ workspaceId });
            return request("DELETE", `/api/v1/graph/edges/${encodeURIComponent(id)}?${params.toString()}`);
        },
        // ── Sessions ─────────────────────────────────────────────────────────
        async listSessions(opts) {
            const params = new URLSearchParams();
            if (opts.workspaceId)
                params.set("workspaceId", opts.workspaceId);
            if (opts.limit != null)
                params.set("limit", String(opts.limit));
            if (opts.cursor)
                params.set("cursor", opts.cursor);
            const qs = params.toString();
            return request("GET", `/api/v1/sessions${qs ? `?${qs}` : ""}`);
        },
        async sessionLog(opts) {
            return request("POST", "/api/v1/sessions/log", opts);
        },
        async getSessionReplay(id, workspaceId) {
            const params = new URLSearchParams();
            if (workspaceId)
                params.set("workspaceId", workspaceId);
            const qs = params.toString();
            return request("GET", `/api/v1/sessions/${encodeURIComponent(id)}/replay${qs ? `?${qs}` : ""}`);
        },
        async sessionContextResume(opts) {
            const body = { workspaceId: opts.workspaceId };
            if (opts.sessionId)
                body.sessionId = opts.sessionId;
            if (opts.includeNotes !== undefined)
                body.include_notes = opts.includeNotes;
            return request("POST", "/api/v1/sessions/resume", body);
        },
        // ── Clusters ─────────────────────────────────────────────────────────
        async getClusters(workspaceId) {
            const params = new URLSearchParams({ workspaceId });
            const res = await request("GET", `/api/v1/clusters?${params.toString()}`);
            return res.data;
        },
        // ── Timeline ─────────────────────────────────────────────────────────
        async listTimeline(opts) {
            const params = new URLSearchParams({ workspaceId: opts.workspaceId });
            if (opts.from)
                params.set("from", opts.from);
            if (opts.to)
                params.set("to", opts.to);
            if (opts.limit != null)
                params.set("limit", String(opts.limit));
            const res = await request("GET", `/api/v1/timeline?${params.toString()}`);
            return res.data;
        },
        // ── MoC ──────────────────────────────────────────────────────────────
        async generateMoc(opts) {
            const res = await request("POST", "/api/v1/mocs", opts);
            return res.data;
        },
        // ── Smart folders ────────────────────────────────────────────────────
        async listSmartFolders(workspaceId) {
            const params = new URLSearchParams({ workspaceId });
            const res = await request("GET", `/api/v1/smart-folders?${params.toString()}`);
            return res.data;
        },
        async createSmartFolder(opts) {
            const res = await request("POST", "/api/v1/smart-folders", opts);
            return res.data;
        },
        async deleteSmartFolder(id, workspaceId) {
            const params = new URLSearchParams({ workspaceId });
            const res = await request("DELETE", `/api/v1/smart-folders/${encodeURIComponent(id)}?${params.toString()}`);
            return res.data;
        },
        // ── Tasks ────────────────────────────────────────────────────────────
        async listTasks(opts) {
            const params = new URLSearchParams({ workspaceId: opts.workspaceId });
            if (opts.status)
                params.set("status", opts.status);
            if (opts.tag)
                params.set("tag", opts.tag);
            if (opts.noteId)
                params.set("noteId", opts.noteId);
            if (opts.limit != null)
                params.set("limit", String(opts.limit));
            const res = await request("GET", `/api/v1/tasks?${params.toString()}`);
            return res.data;
        },
        async toggleTask(opts) {
            const res = await request("POST", "/api/v1/tasks/toggle", opts);
            return res.data;
        },
        async createWorkspace(name, opts) {
            const body = { name };
            if (opts?.description !== undefined)
                body.description = opts.description;
            return request("POST", "/api/v1/workspaces", body);
        },
        async setActiveWorkspace(id) {
            return request("PATCH", `/api/v1/workspaces/${encodeURIComponent(id)}`, {
                isDefault: true,
            });
        },
        // ── Note extension, recipe, object-type, bulk (added by #751) ─────────
        async suggestTags(id, workspaceId) {
            const params = new URLSearchParams({ workspaceId });
            const res = await request("GET", `/api/v1/notes/${encodeURIComponent(id)}/suggest-tags?${params.toString()}`);
            return res.data;
        },
        async suggestTagsLinks(id, workspaceId) {
            const params = new URLSearchParams({ workspaceId });
            const res = await request("GET", `/api/v1/notes/${encodeURIComponent(id)}/suggest-tags-links?${params.toString()}`);
            return res.data;
        },
        async setImportance(id, opts) {
            const res = await request("PUT", `/api/v1/notes/${encodeURIComponent(id)}/importance`, opts);
            return res.data;
        },
        async setProvenance(id, opts) {
            const res = await request("PUT", `/api/v1/notes/${encodeURIComponent(id)}/provenance`, opts);
            return res.data;
        },
        async getProvenance(id, workspaceId) {
            const params = new URLSearchParams({ workspaceId });
            const res = await request("GET", `/api/v1/notes/${encodeURIComponent(id)}/provenance?${params.toString()}`);
            return res.data;
        },
        async splitNote(id, opts) {
            const res = await request("POST", `/api/v1/notes/${encodeURIComponent(id)}/split`, opts);
            return res.data;
        },
        async synthesizeNotes(opts) {
            const res = await request("POST", "/api/v1/notes/synthesize", opts);
            return res.data;
        },
        // ── Recipes ────────────────────────────────────────────────────────
        async listRecipes(_workspaceId) {
            // workspaceId is accepted by the route but recipes are user-scoped; we
            // forward it for forward-compat with future workspace-scoped recipes.
            const params = new URLSearchParams({ workspaceId: _workspaceId });
            const res = await request("GET", `/api/v1/recipes?${params.toString()}`);
            return res.data;
        },
        async runRecipe(id, opts) {
            const res = await request("POST", `/api/v1/recipes/${encodeURIComponent(id)}/run`, opts);
            return res.data;
        },
        // ── Object types ───────────────────────────────────────────────────
        async listObjectTypes(workspaceId) {
            const params = new URLSearchParams({ workspaceId });
            const res = await request("GET", `/api/v1/object-types?${params.toString()}`);
            return res.data;
        },
        async queryByType(type, opts) {
            const params = new URLSearchParams({ workspaceId: opts.workspaceId });
            if (opts.limit != null)
                params.set("limit", String(opts.limit));
            if (opts.propertyFilters)
                params.set("propertyFilters", opts.propertyFilters);
            const res = await request("GET", `/api/v1/object-types/${encodeURIComponent(type)}/query?${params.toString()}`);
            return res.data;
        },
        // ── Bulk ───────────────────────────────────────────────────────────
        async bulkArchive(opts) {
            const res = await request("POST", "/api/v1/bulk/archive", opts);
            return res.data;
        },
        async bulkMove(opts) {
            const res = await request("POST", "/api/v1/bulk/move", opts);
            return res.data;
        },
        async bulkTag(opts) {
            const res = await request("POST", "/api/v1/bulk/tag", opts);
            return res.data;
        },
        async bulkKnowledgeRecall(opts) {
            const res = await request("POST", "/api/v1/bulk/knowledge-recall", opts);
            return res.data;
        },
        // ── Save conversation (#752) ───────────────────────────────────────────
        async saveConversation(opts) {
            return request("POST", "/api/v1/save-conversation", opts);
        },
        // ── Note ops (#752) ────────────────────────────────────────────────────
        async appendToNote(id, opts) {
            return request("POST", `/api/v1/notes/${encodeURIComponent(id)}/append`, opts);
        },
        async archiveNote(id, workspaceId) {
            return request("POST", `/api/v1/notes/${encodeURIComponent(id)}/archive`, {
                workspaceId,
            });
        },
        async pinNote(id, workspaceId) {
            return request("POST", `/api/v1/notes/${encodeURIComponent(id)}/pin`, {
                workspaceId,
            });
        },
        async unpinNote(id, workspaceId) {
            const params = new URLSearchParams({ workspaceId });
            return request("DELETE", `/api/v1/notes/${encodeURIComponent(id)}/pin?${params.toString()}`);
        },
        async toggleStar(id, opts) {
            return request("POST", `/api/v1/notes/${encodeURIComponent(id)}/star`, opts);
        },
        async getNoteFrontmatter(id, workspaceId) {
            const params = new URLSearchParams({ workspaceId });
            return request("GET", `/api/v1/notes/${encodeURIComponent(id)}/frontmatter?${params.toString()}`);
        },
        async setNoteFrontmatter(id, opts) {
            return request("PUT", `/api/v1/notes/${encodeURIComponent(id)}/frontmatter`, opts);
        },
        async setNoteType(id, opts) {
            return request("PUT", `/api/v1/notes/${encodeURIComponent(id)}/type`, { workspaceId: opts.workspaceId, type: opts.type });
        },
        async listVersions(id, opts) {
            const params = new URLSearchParams({ workspaceId: opts.workspaceId });
            if (opts.limit != null)
                params.set("limit", String(opts.limit));
            return request("GET", `/api/v1/notes/${encodeURIComponent(id)}/versions?${params.toString()}`);
        },
        async restoreVersion(id, opts) {
            return request("POST", `/api/v1/notes/${encodeURIComponent(id)}/restore-version`, opts);
        },
        async getNoteByTitle(opts) {
            const params = new URLSearchParams({
                workspaceId: opts.workspaceId,
                title: opts.title,
            });
            return request("GET", `/api/v1/notes/by-title?${params.toString()}`);
        },
        async getNotesBatch(opts) {
            return request("POST", "/api/v1/notes/batch", opts);
        },
        async listPinned(workspaceId) {
            const params = new URLSearchParams({ workspaceId });
            return request("GET", `/api/v1/notes/pinned?${params.toString()}`);
        },
        async listStarred(workspaceId) {
            const params = new URLSearchParams({ workspaceId });
            return request("GET", `/api/v1/notes/starred?${params.toString()}`);
        },
        async staleNotes(opts) {
            const params = new URLSearchParams({ workspaceId: opts.workspaceId });
            if (opts.daysSince != null)
                params.set("daysSince", String(opts.daysSince));
            if (opts.limit != null)
                params.set("limit", String(opts.limit));
            return request("GET", `/api/v1/notes/stale?${params.toString()}`);
        },
        async orphanNotes(opts) {
            const params = new URLSearchParams({ workspaceId: opts.workspaceId });
            if (opts.limit != null)
                params.set("limit", String(opts.limit));
            return request("GET", `/api/v1/notes/orphan?${params.toString()}`);
        },
        async findDuplicates(opts) {
            const params = new URLSearchParams({
                workspaceId: opts.workspaceId,
                noteId: opts.noteId,
            });
            if (opts.threshold != null)
                params.set("threshold", String(opts.threshold));
            if (opts.limit != null)
                params.set("limit", String(opts.limit));
            return request("GET", `/api/v1/notes/duplicates?${params.toString()}`);
        },
        async dailyNote(opts) {
            return request("POST", "/api/v1/notes/daily", opts);
        },
        async dailyDigest(opts) {
            const params = new URLSearchParams({ workspaceId: opts.workspaceId });
            if (opts.date)
                params.set("date", opts.date);
            return request("GET", `/api/v1/notes/daily-digest?${params.toString()}`);
        },
        async noteSummary(id, opts) {
            const params = new URLSearchParams({ workspaceId: opts.workspaceId });
            if (opts.maxLength != null)
                params.set("maxLength", String(opts.maxLength));
            return request("GET", `/api/v1/notes/${encodeURIComponent(id)}/summary?${params.toString()}`);
        },
        // ── Tags (#752) ────────────────────────────────────────────────────────
        async listTags(workspaceId) {
            const params = new URLSearchParams({ workspaceId });
            return request("GET", `/api/v1/tags?${params.toString()}`);
        },
        async manageTags(opts) {
            return request("POST", "/api/v1/tags/manage", opts);
        },
        async extractEntities(opts) {
            return request("POST", "/api/v1/tags/extract-entities", opts);
        },
        // ── Workspace extended (#752) ──────────────────────────────────────────
        async getWorkspaceContext(workspaceId) {
            const params = new URLSearchParams({ workspaceId });
            return request("GET", `/api/v1/workspaces/context?${params.toString()}`);
        },
        async getWorkspaceRole(id) {
            return request("GET", `/api/v1/workspaces/${encodeURIComponent(id)}/role`);
        },
        /**
         * Stamps `firstAgentConnectAt` on the workspace (idempotent — server-side
         * null guard means only the first call has any effect).
         * Called by handleClaude / handleCursor after writing config to disk.
         */
        async markAgentConnected(id) {
            await request("POST", `/api/v1/workspaces/${encodeURIComponent(id)}/mark-agent-connected`);
        },
        async updateWorkspace(id, opts) {
            return request("PATCH", `/api/v1/workspaces/${encodeURIComponent(id)}`, opts);
        },
        async deleteWorkspace(id) {
            return request("DELETE", `/api/v1/workspaces/${encodeURIComponent(id)}`);
        },
        async setupWorkspace(opts) {
            return request("POST", "/api/v1/workspaces/setup", opts);
        },
        async listTeamMembers(id) {
            return request("GET", `/api/v1/workspaces/${encodeURIComponent(id)}/team-members`);
        },
        // ── Info (#752) ────────────────────────────────────────────────────────
        async getVersion() {
            return request("GET", "/api/v1/version");
        },
        async contextFetch(opts) {
            return request("POST", "/api/v1/composites/context-fetch", opts);
        },
        async projectContextLoad(opts) {
            return request("POST", "/api/v1/composites/project-context-load", opts);
        },
        // ── Wiki index / log (#936) ────────────────────────────────────────────────
        async wikiBootstrap(workspaceId) {
            return request("POST", "/api/v1/wiki/bootstrap", {
                workspaceId,
            });
        },
        async wikiIndexRefresh(workspaceId) {
            return request("POST", "/api/v1/wiki/index/refresh", {
                workspaceId,
            });
        },
        async wikiLogAppend(opts) {
            return request("POST", "/api/v1/wiki/log/append", opts);
        },
        async wikiLogTail(opts) {
            const params = new URLSearchParams({ workspaceId: opts.workspaceId });
            if (opts.limit != null)
                params.set("limit", String(opts.limit));
            return request("GET", `/api/v1/wiki/log/tail?${params.toString()}`);
        },
        async generateAgentInstructions(opts) {
            const params = new URLSearchParams();
            if (opts.workspaceId)
                params.set("workspaceId", opts.workspaceId);
            if (opts.client)
                params.set("client", opts.client);
            if (opts.baseUrl)
                params.set("baseUrl", opts.baseUrl);
            const qs = params.toString();
            return request("GET", `/api/v1/agent-instructions${qs ? `?${qs}` : ""}`);
        },
    };
}
