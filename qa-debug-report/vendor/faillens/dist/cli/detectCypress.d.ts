export declare const CYPRESS_NOT_FOUND_MESSAGE = "N\u00E3o foi poss\u00EDvel detectar um projeto Cypress. Nesta vers\u00E3o, FailLens suporta apenas Cypress E2E com cypress.config.js.";
export interface DetectedCypressProject {
    projectRoot: string;
    packageJsonPath: string;
    configPath: string;
    cypressDir: string;
    supportPath?: string;
    outputDir: string;
}
export declare function detectCypress(projectRoot?: string, configuredFile?: string): Promise<DetectedCypressProject>;
//# sourceMappingURL=detectCypress.d.ts.map