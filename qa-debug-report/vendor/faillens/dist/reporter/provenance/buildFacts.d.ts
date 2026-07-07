import { type MaskConfig } from "../../collector/sensitiveMask";
import type { FailLensFact, FailLensPersistenceEvidence, FailLensPersistenceExpectation } from "../../types/provenance";
import type { FailLensRequest, FailLensRuleRef, FailLensTest } from "../../types/report";
export interface PersistenceState {
    expectation: FailLensPersistenceExpectation;
    evidence: FailLensPersistenceEvidence;
}
export declare function buildPersistenceState(test: FailLensTest, mainRequest: FailLensRequest | undefined, ruleRefs: FailLensRuleRef[]): PersistenceState | undefined;
export declare function buildFacts(test: FailLensTest, mainRequest: FailLensRequest | undefined, ruleRefs: FailLensRuleRef[], maskConfig: MaskConfig, persistence?: PersistenceState): FailLensFact[];
//# sourceMappingURL=buildFacts.d.ts.map