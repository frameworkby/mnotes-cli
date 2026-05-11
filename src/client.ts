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

export interface IngestExternalResult {
  noteId: string;
  status: "created" | "updated";
  title: string;
}

export interface CheckIngestedSourceRow {
  sourceUrl: string;
  status: "exists" | "not_found";
  noteId?: string;
  lastUpdated?: string;
}

export interface CheckIngestedSourcesResult {
  data: CheckIngestedSourceRow[];
}

// ── Wiki index / log shapes ─────────────────────────────────────────────────

export interface WikiBootstrapResult {
  index: "created" | "exists";
  log: "created" | "exists";
}

export interface WikiIndexRefreshResult {
  added: number;
  removed: number;
  unchanged: number;
  total: number;
}

export interface WikiLogAppendResult {
  appended: string;
}

export interface WikiLogEntry {
  timestamp?: string;
  kind?: string;
  ref?: string;
  summary?: string;
  raw: string;
  parsed: boolean;
}

export interface WikiLogTailResult {
  entries: WikiLogEntry[];
}

// ── Wiki lint shapes ────────────────────────────────────────────────────────

export type WikiLintCheck =
  | "orphans"
  | "broken-wikilinks"
  | "contradictions"
  | "stale";

export interface WikiLintOrphan {
  id: string;
  title: string;
  updatedAt: string;
  archived: boolean;
}

export interface WikiLintBrokenWikilink {
  noteId: string;
  noteTitle: string;
  target: string;
}

export interface WikiLintContradiction {
  id: string;
  noteA: { id: string; title: string | null };
  noteB: { id: string; title: string | null };
  similarity: number;
  confidence: number;
  description: string | null;
  scannedAt: string;
}

export interface WikiLintStale {
  id: string;
  title: string;
  updatedAt: string;
  referencedBy: { id: string; title: string; updatedAt: string };
}

export interface WikiLintResult {
  orphans: WikiLintOrphan[];
  brokenWikilinks: WikiLintBrokenWikilink[];
  contradictions: WikiLintContradiction[];
  stale: WikiLintStale[];
  summary: {
    totals: {
      orphans: number;
      brokenWikilinks: number;
      contradictions: number;
      stale: number;
    };
  };
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
  /** Only present in key-mode responses */
  missing?: string[];
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

// ── Graph types ──────────────────────────────────────────────────────────

export interface GraphNode {
  id: string;
  noteId: string | null;
  label: string;
  nodeType: string;
  depth?: number;
}

export interface GraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  edgeType: string;
  weight: number;
}

export interface GraphResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphTraverseResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  nodeCount: number;
  edgeCount: number;
}

export interface FindPathResult {
  found: boolean;
  path: GraphNode[];
  edges: GraphEdge[];
}

export interface QueryNoteGraphNode {
  id: string;
  noteId: string | null;
  label: string;
  type: string;
  depth: number;
}

export interface QueryNoteGraphEdge {
  source: string;
  target: string;
  type: string;
}

export interface QueryNoteGraphResult {
  startNote: { id: string; title: string };
  nodes: QueryNoteGraphNode[];
  edges: QueryNoteGraphEdge[];
  nodeCount: number;
  edgeCount: number;
}

export interface PopulateGraphResult {
  nodes: number;
  edges: number;
}

export interface RelatedNote {
  noteId: string;
  title: string;
  similarityScore: number;
}

export interface BacklinkNote {
  id: string;
  title: string;
  excerpt?: string;
}

export interface NoteLinksResult {
  outgoing: Array<{ id: string; title: string }>;
  backlinks: Array<{ id: string; title: string }>;
}

export interface GraphNodeRecord {
  id: string;
  label: string;
  nodeType: string;
  noteId: string | null;
  metadata: Record<string, unknown> | null;
  userId: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}

