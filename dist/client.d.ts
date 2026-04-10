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
    createWorkspace(name: string): Promise<{
        data: {
            id: string;
            name: string;
            slug: string;
            isDefault: boolean;
        };
    }>;
};
