import type { FailLensDiagnosis } from "../../types/report";
export declare const SUCCESS_STATUSES: number[];
export declare const CLIENT_ERROR_STATUSES: number[];
export interface StatusDiagnosisRule {
    category: FailLensDiagnosis["category"];
    title: string;
    expected: (status: number) => boolean;
    actual: (status: number) => boolean;
    methods?: string[];
    summary: (expected: number, actual: number) => string;
    suggestedAction: string;
}
export declare const STATUS_DIAGNOSIS_RULES: StatusDiagnosisRule[];
//# sourceMappingURL=rules.d.ts.map