export interface GraphEdgeRecord {
  id: string;
  sourceId: string;
  targetId: string;
  edgeType: string;
  weight: number;
  metadata: Record<string, unknown> | null;
  userId: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeleteGraphEntityResult {
  success: true;
  id: string;
}

// ── Session / cluster / timeline / MoC / smart-folder / task types ───────

export interface SessionSummary {
  id: string;
  sessionLabel: string | null;
  startedAt: string;
  endedAt: string | null;
  toolCallCount: number;
  noteIds: string[];
}

export interface SessionListResult {
  sessions: SessionSummary[];
  nextCursor: string | null;
}

export interface SessionLogResult {
  noteId: string;
  sessionId: string;
  created: boolean;
  timestamp: string;
  decisions: number;
  actions: number;
}

export interface SessionReplay {
  id: string;
  sessionLabel: string | null;
  startedAt: string;
  endedAt: string | null;
  noteIds: string[];
  toolCalls: unknown;
}

export interface SessionResumeResult {
  session?: {
    id: string;
    label: string | null;
    startedAt: string;
    endedAt: string | null;
  };
  decisions?: Array<{ decision: string; rationale: string }>;
  actions?: Array<{ action: string; target: string }>;
  toolCallSummary?: Record<string, number>;
  affectedNotes?: Array<{ title: string | null; key: string | null; excerpt: string }>;
  message?: string;
}

export interface ClusterPoint {
  noteId: string;
  title: string;
  x: number;
  y: number;
  clusterId: number;
}

export interface ClusterResult {
  k?: number;
  noteCount?: number;
  computedAt?: string;
  points?: ClusterPoint[];
  clusters?: null;
  message?: string;
}

export interface TimelineEntry {
  id: string;
  title: string;
  createdAt: string;
}

export interface MocResult {
  noteId: string | null;
  noteCount: number;
  created: boolean;
}

export interface SmartFolder {
  id: string;
  name: string;
  query: string;
  mode: "fulltext" | "semantic";
}

export interface SmartFolderDeleteResult {
  id: string;
  deleted: true;
}

export interface TaskItem {
  noteId: string;
  noteTitle: string;
  line: number;
  text: string;
  done: boolean;
}

export interface TaskToggleResult {
  noteId: string;
  line: number;
  done: boolean;
  text: string;
}


// ── Note extension types ────────────────────────────────────────────────

export interface SuggestTagsResult {
  tags: string[];
}

export interface SuggestionWikilink {
  noteId: string;
  title: string;
  score: number;
}

export interface SuggestionsResult {
  wikilinks: SuggestionWikilink[];
  tags: string[];
}

export interface SetImportanceResult {
  noteId: string;
  importance: number;
  title: string;
}

export interface ProvenanceEntry {
  source: string;
  ref: string;
  addedAt: string;
}

export interface SetProvenanceResult {
  success: true;
  entryCount: number;
  added: ProvenanceEntry;
}

export interface GetProvenanceResult {
  noteId: string;
  provenance: ProvenanceEntry[];
}

export interface SplitNoteResult {
  splits: Array<{ title: string; content: string }>;
  [k: string]: unknown;
}

export interface SynthesizeNotesResult {
  id: string;
  title: string;
  content: string;
  sourceNoteIds: string[];
}

// ── Recipe types ────────────────────────────────────────────────────────

export interface RecipeListItem {
  id: string;
  name: string;
  description: string | null;
}

export interface ListRecipesResult {
  recipes: RecipeListItem[];
  count: number;
}

export interface RunRecipeResult {
  recipeId: string;
  recipeName: string;
  noteId: string;
  noteTitle: string;
  result: string;
}

// ── Object type types ───────────────────────────────────────────────────

export interface ObjectTypeListItem {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  properties: unknown;
  noteCount: number;
}

export interface ListObjectTypesResult {
  objectTypes: ObjectTypeListItem[];
  count: number;
}

export interface ObjectTypeNoteRow {
  id: string;
  title: string;
  objectTypeId: string | null;
  properties: unknown;
  tags: string[];
  updatedAt: string;
}

export interface QueryByTypeResult {
  notes: ObjectTypeNoteRow[];
  count: number;
}

// ── Bulk types ──────────────────────────────────────────────────────────

export interface BulkOpResult {
  totalRequested: number;
  successCount: number;
  failedCount: number;
}

export interface BulkKnowledgeRecallEntry {
  id: string;
  title: string;
  key: string | null;
  excerpt: string;
  importance: number | null;
  tags: string[];
  updatedAt: string;
}

export interface BulkKnowledgeRecallGroup {
  pattern: string;
  entries: BulkKnowledgeRecallEntry[];
  count: number;
}

export interface BulkKnowledgeRecallResult {
  groups: BulkKnowledgeRecallGroup[];
  totalEntries: number;
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
      tags?: string[];
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
      opts: { title?: string; content?: string; folderId?: string | null; tags?: string[] }
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

    async checkIngestedSources(opts: {
      workspaceId: string;
      sourceUrls: string[];
    }): Promise<CheckIngestedSourcesResult> {
      return request<CheckIngestedSourcesResult>(
        "POST",
        "/api/v1/knowledge/check-ingested",
        opts,
      );
    },

    async wikiLint(opts: {
      workspaceId: string;
      checks?: WikiLintCheck[];
      limitPerCheck?: number;
    }): Promise<WikiLintResult> {
      return request<WikiLintResult>("POST", "/api/v1/notes/wiki-lint", opts);
    },

