import type { ActionDescriptor } from "../_register-group";
import type { BacklinkNote } from "../../client";
interface BacklinksInput {
    id: string;
    workspaceId?: string;
}
export declare const backlinksAction: ActionDescriptor<BacklinksInput, BacklinkNote[]>;
export {};
