// IBM: Docling — PDF/image structured extraction (Ajit)
// Built with IBM Bob — AI SDLC Partner
import { applyConfidenceGate } from "../confidence.js";
export async function read(req) {
    // ═══════════════ AJIT SEAM — START ═══════════════
    try {
        // Guard: reject empty / missing input immediately
        if (!req.image || req.image.trim() === "")
            return [];
        // Dynamic import — trunk compiles without this dep installed
        const { createWorker } = await import("tesseract.js");
        const worker = await createWorker("eng");
        const { data } = await worker.recognize(req.image);
        await worker.terminate();
        const rawFields = [];
        // Tesseract Page → blocks → paragraphs → lines
        for (const block of data.blocks ?? []) {
            for (const para of block.paragraphs) {
                for (const line of para.lines) {
                    const text = line.text?.trim() ?? "";
                    if (!text)
                        continue;
                    // Extract first numeric token exactly as read — never round or correct
                    const numMatch = text.match(/[\d,]+\.?\d*/);
                    const value = numMatch
                        ? parseFloat(numMatch[0].replace(/,/g, ""))
                        : null;
                    // Heuristic unit detection — must be one of the allowed values or null
                    let unit = null;
                    const lower = text.toLowerCase();
                    if (lower.includes("per tablet") || lower.includes("/tab"))
                        unit = "per tablet";
                    else if (lower.includes("per scan") || lower.includes("/scan"))
                        unit = "per scan";
                    else if (lower.includes("per day") || lower.includes("/day"))
                        unit = "per day";
                    else if (lower.includes("per procedure") ||
                        lower.includes("/procedure"))
                        unit = "per procedure";
                    else if (lower.includes("total") || lower.includes("grand total"))
                        unit = "total";
                    rawFields.push({
                        text,
                        value,
                        unit,
                        bbox: [
                            line.bbox.x0,
                            line.bbox.y0,
                            line.bbox.x1 - line.bbox.x0,
                            line.bbox.y1 - line.bbox.y0,
                        ],
                        // Tesseract reports confidence 0-100; normalise to 0.0-1.0
                        confidence: line.confidence != null ? line.confidence / 100 : 0,
                        low_conf: false, // applyConfidenceGate will set this correctly
                    });
                }
            }
        }
        return applyConfidenceGate(rawFields);
    }
    catch (err) {
        console.error("[01_read] OCR failed:", err);
        return [];
    }
    // ═══════════════ AJIT SEAM — END ══════════════════
}
