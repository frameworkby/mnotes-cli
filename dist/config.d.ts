export interface Config {
    apiKey: string;
    baseUrl: string;
    workspaceId?: string;
}
export declare function resolveConfig(opts: {
    apiKey?: string;
    url?: string;
}): Config;
