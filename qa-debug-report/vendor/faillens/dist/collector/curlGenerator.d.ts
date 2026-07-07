import { type MaskConfig } from "./sensitiveMask";
export interface CurlInput {
    method: string;
    url: string;
    headers?: Record<string, unknown>;
    body?: unknown;
}
export declare function generateCurl(input: CurlInput, maskConfig?: MaskConfig): string;
//# sourceMappingURL=curlGenerator.d.ts.map