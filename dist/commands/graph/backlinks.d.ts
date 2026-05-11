import type { ActionDescriptor } from "../_register-group";
import type { BacklinkNote } from "../../client";
interface BacklinksInput {
    id: string;
}
export declare const backlinksAction: ActionDescriptor<BacklinksInput, BacklinkNote[]>;
export {};
