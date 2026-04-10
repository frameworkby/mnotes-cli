"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClient = createClient;
function createClient(baseUrl, apiKey) {
    const headers = {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
    };
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
        async createWorkspace(name) {
            return request("POST", "/api/v1/workspaces", { name });
        },
    };
}
