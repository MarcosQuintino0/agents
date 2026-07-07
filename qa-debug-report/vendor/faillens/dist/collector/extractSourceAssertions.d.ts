import type { FailLensAssertion, FailLensStatusExpectation } from "../types/report";
export interface PlannedTestAssertions {
    title: string;
    assertions: PlannedSourceAssertion[];
    statusExpectation?: FailLensStatusExpectation;
}
export interface PlannedSourceAssertion extends FailLensAssertion {
    sourceRequestOrder?: number;
    sourceStatusExpectation?: FailLensStatusExpectation;
}
export declare function extractSourceAssertions(source: string, file: string): PlannedTestAssertions[];
//# sourceMappingURL=extractSourceAssertions.d.ts.map