import type { ResolvedFailLensConfig } from "../types/config";
import type { DetectedCypressProject } from "../cli/detectCypress";
export interface InstrumentedFiles {
    workDir: string;
    configPath: string;
    supportPath: string;
    resultsDir: string;
}
export declare function createInstrumentedConfig(project: DetectedCypressProject, config: ResolvedFailLensConfig): Promise<InstrumentedFiles>;
//# sourceMappingURL=createInstrumentedConfig.d.ts.map