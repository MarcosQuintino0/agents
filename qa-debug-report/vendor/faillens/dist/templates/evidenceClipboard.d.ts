export type EvidenceCopyResult = "complete" | "without-image" | "text-only" | "failed";
export interface EvidenceCopyInput {
    text: string;
    html: string;
    imageBlob?: Blob;
    hasScreenshot: boolean;
}
interface ClipboardWriter {
    write?(items: unknown[]): Promise<void>;
    writeText?(value: string): Promise<void>;
}
interface ClipboardItemConstructor {
    new (data: Record<string, Blob>): unknown;
    supports?(type: string): boolean;
}
export interface EvidenceClipboardEnvironment {
    isSecureContext: boolean;
    clipboard?: ClipboardWriter;
    ClipboardItem?: ClipboardItemConstructor;
    Blob: typeof Blob;
    fallbackCopy(value: string): boolean | Promise<boolean>;
}
export declare function copyEvidenceToClipboard(input: EvidenceCopyInput, environment: EvidenceClipboardEnvironment): Promise<EvidenceCopyResult>;
export {};
//# sourceMappingURL=evidenceClipboard.d.ts.map