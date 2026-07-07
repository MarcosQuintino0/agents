export interface OpenOptions {
    report?: string;
    port?: number;
    browser?: boolean;
    idleTimeoutMs?: number;
}
export interface ReportLocation {
    reportDir: string;
    projectRoot: string;
}
export declare function resolveReportLocation(report: string | undefined, projectRoot: string): Promise<ReportLocation>;
export declare function openReport(options?: OpenOptions, projectRoot?: string): Promise<void>;
export declare function openCommand(options?: OpenOptions, projectRoot?: string): Promise<number>;
//# sourceMappingURL=open.d.ts.map