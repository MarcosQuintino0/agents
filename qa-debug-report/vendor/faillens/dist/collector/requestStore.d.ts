import type { FailLensAssertion, FailLensSpec, FailLensScreenshot, TestState } from "../types/report";
import type { PlannedTestAssertions } from "./extractSourceAssertions";
import type { PlannedTestTags } from "./extractTestTags";
import type { FailLensContract } from "../types/report";
export interface SetTestPayload {
    id?: string;
    title: string;
    titlePath?: string[];
    specPath?: string;
}
export interface AddRequestPayload {
    testId?: string;
    specPath?: string;
    id?: string;
    method?: string;
    url?: string;
    originalUrl?: string;
    requestHeaders?: Record<string, unknown>;
    requestBody?: unknown;
    failOnStatusCode?: boolean;
    startedAt?: string;
}
export interface FinishRequestPayload {
    testId?: string;
    specPath?: string;
    id: string;
    receivedStatus?: number;
    responseHeaders?: Record<string, unknown>;
    responseBody?: unknown;
    durationMs?: number;
    error?: unknown;
    redirects?: Array<{
        statusCode?: number;
        location: string;
    }>;
}
export interface TestResultPayload {
    testId?: string;
    specPath?: string;
    state?: TestState | string;
    durationMs?: number;
    error?: unknown;
    assertions?: FailLensAssertion[];
}
export declare class RequestStore {
    private readonly specs;
    private currentTestId?;
    private currentSpecPath;
    private readonly maskConfig;
    constructor(maskFields?: string[], maskPatterns?: string[]);
    private getSpec;
    private findTest;
    setTest(payload: SetTestPayload): string;
    addRequest(payload: AddRequestPayload): string;
    finishRequest(payload: FinishRequestPayload): null;
    setTestResult(payload: TestResultPayload): null;
    setTestScreenshots(specPath: string, testId: string, screenshots: FailLensScreenshot[]): void;
    mergeSourceAssertions(specPath: string, plannedTests: PlannedTestAssertions[]): void;
    mergeContract(specPath: string, contract: FailLensContract | undefined): void;
    mergeTestTags(specPath: string, plannedTags: PlannedTestTags[]): void;
    mergeAfterSpec(specInfo: Record<string, unknown>, results?: Record<string, unknown>): FailLensSpec;
    snapshotSpec(specPath: string): FailLensSpec;
    snapshot(): FailLensSpec[];
}
//# sourceMappingURL=requestStore.d.ts.map