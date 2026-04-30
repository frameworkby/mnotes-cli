export interface NoteListItem {
  id: string;
  title: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string | null;
  folderId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SearchResult {
  id: string;
  title: string;
  snippet?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
}

export interface FolderListItem {
  id: string;
  name: string;
  parentId: string | null;
  isRoot: boolean;
  noteCount: number;
}

export interface FolderRecord {
  id: string;
  name: string;
  parentId: string | null;
  isRoot: boolean;
  userId: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecentNoteItem {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
  tags: string[];
  folder: { id: string; name: string } | null;
}

export interface TaggedNoteItem {
  id: string;
  title: string;
  tags: string[];
  folder: { id: string; name: string | null } | null;
  updatedAt: string;
}

export interface UploadResult {
  embed: string;
  fileUrl: string;
  key: string;
  warning?: string;
}

// ── Knowledge tool shapes (for typing only; parity is enforced via Zod). ──

export interface RecallEntry {
  id: string;
  title: string;
  key: string | null;
  excerpt: string;
  importance: number | null;
  tags: string[];
  semanticScore: number;
  freshnessScore: number;
  finalScore: number;
}

export interface KnowledgeStoreResult {
  created: boolean;
  id: string;
  key: string | null;
}

export interface MemoryUpsertResult {
  status: "created" | "updated";
  id: string;
  key: string | null;
  previousContent: string | null;
}

export interface KnowledgeIngestEntry {
  key: string;
  content: string;
  source?: string;
  confidence?: number;
  tags?: string[];
}

export interface KnowledgeIngestRow {
  key: string;
  status: "created" | "updated";
  noteId: string;
}

export interface DecayEntry {
  key: string | null;
  title: string;
  importance: number | null;
  updatedAt: string;
  decayScore: number;
  daysSinceUpdate: number;
}

export interface ArchiveStaleEntry {
  noteId: string;
  title: string;
  decayScore: number;
  importance: number | null;
}

export interface ArchiveStaleResult {
  archivedCount: number;
  entries: ArchiveStaleEntry[];
}

export interface ConsolidateResult {
  consolidatedNoteId: string;
  archivedNoteIds: string[];
  strategy: "merge" | "summarize";
}

export interface SnapshotEntry {
  key: string | null;
  title: string;
  content: string;
  source: string | null;
  confidence: number | null;
  importance: number | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  decayScore: number;
}

export interface SnapshotJson {
  entries: SnapshotEntry[];
  metadata: {
    workspaceId: string;
    exportedAt: string;
    entryCount: number;
    totalTokens: number;
    truncated: boolean;
    totalAvailable?: number;
  };
}

export interface AskResult {
  answer: string;
  confidence: number;
  sources: Array<{
    noteId: string;
    title: string;
    excerpt: string;
    relevanceScore: number;
    chunkIndex?: number;
    totalChunks?: number;
  }>;
}

export interface KnowledgeLinkResult {
  edgeId: string;
  relationType: string;
  source: { noteId: string; title: string };
  target: { noteId: string; title: string };
  created: boolean;
}

export interface ScanConflictsResult {
  scanId: string;
  estimatedPairs: number;
  status: "scanning";
}

export interface ConflictRow {
  id: string;
  noteA: { id: string; title: string | null; key: string | null };
  noteB: { id: string; title: string | null; key: string | null };
  similarity: number;
  classification: string;
  confidence: number;
  description: string | null;
  scannedAt: string;
  stale: boolean;
}

export interface KbStats {
  totalNotes: number;
  totalTags: number;
  orphanCount: number;
  staleCount: number;
  conflictCount: number;
  embeddingCoverage: number;
}

export function createClient(baseUrl: string, apiKey: string) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  async function request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
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

    return res.json() as Promise<T>;
  }

  return {
    async listNotes(opts?: {
      workspaceId?: string;
      folderId?: string;
      cursor?: string;
      limit?: number;
    }): Promise<PaginatedResponse<NoteListItem>> {
      const params = new URLSearchParams();
      if (opts?.workspaceId) params.set("workspaceId", opts.workspaceId);
      if (opts?.folderId) params.set("folderId", opts.folderId);
      if (opts?.cursor) params.set("cursor", opts.cursor);
      if (opts?.limit) params.set("limit", String(opts.limit));
      const qs = params.toString();
      return request<PaginatedResponse<NoteListItem>>(
        "GET",
        `/api/v1/notes${qs ? `?${qs}` : ""}`
      );
    },

    async getNote(id: string): Promise<{ data: Note }> {
      return request<{ data: Note }>("GET", `/api/v1/notes/${encodeURIComponent(id)}`);
    },

    async searchNotes(opts: {
      query: string;
      mode?: "fulltext" | "semantic";
      workspaceId?: string;
    }): Promise<{ data: { results: SearchResult[] } }> {
      return request<{ data: { results: SearchResult[] } }>("POST", "/api/v1/notes/search", opts);
    },

    async createNote(opts: {
      title: string;
      content?: string;
      folderId?: string;
      workspaceId?: string;
    }): Promise<{ data: { id: string; title: string } }> {
      return request<{ data: { id: string; title: string } }>(
        "POST",
        "/api/v1/notes",
        opts
      );
    },

    async updateNote(
      id: string,
      opts: { title?: string; content?: string }
    ): Promise<{ data: { id: string; title: string } }> {
      return request<{ data: { id: string; title: string } }>(
        "PUT",
        `/api/v1/notes/${encodeURIComponent(id)}`,
        opts
      );
    },

    async deleteNote(id: string): Promise<{ data: { id: string } }> {
      return request<{ data: { id: string } }>(
        "DELETE",
        `/api/v1/notes/${encodeURIComponent(id)}`
      );
    },

    async listWorkspaces(): Promise<{
      data: Array<{
        id: string;
        name: string;
        slug: string;
        isDefault: boolean;
      }>;
    }> {
      return request<{
        data: Array<{
          id: string;
          name: string;
          slug: string;
          isDefault: boolean;
        }>;
      }>("GET", "/api/v1/workspaces");
    },

    async recallKnowledge(opts: {
      query: string;
      workspaceId?: string;
      tags?: string[];
      limit?: number;
    }): Promise<{
      data: {
        results: Array<{
          id: string;
          title: string;
          key: string | null;
          excerpt: string;
          importance: number | null;
          tags: string[];
          semanticScore: number;
          freshnessScore: number;
          finalScore: number;
        }>;
      };
    }> {
      return request("POST", "/api/v1/knowledge/recall", {
        query: opts.query,
        workspaceId: opts.workspaceId,
        tags: opts.tags,
        limit: opts.limit,
      });
    },

    async queryGraph(opts?: {
      workspaceId?: string;
      query?: string;
      nodeType?: string;
      neighbors?: string;
      depth?: number;
      limit?: number;
    }): Promise<{
      data: {
        nodes: Array<{
          id: string;
          noteId: string | null;
          label: string;
          nodeType: string;
          depth?: number;
        }>;
        edges: Array<{
          id: string;
          sourceId: string;
          targetId: string;
          edgeType: string;
          weight: number;
        }>;
      };
    }> {
      const params = new URLSearchParams();
      if (opts?.workspaceId) params.set("workspaceId", opts.workspaceId);
      if (opts?.query) params.set("query", opts.query);
      if (opts?.nodeType) params.set("nodeType", opts.nodeType);
      if (opts?.neighbors) params.set("neighbors", opts.neighbors);
      if (opts?.depth) params.set("depth", String(opts.depth));
      if (opts?.limit) params.set("limit", String(opts.limit));
      const qs = params.toString();
      return request("GET", `/api/v1/graph${qs ? `?${qs}` : ""}`);
    },

    // ── Folders ────────────────────────────────────────────────────────

    async listFolders(opts: {
      workspaceId: string;
      cursor?: string;
      limit?: number;
    }): Promise<{ folders: FolderListItem[]; nextCursor: string | null }> {
      const params = new URLSearchParams();
      params.set("workspaceId", opts.workspaceId);
      if (opts.cursor) params.set("cursor", opts.cursor);
      if (opts.limit) params.set("limit", String(opts.limit));
      return request<{ folders: FolderListItem[]; nextCursor: string | null }>(
        "GET",
        `/api/v1/folders?${params.toString()}`,
      );
    },

    async getWorkspaceSummary(workspaceId: string): Promise<unknown> {
      const params = new URLSearchParams({ workspaceId });
      return request<unknown>("GET", `/api/v1/folders/summary?${params.toString()}`);
    },

    async createFolder(opts: {
      name: string;
      parentId?: string;
      workspaceId: string;
    }): Promise<FolderRecord> {
      return request<FolderRecord>("POST", "/api/v1/folders", opts);
    },

    async renameFolder(id: string, name: string): Promise<FolderRecord> {
      return request<FolderRecord>(
        "PATCH",
        `/api/v1/folders/${encodeURIComponent(id)}`,
        { name },
      );
    },

    async deleteFolder(id: string): Promise<{ deleted: string }> {
      return request<{ deleted: string }>(
        "DELETE",
        `/api/v1/folders/${encodeURIComponent(id)}`,
      );
    },

    async moveFolder(id: string, parentId: string | null): Promise<FolderRecord> {
      return request<FolderRecord>(
        "POST",
        `/api/v1/folders/${encodeURIComponent(id)}/move`,
        { parentId },
      );
    },

    async getRecentNotes(opts: {
      since: string;
      workspaceId: string;
      limit?: number;
    }): Promise<RecentNoteItem[]> {
      const params = new URLSearchParams();
      params.set("since", opts.since);
      params.set("workspaceId", opts.workspaceId);
      if (opts.limit) params.set("limit", String(opts.limit));
      return request<RecentNoteItem[]>(
        "GET",
        `/api/v1/notes/recent?${params.toString()}`,
      );
    },

    async searchByTags(opts: {
      tags: string[];
      workspaceId: string;
      match?: "any" | "all";
      limit?: number;
    }): Promise<TaggedNoteItem[]> {
      const params = new URLSearchParams();
      // Send repeated `tags` params for clarity; the API accepts both repeated
      // and CSV forms. Repeated is unambiguous when tag values themselves
      // contain commas.
      for (const t of opts.tags) params.append("tags", t);
      params.set("workspaceId", opts.workspaceId);
      if (opts.match) params.set("match", opts.match);
      if (opts.limit) params.set("limit", String(opts.limit));
      return request<TaggedNoteItem[]>(
        "GET",
        `/api/v1/notes/search-by-tags?${params.toString()}`,
      );
    },

    // ── Knowledge ──────────────────────────────────────────────────────

    async knowledgeStore(opts: {
      key: string;
      content: string;
      workspaceId: string;
      source?: string;
      confidence?: number;
      tags?: string[];
    }): Promise<KnowledgeStoreResult> {
      return request<KnowledgeStoreResult>("POST", "/api/v1/knowledge/store", opts);
    },

    async memoryUpsert(opts: {
      key: string;
      content: string;
      workspaceId: string;
      source?: string;
      confidence?: number;
      tags?: string[];
    }): Promise<MemoryUpsertResult> {
      return request<MemoryUpsertResult>("POST", "/api/v1/knowledge/memory", opts);
    },

    async knowledgeIngest(opts: {
      entries: KnowledgeIngestEntry[];
      workspaceId: string;
    }): Promise<KnowledgeIngestRow[]> {
      return request<KnowledgeIngestRow[]>("POST", "/api/v1/knowledge/ingest", opts);
    },

    async knowledgeDecay(opts: {
      workspaceId: string;
      threshold?: number;
      limit?: number;
      decayWindow?: number;
      tags?: string[];
      maxImportance?: number;
    }): Promise<DecayEntry[]> {
      return request<DecayEntry[]>("POST", "/api/v1/knowledge/decay", opts);
    },

    async archiveStaleMemories(opts: {
      workspaceId: string;
      maxDecayScore?: number;
      maxImportance?: number;
      dryRun?: boolean;
    }): Promise<ArchiveStaleResult> {
      return request<ArchiveStaleResult>(
        "POST",
        "/api/v1/knowledge/archive-stale",
        opts,
      );
    },

    async consolidateMemories(opts: {
      noteIds: string[];
      targetTitle: string;
      strategy: "merge" | "summarize";
      workspaceId: string;
    }): Promise<ConsolidateResult> {
      return request<ConsolidateResult>(
        "POST",
        "/api/v1/knowledge/consolidate",
        opts,
      );
    },

    /**
     * `format=markdown` returns `text/markdown`, not JSON. We surface the raw
     * text so the CLI can either print it (human mode) or wrap it in a JSON
     * envelope with `{ markdown }` if a future tool wants structured output.
     * `format=json` (default) returns the structured envelope.
     */
    async knowledgeSnapshot(opts: {
      workspaceId: string;
      tags?: string[];
      format?: "json" | "markdown";
    }): Promise<SnapshotJson | { markdown: string }> {
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
      return (await res.json()) as SnapshotJson;
    },

    async askNotes(opts: {
      question: string;
      workspaceId: string;
      limit?: number;
    }): Promise<AskResult> {
      return request<AskResult>("POST", "/api/v1/knowledge/ask", opts);
    },

    async knowledgeLink(opts: {
      relationType:
        | "supports"
        | "contradicts"
        | "extends"
        | "replaces"
        | "depends_on"
        | "related";
      workspaceId: string;
      sourceKey?: string;
      sourceNoteId?: string;
      targetKey?: string;
      targetNoteId?: string;
      description?: string;
      confidence?: number;
    }): Promise<KnowledgeLinkResult> {
      return request<KnowledgeLinkResult>("POST", "/api/v1/knowledge/link", opts);
    },

    async scanKnowledgeConflicts(opts: {
      workspaceId: string;
      similarityThreshold?: number;
      pairCap?: number;
      tags?: string[];
    }): Promise<ScanConflictsResult> {
      return request<ScanConflictsResult>(
        "POST",
        "/api/v1/knowledge/scan-conflicts",
        opts,
      );
    },

    async getKnowledgeConflicts(opts: {
      workspaceId: string;
      classification?: "contradicting" | "complementary" | "unrelated" | "all";
    }): Promise<ConflictRow[]> {
      const params = new URLSearchParams({ workspaceId: opts.workspaceId });
      if (opts.classification) params.set("classification", opts.classification);
      return request<ConflictRow[]>(
        "GET",
        `/api/v1/knowledge/conflicts?${params.toString()}`,
      );
    },

    async getKbStats(workspaceId: string): Promise<KbStats> {
      const params = new URLSearchParams({ workspaceId });
      return request<KbStats>(
        "GET",
        `/api/v1/knowledge/stats?${params.toString()}`,
      );
    },

    async uploadFile(opts: {
      filename: string;
      content: string;
      mimeType: string;
      noteId?: string;
    }): Promise<UploadResult> {
      return request<UploadResult>("POST", "/api/v1/files", opts);
    },

    async createWorkspace(name: string): Promise<{
      data: {
        id: string;
        name: string;
        slug: string;
        isDefault: boolean;
      };
    }> {
      return request<{
        data: {
          id: string;
          name: string;
          slug: string;
          isDefault: boolean;
        };
      }>("POST", "/api/v1/workspaces", { name });
    },
  };
}
