export declare function printJson(data: unknown): void;
export declare function printNoteList(notes: Array<{
    id: string;
    title: string;
    updatedAt: string;
}>): void;
export declare function printNote(note: {
    id: string;
    title: string;
    content: string | null;
}): void;
export declare function printSearchResults(results: Array<{
    id: string;
    title: string;
    snippet?: string;
}>): void;
export declare function printKnowledgeResults(results: Array<{
    id: string;
    title: string;
    key: string | null;
    excerpt: string;
    importance: number | null;
    tags: string[];
    semanticScore: number;
    freshnessScore: number;
    finalScore: number;
}>): void;
export declare function printGraph(nodes: Array<{
    id: string;
    noteId: string | null;
    label: string;
    nodeType: string;
    depth?: number;
}>, edges: Array<{
    id: string;
    sourceId: string;
    targetId: string;
    edgeType: string;
    weight: number;
}>): void;
export declare function printSuccess(msg: string): void;
