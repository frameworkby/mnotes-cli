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
    folder: {
        id: string;
        name: string;
    } | null;
}
export interface TaggedNoteItem {
    id: string;
    title: string;
    tags: string[];
    folder: {
        id: string;
        name: string | null;
    } | null;
    updatedAt: string;
}
export interface UploadResult {
    embed: string;
    fileUrl: string;
    key: string;
    warning?: string;
}
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
    source: {
        noteId: string;
        title: string;
    };
    target: {
        noteId: string;
        title: string;
    };
    created: boolean;
}
export interface ScanConflictsResult {
    scanId: string;
    estimatedPairs: number;
    status: "scanning";
}
export interface ConflictRow {
    id: string;
    noteA: {
        id: string;
        title: string | null;
        key: string | null;
    };
    noteB: {
        id: string;
        title: string | null;
        key: string | null;
    };
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
    startNote: {
        id: string;
        title: string;
    };
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
    outgoing: Array<{
        id: string;
        title: string;
    }>;
    backlinks: Array<{
        id: string;
        title: string;
    }>;
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
    decisions?: Array<{
        decision: string;
        rationale: string;
    }>;
    actions?: Array<{
        action: string;
        target: string;
    }>;
    toolCallSummary?: Record<string, number>;
    affectedNotes?: Array<{
        title: string | null;
        key: string | null;
        excerpt: string;
    }>;
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
    splits: Array<{
        title: string;
        content: string;
    }>;
    [k: string]: unknown;
}
export interface SynthesizeNotesResult {
    id: string;
    title: string;
    content: string;
    sourceNoteIds: string[];
}
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
export declare function createClient(baseUrl: string, apiKey: string): {
    listNotes(opts?: {
        workspaceId?: string;
        folderId?: string;
        cursor?: string;
        limit?: number;
    }): Promise<PaginatedResponse<NoteListItem>>;
    getNote(id: string): Promise<{
        data: Note;
    }>;
    searchNotes(opts: {
        query: string;
        mode?: "fulltext" | "semantic";
        workspaceId?: string;
    }): Promise<{
        data: {
            results: SearchResult[];
        };
    }>;
    createNote(opts: {
        title: string;
        content?: string;
        folderId?: string;
        tags?: string[];
        workspaceId?: string;
    }): Promise<{
        data: {
            id: string;
            title: string;
        };
    }>;
    updateNote(id: string, opts: {
        title?: string;
        content?: string;
        folderId?: string | null;
        tags?: string[];
    }): Promise<{
        data: {
            id: string;
            title: string;
        };
    }>;
    deleteNote(id: string): Promise<{
        data: {
            id: string;
        };
    }>;
    listWorkspaces(): Promise<{
        data: Array<{
            id: string;
            name: string;
            slug: string;
            isDefault: boolean;
        }>;
    }>;
    recallKnowledge(opts: {
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
    }>;
    queryGraph(opts?: {
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
    }>;
    listFolders(opts: {
        workspaceId: string;
        cursor?: string;
        limit?: number;
    }): Promise<{
        folders: FolderListItem[];
        nextCursor: string | null;
    }>;
    getWorkspaceSummary(workspaceId: string): Promise<unknown>;
    createFolder(opts: {
        name: string;
        parentId?: string;
        workspaceId: string;
    }): Promise<FolderRecord>;
    renameFolder(id: string, name: string): Promise<FolderRecord>;
    deleteFolder(id: string): Promise<{
        deleted: string;
    }>;
    moveFolder(id: string, parentId: string | null): Promise<FolderRecord>;
    getRecentNotes(opts: {
        since: string;
        workspaceId: string;
        limit?: number;
    }): Promise<RecentNoteItem[]>;
    searchByTags(opts: {
        tags: string[];
        workspaceId: string;
        match?: "any" | "all";
        limit?: number;
    }): Promise<TaggedNoteItem[]>;
    knowledgeStore(opts: {
        key: string;
        content: string;
        workspaceId: string;
        source?: string;
        confidence?: number;
        tags?: string[];
    }): Promise<KnowledgeStoreResult>;
    memoryUpsert(opts: {
        key: string;
        content: string;
        workspaceId: string;
        source?: string;
        confidence?: number;
        tags?: string[];
    }): Promise<MemoryUpsertResult>;
    knowledgeIngest(opts: {
        entries: KnowledgeIngestEntry[];
        workspaceId: string;
    }): Promise<KnowledgeIngestRow[]>;
    knowledgeDecay(opts: {
        workspaceId: string;
        threshold?: number;
        limit?: number;
        decayWindow?: number;
        tags?: string[];
        maxImportance?: number;
    }): Promise<DecayEntry[]>;
    archiveStaleMemories(opts: {
        workspaceId: string;
        maxDecayScore?: number;
        maxImportance?: number;
        dryRun?: boolean;
    }): Promise<ArchiveStaleResult>;
    consolidateMemories(opts: {
        noteIds: string[];
        targetTitle: string;
        strategy: "merge" | "summarize";
        workspaceId: string;
    }): Promise<ConsolidateResult>;
    /**
     * `format=markdown` returns `text/markdown`, not JSON. We surface the raw
     * text so the CLI can either print it (human mode) or wrap it in a JSON
     * envelope with `{ markdown }` if a future tool wants structured output.
     * `format=json` (default) returns the structured envelope.
     */
    knowledgeSnapshot(opts: {
        workspaceId: string;
        tags?: string[];
        format?: "json" | "markdown";
    }): Promise<SnapshotJson | {
        markdown: string;
    }>;
    askNotes(opts: {
        question: string;
        workspaceId: string;
        limit?: number;
    }): Promise<AskResult>;
    knowledgeLink(opts: {
        relationType: "supports" | "contradicts" | "extends" | "replaces" | "depends_on" | "related";
        workspaceId: string;
        sourceKey?: string;
        sourceNoteId?: string;
        targetKey?: string;
        targetNoteId?: string;
        description?: string;
        confidence?: number;
    }): Promise<KnowledgeLinkResult>;
    scanKnowledgeConflicts(opts: {
        workspaceId: string;
        similarityThreshold?: number;
        pairCap?: number;
        tags?: string[];
    }): Promise<ScanConflictsResult>;
    getKnowledgeConflicts(opts: {
        workspaceId: string;
        classification?: "contradicting" | "complementary" | "unrelated" | "all";
    }): Promise<ConflictRow[]>;
    getKbStats(workspaceId: string): Promise<KbStats>;
    uploadFile(opts: {
        filename: string;
        content: string;
        mimeType: string;
        noteId?: string;
    }): Promise<UploadResult>;
    getGraph(opts: {
        workspaceId: string;
        query?: string;
        nodeType?: string;
        limit?: number;
    }): Promise<GraphResult>;
    getNeighbors(opts: {
        nodeId: string;
        depth?: number;
        workspaceId: string;
    }): Promise<GraphResult>;
    graphTraverse(opts: {
        startNodeId: string;
        maxDepth?: number;
        edgeTypes?: string[];
        nodeTypes?: string[];
        workspaceId: string;
    }): Promise<GraphTraverseResult>;
    findPath(opts: {
        fromNodeId: string;
        toNodeId: string;
        maxDepth?: number;
        workspaceId: string;
    }): Promise<FindPathResult>;
    queryGraphAdvanced(opts: {
        nodeType?: string;
        labelContains?: string;
        edgeType?: string;
        connectedTo?: string;
        depth?: number;
        limit?: number;
        workspaceId: string;
    }): Promise<GraphResult>;
    queryNoteGraph(opts: {
        noteId: string;
        depth?: number;
        workspaceId: string;
    }): Promise<QueryNoteGraphResult>;
    populateGraph(opts: {
        workspaceId: string;
    }): Promise<PopulateGraphResult>;
    relatedNotes(id: string, opts: {
        workspaceId: string;
        limit?: number;
        minSimilarity?: number;
    }): Promise<RelatedNote[]>;
    getBacklinks(id: string, workspaceId: string): Promise<BacklinkNote[]>;
    getNoteLinks(id: string, workspaceId: string): Promise<NoteLinksResult>;
    createGraphNode(opts: {
        label: string;
        nodeType?: "note" | "tag" | "concept";
        noteId?: string;
        metadata?: Record<string, unknown>;
        workspaceId: string;
    }): Promise<GraphNodeRecord>;
    deleteGraphNode(id: string, workspaceId: string): Promise<DeleteGraphEntityResult>;
    createGraphEdge(opts: {
        sourceId: string;
        targetId: string;
        edgeType?: "wikilink" | "related" | "parent" | "tagged" | "custom";
        weight?: number;
        metadata?: Record<string, unknown>;
        workspaceId: string;
    }): Promise<GraphEdgeRecord>;
    deleteGraphEdge(id: string, workspaceId: string): Promise<DeleteGraphEntityResult>;
    listSessions(opts: {
        workspaceId?: string;
        limit?: number;
        cursor?: string;
    }): Promise<SessionListResult>;
    sessionLog(opts: {
        sessionId: string;
        summary: string;
        decisions?: Array<{
            decision: string;
            rationale: string;
        }>;
        actions?: Array<{
            action: string;
            target: string;
        }>;
        tags?: string[];
        workspaceId: string;
    }): Promise<SessionLogResult>;
    getSessionReplay(id: string, workspaceId?: string): Promise<SessionReplay>;
    sessionContextResume(opts: {
        workspaceId: string;
        sessionId?: string;
        includeNotes?: boolean;
    }): Promise<SessionResumeResult>;
    getClusters(workspaceId: string): Promise<ClusterResult>;
    listTimeline(opts: {
        workspaceId: string;
        from?: string;
        to?: string;
        limit?: number;
    }): Promise<TimelineEntry[]>;
    generateMoc(opts: {
        workspaceId: string;
        scopeType: "folder" | "tag";
        scopeId: string;
        limit?: number;
    }): Promise<MocResult>;
    listSmartFolders(workspaceId: string): Promise<SmartFolder[]>;
    createSmartFolder(opts: {
        workspaceId: string;
        name: string;
        query: string;
        mode: "fulltext" | "semantic";
    }): Promise<SmartFolder>;
    deleteSmartFolder(id: string, workspaceId: string): Promise<SmartFolderDeleteResult>;
    listTasks(opts: {
        workspaceId: string;
        status?: "all" | "open" | "done";
        tag?: string;
        noteId?: string;
        limit?: number;
    }): Promise<TaskItem[]>;
    toggleTask(opts: {
        noteId: string;
        line: number;
        workspaceId: string;
        done?: boolean;
    }): Promise<TaskToggleResult>;
    createWorkspace(name: string, opts?: {
        description?: string | null;
    }): Promise<{
        data: {
            id: string;
            name: string;
            slug: string;
            isDefault: boolean;
        };
    }>;
    setActiveWorkspace(id: string): Promise<{
        data: {
            id: string;
            name: string;
            slug: string;
            isDefault: boolean;
        };
    }>;
    suggestTags(id: string, workspaceId: string): Promise<SuggestTagsResult>;
    suggestTagsLinks(id: string, workspaceId: string): Promise<SuggestionsResult>;
    setImportance(id: string, opts: {
        importance: number;
        workspaceId: string;
    }): Promise<SetImportanceResult>;
    setProvenance(id: string, opts: {
        source: "url" | "mcp_tool" | "conversation" | "manual";
        ref: string;
        workspaceId: string;
    }): Promise<SetProvenanceResult>;
    getProvenance(id: string, workspaceId: string): Promise<GetProvenanceResult>;
    splitNote(id: string, opts: {
        workspaceId: string;
        splitPoint?: number;
        title2?: string;
    }): Promise<SplitNoteResult>;
    synthesizeNotes(opts: {
        noteIds: string[];
        title?: string;
        workspaceId: string;
    }): Promise<SynthesizeNotesResult>;
    listRecipes(_workspaceId: string): Promise<ListRecipesResult>;
    runRecipe(id: string, opts: {
        workspaceId: string;
        noteId?: string;
    }): Promise<RunRecipeResult>;
    listObjectTypes(workspaceId: string): Promise<ListObjectTypesResult>;
    queryByType(type: string, opts: {
        workspaceId: string;
        limit?: number;
        propertyFilters?: string;
    }): Promise<QueryByTypeResult>;
    bulkArchive(opts: {
        noteIds: string[];
        workspaceId: string;
    }): Promise<BulkOpResult>;
    bulkMove(opts: {
        noteIds: string[];
        targetFolderId: string;
        workspaceId: string;
    }): Promise<BulkOpResult>;
    bulkTag(opts: {
        noteIds: string[];
        tags: string[];
        op: "add" | "remove";
        workspaceId: string;
    }): Promise<BulkOpResult>;
    bulkKnowledgeRecall(opts: {
        queries: string[];
        workspaceId: string;
        limit?: number;
    }): Promise<BulkKnowledgeRecallResult>;
    saveConversation(opts: {
        workspaceId: string;
        messages: Array<{
            role: "user" | "assistant";
            content: string;
        }>;
        title?: string;
        source?: string;
    }): Promise<{
        data: {
            id: string;
            title: string;
            createdAt: string;
        };
    }>;
    appendToNote(id: string, opts: {
        workspaceId: string;
        content: string;
    }): Promise<unknown>;
    archiveNote(id: string, workspaceId: string): Promise<unknown>;
    pinNote(id: string, workspaceId: string): Promise<unknown>;
    unpinNote(id: string, workspaceId: string): Promise<unknown>;
    toggleStar(id: string, opts: {
        workspaceId: string;
        starred: boolean;
    }): Promise<unknown>;
    getNoteFrontmatter(id: string, workspaceId: string): Promise<unknown>;
    setNoteFrontmatter(id: string, opts: {
        workspaceId: string;
        fields: Record<string, unknown>;
    }): Promise<unknown>;
    setNoteType(id: string, opts: {
        workspaceId: string;
        type: string;
    }): Promise<unknown>;
    listVersions(id: string, opts: {
        workspaceId: string;
        limit?: number;
    }): Promise<unknown>;
    restoreVersion(id: string, opts: {
        workspaceId: string;
        versionId: string;
    }): Promise<unknown>;
    getNoteByTitle(opts: {
        workspaceId: string;
        title: string;
    }): Promise<unknown>;
    getNotesBatch(opts: {
        workspaceId: string;
        ids: string[];
    }): Promise<unknown>;
    listPinned(workspaceId: string): Promise<unknown>;
    listStarred(workspaceId: string): Promise<unknown>;
    staleNotes(opts: {
        workspaceId: string;
        daysSince?: number;
        limit?: number;
    }): Promise<unknown>;
    orphanNotes(opts: {
        workspaceId: string;
        limit?: number;
    }): Promise<unknown>;
    findDuplicates(opts: {
        workspaceId: string;
        noteId: string;
        threshold?: number;
        limit?: number;
    }): Promise<unknown>;
    dailyNote(opts: {
        workspaceId: string;
        date?: string;
    }): Promise<unknown>;
    dailyDigest(opts: {
        workspaceId: string;
        date?: string;
    }): Promise<unknown>;
    noteSummary(id: string, opts: {
        workspaceId: string;
        maxLength?: number;
    }): Promise<unknown>;
    listTags(workspaceId: string): Promise<unknown>;
    manageTags(opts: {
        op: "rename" | "merge" | "delete";
        workspaceId: string;
        fromTag: string;
        toTag?: string;
    }): Promise<unknown>;
    extractEntities(opts: {
        noteId: string;
        workspaceId: string;
    }): Promise<unknown>;
    getWorkspaceContext(workspaceId: string): Promise<unknown>;
    getWorkspaceRole(id: string): Promise<unknown>;
    updateWorkspace(id: string, opts: {
        name?: string;
        description?: string | null;
        icon?: string | null;
    }): Promise<unknown>;
    deleteWorkspace(id: string): Promise<unknown>;
    setupWorkspace(opts: {
        name: string;
        template?: string;
        description?: string;
        icon?: string;
    }): Promise<unknown>;
    listTeamMembers(id: string): Promise<unknown>;
    getVersion(): Promise<unknown>;
    contextFetch(opts: {
        workspaceId: string;
        query: string;
        limit?: number;
        tokenBudget?: number;
        types?: string[];
        tags?: string[];
    }): Promise<unknown>;
    projectContextLoad(opts: {
        workspaceId: string;
        query?: string;
        path?: string;
        [k: string]: unknown;
    }): Promise<unknown>;
    generateAgentInstructions(opts: {
        workspaceId?: string;
        client?: string;
        baseUrl?: string;
    }): Promise<unknown>;
};
