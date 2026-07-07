export interface BrowserTestContext {
    testId: string;
    specPath: string;
    title: string;
    titlePath: string[];
}
export declare function getCurrentTestContext(): BrowserTestContext | undefined;
export declare function installFailLensHooks(): void;
//# sourceMappingURL=hooks.d.ts.map