    async ingestExternal(opts: {
      workspaceId: string;
      title: string;
      content: string;
      sourceType:
        | "web_page"
        | "pdf"
        | "email"
        | "slack"
        | "meeting"
        | "other";
      sourceUrl?: string;
      sourceRef?: string;
      tags?: string[];
      folderId?: string;
    }): Promise<IngestExternalResult> {
      return request<IngestExternalResult>(
        "POST",
        "/api/v1/knowledge/ingest-external",
        opts,
      );
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

    async archiveStaleMemories(
      opts:
        | { workspaceId: string; keys: string[]; dryRun?: boolean }
        | { workspaceId: string; maxDecayScore?: number; maxImportance?: number; dryRun?: boolean },
    ): Promise<ArchiveStaleResult> {
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

    // ── Graph ────────────────────────────────────────────────────────────

    async getGraph(opts: {
      workspaceId: string;
      query?: string;
      nodeType?: string;
      limit?: number;
    }): Promise<GraphResult> {
      const params = new URLSearchParams({ workspaceId: opts.workspaceId });
      if (opts.query) params.set("query", opts.query);
      if (opts.nodeType) params.set("nodeType", opts.nodeType);
      if (opts.limit != null) params.set("limit", String(opts.limit));
      const res = await request<{ data: GraphResult }>(
        "GET",
        `/api/v1/graph?${params.toString()}`,
      );
      return res.data;
    },

    async getNeighbors(opts: {
      nodeId: string;
      depth?: number;
      workspaceId: string;
    }): Promise<GraphResult> {
      const params = new URLSearchParams({
        workspaceId: opts.workspaceId,
        neighbors: opts.nodeId,
      });
      if (opts.depth != null) params.set("depth", String(opts.depth));
      const res = await request<{ data: GraphResult }>(
        "GET",
        `/api/v1/graph?${params.toString()}`,
      );
      return res.data;
    },

    async graphTraverse(opts: {
      startNodeId: string;
      maxDepth?: number;
      edgeTypes?: string[];
      nodeTypes?: string[];
      workspaceId: string;
    }): Promise<GraphTraverseResult> {
      return request<GraphTraverseResult>("POST", "/api/v1/graph/traverse", opts);
    },

    async findPath(opts: {
      fromNodeId: string;
      toNodeId: string;
      maxDepth?: number;
      workspaceId: string;
    }): Promise<FindPathResult> {
      return request<FindPathResult>("POST", "/api/v1/graph/find-path", opts);
    },

    async queryGraphAdvanced(opts: {
      nodeType?: string;
      labelContains?: string;
      edgeType?: string;
      connectedTo?: string;
      depth?: number;
      limit?: number;
      workspaceId: string;
    }): Promise<GraphResult> {
      return request<GraphResult>("POST", "/api/v1/graph/query", opts);
    },

    async queryNoteGraph(opts: {
      noteId: string;
      depth?: number;
      workspaceId: string;
    }): Promise<QueryNoteGraphResult> {
      return request<QueryNoteGraphResult>("POST", "/api/v1/graph/query-note", opts);
    },

    async populateGraph(opts: {
      workspaceId: string;
    }): Promise<PopulateGraphResult> {
      return request<PopulateGraphResult>("POST", "/api/v1/graph/populate", opts);
    },

    async relatedNotes(
      id: string,
      opts: { workspaceId: string; limit?: number; minSimilarity?: number },
    ): Promise<RelatedNote[]> {
      const params = new URLSearchParams({ workspaceId: opts.workspaceId });
      if (opts.limit != null) params.set("limit", String(opts.limit));
      if (opts.minSimilarity != null) params.set("minSimilarity", String(opts.minSimilarity));
      return request<RelatedNote[]>(
        "GET",
        `/api/v1/graph/related/${encodeURIComponent(id)}?${params.toString()}`,
      );
    },

    async getBacklinks(id: string, workspaceId: string): Promise<BacklinkNote[]> {
      const params = new URLSearchParams({ workspaceId });
      return request<BacklinkNote[]>(
        "GET",
        `/api/v1/graph/backlinks/${encodeURIComponent(id)}?${params.toString()}`,
      );
    },

    async getNoteLinks(id: string, workspaceId: string): Promise<NoteLinksResult> {
      const params = new URLSearchParams({ workspaceId });
      return request<NoteLinksResult>(
        "GET",
        `/api/v1/graph/links/${encodeURIComponent(id)}?${params.toString()}`,
      );
    },

    async createGraphNode(opts: {
      label: string;
      nodeType?: "note" | "tag" | "concept";
      noteId?: string;
      metadata?: Record<string, unknown>;
      workspaceId: string;
    }): Promise<GraphNodeRecord> {
      return request<GraphNodeRecord>("POST", "/api/v1/graph/nodes", opts);
    },

    async deleteGraphNode(
      id: string,
      workspaceId: string,
    ): Promise<DeleteGraphEntityResult> {
      const params = new URLSearchParams({ workspaceId });
      return request<DeleteGraphEntityResult>(
        "DELETE",
        `/api/v1/graph/nodes/${encodeURIComponent(id)}?${params.toString()}`,
      );
    },

    async createGraphEdge(opts: {
      sourceId: string;
      targetId: string;
      edgeType?: "wikilink" | "related" | "parent" | "tagged" | "custom";
      weight?: number;
      metadata?: Record<string, unknown>;
      workspaceId: string;
    }): Promise<GraphEdgeRecord> {
      return request<GraphEdgeRecord>("POST", "/api/v1/graph/edges", opts);
    },

    async deleteGraphEdge(
      id: string,
      workspaceId: string,
    ): Promise<DeleteGraphEntityResult> {
      const params = new URLSearchParams({ workspaceId });
      return request<DeleteGraphEntityResult>(
        "DELETE",
        `/api/v1/graph/edges/${encodeURIComponent(id)}?${params.toString()}`,
      );
    },

    // ── Sessions ─────────────────────────────────────────────────────────

    async listSessions(opts: {
      workspaceId?: string;
      limit?: number;
      cursor?: string;
    }): Promise<SessionListResult> {
      const params = new URLSearchParams();
      if (opts.workspaceId) params.set("workspaceId", opts.workspaceId);
      if (opts.limit != null) params.set("limit", String(opts.limit));
      if (opts.cursor) params.set("cursor", opts.cursor);
      const qs = params.toString();
      return request<SessionListResult>(
        "GET",
        `/api/v1/sessions${qs ? `?${qs}` : ""}`,
      );
    },

    async sessionLog(opts: {
      sessionId: string;
      summary: string;
      decisions?: Array<{ decision: string; rationale: string }>;
      actions?: Array<{ action: string; target: string }>;
      tags?: string[];
      workspaceId: string;
    }): Promise<SessionLogResult> {
      return request<SessionLogResult>("POST", "/api/v1/sessions/log", opts);
    },

    async getSessionReplay(
      id: string,
      workspaceId?: string,
    ): Promise<SessionReplay> {
      const params = new URLSearchParams();
      if (workspaceId) params.set("workspaceId", workspaceId);
      const qs = params.toString();
      return request<SessionReplay>(
        "GET",
        `/api/v1/sessions/${encodeURIComponent(id)}/replay${qs ? `?${qs}` : ""}`,
      );
    },

    async sessionContextResume(opts: {
      workspaceId: string;
      sessionId?: string;
      includeNotes?: boolean;
    }): Promise<SessionResumeResult> {
      const body: Record<string, unknown> = { workspaceId: opts.workspaceId };
      if (opts.sessionId) body.sessionId = opts.sessionId;
      if (opts.includeNotes !== undefined) body.include_notes = opts.includeNotes;
      return request<SessionResumeResult>("POST", "/api/v1/sessions/resume", body);
    },

    // ── Clusters ─────────────────────────────────────────────────────────

    async getClusters(workspaceId: string): Promise<ClusterResult> {
      const params = new URLSearchParams({ workspaceId });
      const res = await request<{ data: ClusterResult }>(
        "GET",
        `/api/v1/clusters?${params.toString()}`,
      );
      return res.data;
    },

    // ── Timeline ─────────────────────────────────────────────────────────

    async listTimeline(opts: {
      workspaceId: string;
      from?: string;
      to?: string;
      limit?: number;
    }): Promise<TimelineEntry[]> {
      const params = new URLSearchParams({ workspaceId: opts.workspaceId });
      if (opts.from) params.set("from", opts.from);
      if (opts.to) params.set("to", opts.to);
      if (opts.limit != null) params.set("limit", String(opts.limit));
      const res = await request<{ data: TimelineEntry[] }>(
        "GET",
        `/api/v1/timeline?${params.toString()}`,
      );
      return res.data;
    },

    // ── MoC ──────────────────────────────────────────────────────────────

    async generateMoc(opts: {
      workspaceId: string;
      scopeType: "folder" | "tag";
      scopeId: string;
      limit?: number;
    }): Promise<MocResult> {
      const res = await request<{ data: MocResult }>(
        "POST",
        "/api/v1/mocs",
        opts,
      );
      return res.data;
    },

    // ── Smart folders ────────────────────────────────────────────────────

    async listSmartFolders(workspaceId: string): Promise<SmartFolder[]> {
      const params = new URLSearchParams({ workspaceId });
      const res = await request<{ data: SmartFolder[] }>(
        "GET",
        `/api/v1/smart-folders?${params.toString()}`,
      );
      return res.data;
    },

    async createSmartFolder(opts: {
      workspaceId: string;
      name: string;
      query: string;
      mode: "fulltext" | "semantic";
    }): Promise<SmartFolder> {
      const res = await request<{ data: SmartFolder }>(
        "POST",
        "/api/v1/smart-folders",
        opts,
      );
      return res.data;
    },

    async deleteSmartFolder(
      id: string,
      workspaceId: string,
    ): Promise<SmartFolderDeleteResult> {
      const params = new URLSearchParams({ workspaceId });
      const res = await request<{ data: SmartFolderDeleteResult }>(
        "DELETE",
        `/api/v1/smart-folders/${encodeURIComponent(id)}?${params.toString()}`,
      );
      return res.data;
    },

    // ── Tasks ────────────────────────────────────────────────────────────

    async listTasks(opts: {
      workspaceId: string;
      status?: "all" | "open" | "done";
      tag?: string;
      noteId?: string;
      limit?: number;
    }): Promise<TaskItem[]> {
      const params = new URLSearchParams({ workspaceId: opts.workspaceId });
      if (opts.status) params.set("status", opts.status);
      if (opts.tag) params.set("tag", opts.tag);
      if (opts.noteId) params.set("noteId", opts.noteId);
      if (opts.limit != null) params.set("limit", String(opts.limit));
      const res = await request<{ data: TaskItem[] }>(
        "GET",
        `/api/v1/tasks?${params.toString()}`,
      );
      return res.data;
    },

    async toggleTask(opts: {
      noteId: string;
      line: number;
      workspaceId: string;
      done?: boolean;
    }): Promise<TaskToggleResult> {
      const res = await request<{ data: TaskToggleResult }>(
        "POST",
        "/api/v1/tasks/toggle",
        opts,
      );
      return res.data;
    },

    async createWorkspace(
      name: string,
      opts?: { description?: string | null },
    ): Promise<{
      data: {
        id: string;
        name: string;
        slug: string;
        isDefault: boolean;
      };
    }> {
      const body: { name: string; description?: string | null } = { name };
      if (opts?.description !== undefined) body.description = opts.description;
      return request<{
        data: {
          id: string;
          name: string;
          slug: string;
          isDefault: boolean;
        };
      }>("POST", "/api/v1/workspaces", body);
    },

    async setActiveWorkspace(id: string): Promise<{
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
      }>("PATCH", `/api/v1/workspaces/${encodeURIComponent(id)}`, {
        isDefault: true,
      });
    },

    // ── Note extension, recipe, object-type, bulk (added by #751) ─────────

    async suggestTags(
      id: string,
      workspaceId: string,
    ): Promise<SuggestTagsResult> {
      const params = new URLSearchParams({ workspaceId });
      const res = await request<{ data: SuggestTagsResult }>(
        "GET",
        `/api/v1/notes/${encodeURIComponent(id)}/suggest-tags?${params.toString()}`,
      );
      return res.data;
    },

    async suggestTagsLinks(
      id: string,
      workspaceId: string,
    ): Promise<SuggestionsResult> {
      const params = new URLSearchParams({ workspaceId });
      const res = await request<{ data: SuggestionsResult }>(
        "GET",
        `/api/v1/notes/${encodeURIComponent(id)}/suggest-tags-links?${params.toString()}`,
      );
      return res.data;
    },

    async setImportance(
      id: string,
      opts: { importance: number; workspaceId: string },
    ): Promise<SetImportanceResult> {
      const res = await request<{ data: SetImportanceResult }>(
        "PUT",
        `/api/v1/notes/${encodeURIComponent(id)}/importance`,
        opts,
      );
      return res.data;
    },

    async setProvenance(
      id: string,
      opts: { source: "url" | "mcp_tool" | "conversation" | "manual"; ref: string; workspaceId: string },
    ): Promise<SetProvenanceResult> {
      const res = await request<{ data: SetProvenanceResult }>(
        "PUT",
        `/api/v1/notes/${encodeURIComponent(id)}/provenance`,
        opts,
      );
      return res.data;
    },

    async getProvenance(
      id: string,
      workspaceId: string,
    ): Promise<GetProvenanceResult> {
      const params = new URLSearchParams({ workspaceId });
      const res = await request<{ data: GetProvenanceResult }>(
        "GET",
        `/api/v1/notes/${encodeURIComponent(id)}/provenance?${params.toString()}`,
      );
      return res.data;
    },

    async splitNote(
      id: string,
      opts: { workspaceId: string; splitPoint?: number; title2?: string },
    ): Promise<SplitNoteResult> {
      const res = await request<{ data: SplitNoteResult }>(
        "POST",
        `/api/v1/notes/${encodeURIComponent(id)}/split`,
        opts,
      );
      return res.data;
    },

    async synthesizeNotes(opts: {
      noteIds: string[];
      title?: string;
      workspaceId: string;
    }): Promise<SynthesizeNotesResult> {
      const res = await request<{ data: SynthesizeNotesResult }>(
        "POST",
        "/api/v1/notes/synthesize",
        opts,
      );
      return res.data;
    },

    // ── Recipes ────────────────────────────────────────────────────────

    async listRecipes(_workspaceId: string): Promise<ListRecipesResult> {
      // workspaceId is accepted by the route but recipes are user-scoped; we
      // forward it for forward-compat with future workspace-scoped recipes.
      const params = new URLSearchParams({ workspaceId: _workspaceId });
      const res = await request<{ data: ListRecipesResult }>(
        "GET",
        `/api/v1/recipes?${params.toString()}`,
      );
      return res.data;
    },

    async runRecipe(
      id: string,
      opts: { workspaceId: string; noteId?: string },
    ): Promise<RunRecipeResult> {
      const res = await request<{ data: RunRecipeResult }>(
        "POST",
        `/api/v1/recipes/${encodeURIComponent(id)}/run`,
        opts,
      );
      return res.data;
    },

    // ── Object types ───────────────────────────────────────────────────

    async listObjectTypes(workspaceId: string): Promise<ListObjectTypesResult> {
      const params = new URLSearchParams({ workspaceId });
      const res = await request<{ data: ListObjectTypesResult }>(
        "GET",
        `/api/v1/object-types?${params.toString()}`,
      );
      return res.data;
    },

    async queryByType(
      type: string,
      opts: { workspaceId: string; limit?: number; propertyFilters?: string },
    ): Promise<QueryByTypeResult> {
      const params = new URLSearchParams({ workspaceId: opts.workspaceId });
      if (opts.limit != null) params.set("limit", String(opts.limit));
      if (opts.propertyFilters) params.set("propertyFilters", opts.propertyFilters);
      const res = await request<{ data: QueryByTypeResult }>(
        "GET",
        `/api/v1/object-types/${encodeURIComponent(type)}/query?${params.toString()}`,
      );
      return res.data;
    },

    // ── Bulk ───────────────────────────────────────────────────────────

    async bulkArchive(opts: {
      noteIds: string[];
      workspaceId: string;
    }): Promise<BulkOpResult> {
      const res = await request<{ data: BulkOpResult }>(
        "POST",
        "/api/v1/bulk/archive",
        opts,
      );
      return res.data;
    },

    async bulkMove(opts: {
      noteIds: string[];
      targetFolderId: string;
      workspaceId: string;
    }): Promise<BulkOpResult> {
      const res = await request<{ data: BulkOpResult }>(
        "POST",
        "/api/v1/bulk/move",
        opts,
      );
      return res.data;
    },

    async bulkTag(opts: {
      noteIds: string[];
      tags: string[];
      op: "add" | "remove";
      workspaceId: string;
    }): Promise<BulkOpResult> {
      const res = await request<{ data: BulkOpResult }>(
        "POST",
        "/api/v1/bulk/tag",
        opts,
      );
      return res.data;
    },

    async bulkKnowledgeRecall(opts: {
      queries: string[];
      workspaceId: string;
      limit?: number;
    }): Promise<BulkKnowledgeRecallResult> {
      const res = await request<{ data: BulkKnowledgeRecallResult }>(
        "POST",
        "/api/v1/bulk/knowledge-recall",
        opts,
      );
      return res.data;
    },

    // ── Save conversation (#752) ───────────────────────────────────────────

    async saveConversation(opts: {
      workspaceId: string;
      messages: Array<{ role: "user" | "assistant"; content: string }>;
      title?: string;
      source?: string;
    }): Promise<{ data: { id: string; title: string; createdAt: string } }> {
      return request<{ data: { id: string; title: string; createdAt: string } }>(
        "POST",
        "/api/v1/save-conversation",
        opts,
      );
    },

    // ── Note ops (#752) ────────────────────────────────────────────────────

    async appendToNote(
      id: string,
      opts: { workspaceId: string; content: string },
    ): Promise<unknown> {
      return request("POST", `/api/v1/notes/${encodeURIComponent(id)}/append`, opts);
    },

    async archiveNote(
      id: string,
      workspaceId: string,
    ): Promise<unknown> {
      return request("POST", `/api/v1/notes/${encodeURIComponent(id)}/archive`, {
        workspaceId,
      });
    },

    async pinNote(id: string, workspaceId: string): Promise<unknown> {
      return request("POST", `/api/v1/notes/${encodeURIComponent(id)}/pin`, {
        workspaceId,
      });
    },

    async unpinNote(id: string, workspaceId: string): Promise<unknown> {
      const params = new URLSearchParams({ workspaceId });
      return request(
        "DELETE",
        `/api/v1/notes/${encodeURIComponent(id)}/pin?${params.toString()}`,
      );
    },

    async toggleStar(
      id: string,
      opts: { workspaceId: string; starred: boolean },
    ): Promise<unknown> {
      return request("POST", `/api/v1/notes/${encodeURIComponent(id)}/star`, opts);
    },

    async getNoteFrontmatter(
      id: string,
      workspaceId: string,
    ): Promise<unknown> {
      const params = new URLSearchParams({ workspaceId });
      return request(
        "GET",
        `/api/v1/notes/${encodeURIComponent(id)}/frontmatter?${params.toString()}`,
      );
    },

    async setNoteFrontmatter(
      id: string,
      opts: { workspaceId: string; fields: Record<string, unknown> },
    ): Promise<unknown> {
      return request(
        "PUT",
        `/api/v1/notes/${encodeURIComponent(id)}/frontmatter`,
        opts,
      );
    },

    async setNoteType(
      id: string,
      opts: { workspaceId: string; type: string },
    ): Promise<unknown> {
      return request(
        "PUT",
        `/api/v1/notes/${encodeURIComponent(id)}/type`,
        { workspaceId: opts.workspaceId, type: opts.type },
      );
    },

    async listVersions(
      id: string,
      opts: { workspaceId: string; limit?: number },
    ): Promise<unknown> {
      const params = new URLSearchParams({ workspaceId: opts.workspaceId });
      if (opts.limit != null) params.set("limit", String(opts.limit));
      return request(
        "GET",
        `/api/v1/notes/${encodeURIComponent(id)}/versions?${params.toString()}`,
      );
    },

    async restoreVersion(
      id: string,
      opts: { workspaceId: string; versionId: string },
    ): Promise<unknown> {
      return request(
        "POST",
        `/api/v1/notes/${encodeURIComponent(id)}/restore-version`,
        opts,
      );
    },

    async getNoteByTitle(opts: {
      workspaceId: string;
      title: string;
    }): Promise<unknown> {
      const params = new URLSearchParams({
        workspaceId: opts.workspaceId,
        title: opts.title,
      });
      return request("GET", `/api/v1/notes/by-title?${params.toString()}`);
    },

    async getNotesBatch(opts: {
      workspaceId: string;
      ids: string[];
    }): Promise<unknown> {
      return request("POST", "/api/v1/notes/batch", opts);
    },

    async listPinned(workspaceId: string): Promise<unknown> {
      const params = new URLSearchParams({ workspaceId });
      return request("GET", `/api/v1/notes/pinned?${params.toString()}`);
    },

    async listStarred(workspaceId: string): Promise<unknown> {
      const params = new URLSearchParams({ workspaceId });
      return request("GET", `/api/v1/notes/starred?${params.toString()}`);
    },

    async staleNotes(opts: {
      workspaceId: string;
      daysSince?: number;
      limit?: number;
    }): Promise<unknown> {
      const params = new URLSearchParams({ workspaceId: opts.workspaceId });
      if (opts.daysSince != null) params.set("daysSince", String(opts.daysSince));
      if (opts.limit != null) params.set("limit", String(opts.limit));
      return request("GET", `/api/v1/notes/stale?${params.toString()}`);
    },

    async orphanNotes(opts: {
      workspaceId: string;
      limit?: number;
    }): Promise<unknown> {
      const params = new URLSearchParams({ workspaceId: opts.workspaceId });
      if (opts.limit != null) params.set("limit", String(opts.limit));
      return request("GET", `/api/v1/notes/orphan?${params.toString()}`);
    },

    async findDuplicates(opts: {
      workspaceId: string;
      noteId: string;
      threshold?: number;
      limit?: number;
    }): Promise<unknown> {
      const params = new URLSearchParams({
        workspaceId: opts.workspaceId,
        noteId: opts.noteId,
      });
      if (opts.threshold != null) params.set("threshold", String(opts.threshold));
      if (opts.limit != null) params.set("limit", String(opts.limit));
      return request("GET", `/api/v1/notes/duplicates?${params.toString()}`);
    },

    async dailyNote(opts: {
      workspaceId: string;
      date?: string;
    }): Promise<unknown> {
      return request("POST", "/api/v1/notes/daily", opts);
    },

    async dailyDigest(opts: {
      workspaceId: string;
      date?: string;
    }): Promise<unknown> {
      const params = new URLSearchParams({ workspaceId: opts.workspaceId });
      if (opts.date) params.set("date", opts.date);
      return request("GET", `/api/v1/notes/daily-digest?${params.toString()}`);
    },

    async noteSummary(
      id: string,
      opts: { workspaceId: string; maxLength?: number },
    ): Promise<unknown> {
      const params = new URLSearchParams({ workspaceId: opts.workspaceId });
      if (opts.maxLength != null) params.set("maxLength", String(opts.maxLength));
      return request(
        "GET",
        `/api/v1/notes/${encodeURIComponent(id)}/summary?${params.toString()}`,
      );
    },

    // ── Tags (#752) ────────────────────────────────────────────────────────

    async listTags(workspaceId: string): Promise<unknown> {
      const params = new URLSearchParams({ workspaceId });
      return request("GET", `/api/v1/tags?${params.toString()}`);
    },

    async manageTags(opts: {
      op: "rename" | "merge" | "delete";
      workspaceId: string;
      fromTag: string;
      toTag?: string;
    }): Promise<unknown> {
      return request("POST", "/api/v1/tags/manage", opts);
    },

    async extractEntities(opts: {
      noteId: string;
      workspaceId: string;
    }): Promise<unknown> {
      return request("POST", "/api/v1/tags/extract-entities", opts);
    },

    // ── Workspace extended (#752) ──────────────────────────────────────────

    async getWorkspaceContext(workspaceId: string): Promise<unknown> {
      const params = new URLSearchParams({ workspaceId });
      return request("GET", `/api/v1/workspaces/context?${params.toString()}`);
    },

    async getWorkspaceRole(id: string): Promise<unknown> {
      return request(
        "GET",
        `/api/v1/workspaces/${encodeURIComponent(id)}/role`,
      );
    },

    /**
     * Stamps `firstAgentConnectAt` on the workspace (idempotent — server-side
     * null guard means only the first call has any effect).
     * Called by handleClaude / handleCursor after writing config to disk.
     */
    async markAgentConnected(id: string): Promise<void> {
      await request<{ ok: boolean }>(
        "POST",
        `/api/v1/workspaces/${encodeURIComponent(id)}/mark-agent-connected`,
      );
    },

    async updateWorkspace(
      id: string,
      opts: { name?: string; description?: string | null; icon?: string | null },
    ): Promise<unknown> {
      return request(
        "PATCH",
        `/api/v1/workspaces/${encodeURIComponent(id)}`,
        opts,
      );
    },

    async deleteWorkspace(id: string): Promise<unknown> {
      return request(
        "DELETE",
        `/api/v1/workspaces/${encodeURIComponent(id)}`,
      );
    },

    async setupWorkspace(opts: {
      name: string;
      template?: string;
      description?: string;
      icon?: string;
    }): Promise<unknown> {
      return request("POST", "/api/v1/workspaces/setup", opts);
    },

    async listTeamMembers(id: string): Promise<unknown> {
      return request(
        "GET",
        `/api/v1/workspaces/${encodeURIComponent(id)}/team-members`,
      );
    },

    // ── Info (#752) ────────────────────────────────────────────────────────

    async getVersion(): Promise<unknown> {
      return request("GET", "/api/v1/version");
    },

    async contextFetch(opts: {
      workspaceId: string;
      query: string;
      limit?: number;
      tokenBudget?: number;
      types?: string[];
      tags?: string[];
    }): Promise<unknown> {
      return request("POST", "/api/v1/composites/context-fetch", opts);
    },

    async projectContextLoad(opts: {
      workspaceId: string;
      query?: string;
      path?: string;
      [k: string]: unknown;
    }): Promise<unknown> {
      return request("POST", "/api/v1/composites/project-context-load", opts);
    },

    // ── Wiki index / log (#936) ────────────────────────────────────────────────

    async wikiBootstrap(workspaceId: string): Promise<WikiBootstrapResult> {
      return request<WikiBootstrapResult>("POST", "/api/v1/wiki/bootstrap", {
        workspaceId,
      });
    },

    async wikiIndexRefresh(workspaceId: string): Promise<WikiIndexRefreshResult> {
      return request<WikiIndexRefreshResult>("POST", "/api/v1/wiki/index/refresh", {
        workspaceId,
      });
    },

    async wikiLogAppend(opts: {
      workspaceId: string;
      kind: "ingest" | "query" | "lint" | "decision";
      ref: string;
      summary?: string;
    }): Promise<WikiLogAppendResult> {
      return request<WikiLogAppendResult>("POST", "/api/v1/wiki/log/append", opts);
    },

    async wikiLogTail(opts: {
      workspaceId: string;
      limit?: number;
    }): Promise<WikiLogTailResult> {
      const params = new URLSearchParams({ workspaceId: opts.workspaceId });
      if (opts.limit != null) params.set("limit", String(opts.limit));
      return request<WikiLogTailResult>(
        "GET",
        `/api/v1/wiki/log/tail?${params.toString()}`,
      );
    },

    async generateAgentInstructions(opts: {
      workspaceId?: string;
      client?: string;
      baseUrl?: string;
    }): Promise<unknown> {
      const params = new URLSearchParams();
      if (opts.workspaceId) params.set("workspaceId", opts.workspaceId);
      if (opts.client) params.set("client", opts.client);
      if (opts.baseUrl) params.set("baseUrl", opts.baseUrl);
      const qs = params.toString();
      return request(
        "GET",
        `/api/v1/agent-instructions${qs ? `?${qs}` : ""}`,
      );
    },

  };
}
