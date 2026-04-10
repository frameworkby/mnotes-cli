export interface Config {
    apiKey: string;
    baseUrl: string;
}
export declare function resolveConfig(opts: {
    apiKey?: string;
    url?: string;
}): Config;
