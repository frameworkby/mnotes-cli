import type { ActionDescriptor } from "../_register-group";
import type { ListObjectTypesResult } from "../../client";
interface Input {
    workspaceId?: string;
}
export declare const listObjectTypesAction: ActionDescriptor<Input, ListObjectTypesResult>;
export {};
