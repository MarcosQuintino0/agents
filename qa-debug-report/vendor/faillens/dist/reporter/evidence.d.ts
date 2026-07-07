import type { FailLensContract, FailLensEvidence, FailLensScreenshot, FailLensTest } from "../types/report";
export interface IssueHttpContent {
    startLine: string;
    headers: Record<string, unknown>;
    body: unknown;
    durationMs?: number;
}
export interface IssueComparisonRow {
    label: string;
    expected: string;
    received: string;
}
export interface IssueTraceRow {
    label: string;
    value: string;
}
export interface EvidenceContent {
    title: string;
    suggestedTitle: string;
    specPath: string;
    context: string;
    failure: string;
    failureLocation?: string;
    expected: string;
    actual: string;
    currentResult: string;
    expectedResult: string;
    request: IssueHttpContent;
    response: IssueHttpContent;
    comparison: IssueComparisonRow[];
    curl: string;
    bdd?: string;
    traceability: IssueTraceRow[];
    screenshot?: Pick<FailLensScreenshot, "relativePath" | "href">;
}
export declare function sanitizeEvidence(value: FailLensEvidence | undefined): FailLensEvidence | undefined;
export declare function buildIssueContent(test: FailLensTest, specPath: string, contracts?: FailLensContract[]): EvidenceContent | undefined;
export declare function buildEvidenceText(input: EvidenceContent): string;
export declare function buildEvidenceHtml(input: EvidenceContent, imageDataUrl?: string): string;
//# sourceMappingURL=evidence.d.ts.map