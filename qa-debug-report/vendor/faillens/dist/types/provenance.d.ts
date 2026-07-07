export type FactSource = "observed" | "asserted" | "contract" | "verified" | "not-verified";
export type PersistenceExpectation = "required" | "forbidden" | "preserve" | "remove" | "not-specified";
export type PersistenceEvidenceState = "confirmed-created" | "confirmed-absent" | "confirmed-preserved" | "confirmed-removed" | "not-verified";
export interface FailLensPersistenceExpectation {
    state: PersistenceExpectation;
    contractId?: string;
    ruleId?: string;
}
export interface FailLensPersistenceEvidence {
    state: PersistenceEvidenceState;
    mutationRequestId: string;
    verificationRequestId?: string;
    baselineRequestId?: string;
    summary?: string;
}
export interface FailLensFact {
    id: string;
    kind: string;
    value: unknown;
    source: FactSource;
    dimension?: string;
    requestId?: string;
    contractId?: string;
    ruleId?: string;
    file?: string;
    line?: number;
    conflictsWith?: string[];
}
export interface FailLensContractField {
    name: string;
    type?: string;
    attributes: Record<string, string | number | boolean>;
    raw: string;
}
export interface FailLensContractRule {
    id: string;
    attributes: Record<string, string | number | boolean>;
    status?: number;
    message?: string;
    persistence?: PersistenceExpectation;
    raw: string;
}
export interface FailLensContractCoverage {
    tag: string;
    status: string;
    motivo: string;
}
export interface ContractParseWarning {
    code: string;
    message: string;
    tag?: string;
    ruleId?: string;
    detail?: string;
}
export interface FailLensContract {
    id: string;
    api: string[];
    resumo?: string;
    fields: FailLensContractField[];
    rules: FailLensContractRule[];
    permissao?: Record<string, string | number | boolean>;
    cobertura: FailLensContractCoverage[];
    sourceFiles: string[];
    legacy: boolean;
    warnings: ContractParseWarning[];
}
//# sourceMappingURL=provenance.d.ts.map