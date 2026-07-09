export declare const DEFAULT_MASK_FIELDS: string[];
export interface MaskOptions {
    fields?: string[];
    patterns?: string[];
}
export type MaskConfig = string[] | MaskOptions;
export declare function hasMaskRules(config?: MaskConfig): boolean;
export declare function isSensitiveField(key: string, extraFields?: string[]): boolean;
export declare function maskSensitiveData<T>(value: T, config?: MaskConfig): T;
export declare function maskUrl(value: string, config?: MaskConfig): string;
export declare function maskSensitiveText(value: string, config?: MaskConfig): string;
//# sourceMappingURL=sensitiveMask.d.ts.map