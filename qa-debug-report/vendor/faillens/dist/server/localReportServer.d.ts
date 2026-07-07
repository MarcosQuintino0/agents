export interface ReportServerOptions {
    reportDir: string;
    projectRoot: string;
    port?: number;
    idleTimeoutMs?: number;
    closeGraceMs?: number;
}
export interface ReportServer {
    url: string;
    port: number;
    token: string;
    closed: Promise<void>;
    close(): Promise<void>;
}
export declare function startReportServer(options: ReportServerOptions): Promise<ReportServer>;
//# sourceMappingURL=localReportServer.d.ts.map