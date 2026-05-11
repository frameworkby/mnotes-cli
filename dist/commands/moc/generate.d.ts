import type { ActionDescriptor } from "../_register-group";
import type { MocResult } from "../../client";
interface GenerateMocInput {
    scopeType: "folder" | "tag";
    scopeId: string;
    limit?: number;
}
export declare const generateMocAction: ActionDescriptor<GenerateMocInput, MocResult>;
export {};
