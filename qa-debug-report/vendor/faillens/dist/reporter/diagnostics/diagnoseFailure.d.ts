import type { FailLensDiagnosis, FailLensRequest, FailLensTest } from "../../types/report";
export interface DiagnosisContext {
    test: FailLensTest;
    mainRequest?: FailLensRequest;
}
export declare function diagnoseFailure(context: DiagnosisContext): FailLensDiagnosis | undefined;
//# sourceMappingURL=diagnoseFailure.d.ts.map