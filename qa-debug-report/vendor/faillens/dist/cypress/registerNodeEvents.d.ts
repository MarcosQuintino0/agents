import type { ResolvedFailLensConfig } from "../types/config";
import type { FailLensReport, FailLensSpec } from "../types/report";
export interface RegisterNodeEventsOptions {
    projectRoot: string;
    resultsDir: string;
    outputDir: string;
    config: ResolvedFailLensConfig;
    generateOnAfterRun?: boolean;
}
type CypressOn = (event: string, handler: unknown) => void;
export declare function generateReportArtifacts(specs: FailLensSpec[], outputDir: string, config?: Partial<ResolvedFailLensConfig>): Promise<FailLensReport>;
export declare function loadPartialSpecs(resultsDir: string): Promise<FailLensSpec[]>;
export declare function registerNodeEvents(on: CypressOn, cypressConfig: Record<string, unknown>, options: RegisterNodeEventsOptions): Record<string, unknown>;
export {};
//# sourceMappingURL=registerNodeEvents.d.ts.map