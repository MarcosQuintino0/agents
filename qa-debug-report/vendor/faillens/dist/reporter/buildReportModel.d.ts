import type { ResolvedFailLensConfig } from "../types/config";
import type { FailLensReport, FailLensRequest, FailLensSpec, FailLensTest } from "../types/report";
import type { FailLensRuleRef } from "../types/report";
export declare function inferMainRequest(test: FailLensTest, ruleRefs?: FailLensRuleRef[]): FailLensRequest | undefined;
export interface BuildReportOptions {
    generatedAt?: string;
    config?: Partial<ResolvedFailLensConfig>;
}
export declare function buildReportModel(inputSpecs: FailLensSpec[], options?: BuildReportOptions): FailLensReport;
//# sourceMappingURL=buildReportModel.d.ts.map