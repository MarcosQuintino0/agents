import type { FailLensScreenshot, TestState } from "../types/report";
export interface ScreenshotCaptureContext {
    projectRoot: string;
    screenshotsFolder: string;
    outputDir: string;
}
export interface CapturedScreenshot {
    screenshot: FailLensScreenshot;
    specName: string;
    titleHint: string;
    capturedAt?: number;
}
export interface ScreenshotTestCandidate {
    id: string;
    specPath: string;
    title: string;
    titlePath?: string[];
    state: TestState;
    attempts?: Array<Record<string, unknown>>;
}
export declare function captureScreenshotMetadata(rawDetails: Record<string, unknown>, context: ScreenshotCaptureContext): CapturedScreenshot | undefined;
export declare function associateScreenshots(candidates: ScreenshotTestCandidate[], captures: CapturedScreenshot[]): Map<string, FailLensScreenshot[]>;
//# sourceMappingURL=screenshotEvidence.d.ts.map