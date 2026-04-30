import type { ActionDescriptor } from "../_register-group";
import type { AskResult } from "../../client";
interface AskInput {
    workspaceId?: string;
    question: string;
    limit?: number;
}
export declare const askAction: ActionDescriptor<AskInput, AskResult>;
export {};
