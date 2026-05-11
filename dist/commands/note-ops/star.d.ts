import type { ActionDescriptor } from "../_register-group";
interface Input {
    id: string;
    starred?: boolean;
    unstar?: boolean;
}
export declare const starAction: ActionDescriptor<Input, unknown>;
export {};
