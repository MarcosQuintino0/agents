export interface CatalogTagRef {
    object: string;
    name: string;
}
export interface PlannedTestTags {
    title: string;
    ruleRefs: string[];
    tags: string[];
    catalogRefs: CatalogTagRef[];
}
export declare function findImportSource(source: string, identifier: string): string | undefined;
export declare function parseCatalogModule(source: string): Map<string, string>;
export declare function extractTestTags(source: string): PlannedTestTags[];
//# sourceMappingURL=extractTestTags.d.ts.map