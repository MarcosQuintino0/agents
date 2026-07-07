import type { FailLensContract, FailLensContractRule } from "../../types/provenance";
import type { FailLensRuleRef, FailLensSpec } from "../../types/report";
export interface ResolvedContracts {
    contracts: FailLensContract[];
    ruleIndex: Map<string, Array<{
        contractId: string;
        rule: FailLensContractRule;
    }>>;
}
export declare function resolveContracts(specs: FailLensSpec[]): ResolvedContracts;
export declare function resolveRuleRef(ref: FailLensRuleRef, ruleIndex: ResolvedContracts["ruleIndex"], preferredContractId?: string): FailLensRuleRef;
export declare function contractIdForSpec(specPath: string, contracts: FailLensContract[]): string | undefined;
//# sourceMappingURL=resolveContracts.d.ts.map