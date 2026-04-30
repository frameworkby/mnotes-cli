import type { ActionDescriptor } from "../_register-group";
import type { SearchResult } from "../../client";
interface SearchInput {
    query: string;
    workspace?: string;
    limit?: number;
    semantic?: boolean;
}
interface SearchOutput {
    results: SearchResult[];
}
export declare const searchNotesAction: ActionDescriptor<SearchInput, SearchOutput>;
export {};
