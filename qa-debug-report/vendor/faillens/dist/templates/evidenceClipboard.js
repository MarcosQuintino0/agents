"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.copyEvidenceToClipboard = copyEvidenceToClipboard;
async function copyEvidenceToClipboard(input, environment) {
    const clipboard = environment.clipboard;
    const Item = environment.ClipboardItem;
    let richAttempted = false;
    if (environment.isSecureContext && clipboard?.write && Item) {
        richAttempted = true;
        const data = {
            "text/plain": new environment.Blob([input.text], { type: "text/plain" }),
            "text/html": new environment.Blob([input.html], { type: "text/html" }),
        };
        const supportsPng = Boolean(input.imageBlob)
            && (typeof Item.supports !== "function" || Item.supports("image/png"));
        if (supportsPng && input.imageBlob)
            data["image/png"] = input.imageBlob;
        try {
            await clipboard.write([new Item(data)]);
            return supportsPng ? "complete" : input.hasScreenshot ? "without-image" : "text-only";
        }
        catch {
            // O fallback textual abaixo é esperado para arquivos locais e browsers restritivos.
        }
    }
    if (environment.isSecureContext && clipboard?.writeText) {
        try {
            await clipboard.writeText(input.text);
            return richAttempted && input.hasScreenshot ? "without-image" : "text-only";
        }
        catch {
            // Mantém compatibilidade com o fallback document.execCommand existente.
        }
    }
    return await environment.fallbackCopy(input.text) ? "text-only" : "failed";
}
//# sourceMappingURL=evidenceClipboard.js.map