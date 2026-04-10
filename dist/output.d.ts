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
export declare function printSuccess(msg: string): void;
