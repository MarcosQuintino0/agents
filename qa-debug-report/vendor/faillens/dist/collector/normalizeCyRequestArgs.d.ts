export type OriginalArgsShape = "url" | "method-url" | "method-url-body" | "options";
export interface NormalizedCyRequest {
    method: string;
    url: string;
    originalUrl: string;
    headers: Record<string, unknown>;
    body: unknown;
    failOnStatusCode?: boolean;
    originalArgsShape: OriginalArgsShape;
}
export declare function normalizeCyRequestArgs(args: unknown[], baseUrl?: string): NormalizedCyRequest;
//# sourceMappingURL=normalizeCyRequestArgs.d.ts.map