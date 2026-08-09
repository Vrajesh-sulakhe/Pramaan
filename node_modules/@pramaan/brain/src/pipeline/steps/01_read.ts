import type { RunRequest, ExtractedField } from "@pramaan/contracts";
import { applyConfidenceGate } from "../confidence.js";
import { createWorker } from "tesseract.js";

export async function read(req: RunRequest): Promise<ExtractedField[]> {
  // ═══════════════ AJIT SEAM — START ═══════════════
  // This implementation uses tesseract.js to produce ExtractedField[] that
  // conforms to the contract. On blank/unreadable input returns [] and
  // always calls applyConfidenceGate(fields) before returning.
  // NOTE: Do not re-implement the 0.90 threshold — applyConfidenceGate handles it.

  try {
    const imageInput = req.image;
    if (!imageInput) return [];

    // Accept either a Buffer (binary) or a base64 string
    let buffer: Buffer;
    if (typeof imageInput === "string") {
      // base64 data URL or path — attempt to detect base64
      const maybeBase64 = imageInput.trim();
      if (/^data:/.test(maybeBase64) || /^[A-Za-z0-9+/]+=*$/.test(maybeBase64.replace(/^data:.*;base64,/, ""))) {
        const b64 = maybeBase64.replace(/^data:.*;base64,/, "");
        buffer = Buffer.from(b64, "base64");
      } else {
        // treat as file path
        try {
          buffer = await import("fs").then((m) => m.promises.readFile(imageInput));
        } catch (err) {
          // unreadable path -> graceful empty
          console.warn("read(): could not read image path, returning [].", err);
          return [];
        }
      }
    } else if (Buffer.isBuffer(imageInput)) {
      buffer = imageInput as Buffer;
    } else {
      return [];
    }

    if (!buffer || buffer.length === 0) return [];

    const worker = createWorker();
    await worker.load();
    await worker.loadLanguage("eng");
    await worker.initialize("eng");

    try {
      const { data } = await worker.recognize(buffer as any);
      const fields: ExtractedField[] = [];

      (data.lines || []).forEach((line: any, idx: number) => {
        const conf = typeof line.confidence === "number" ? line.confidence / 100.0 : 0;
        const bbox = line.bbox
          ? [line.bbox.x0, line.bbox.y0, line.bbox.x1, line.bbox.y1]
          : [0, 0, 0, 0];

        // Start with low_conf false; applyConfidenceGate will set correct flags
        fields.push({
          text: (line.text || "").trim(),
          value: (line.text || "").trim(),
          unit: null,
          bbox,
          confidence: conf,
          low_conf: false
        } as ExtractedField);
      });

      return applyConfidenceGate(fields);
    } catch (err) {
      console.error("OCR Pipeline Crashed. Returning empty array.", err);
      return [];
    } finally {
      await worker.terminate();
    }
  } catch (err) {
    console.error("read(): unexpected error, returning [].", err);
    return [];
  }
  // ═══════════════ AJIT SEAM — END ══════════════════
}
}
