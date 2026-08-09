import { createWorker } from 'tesseract.js';
import { DocumentConverter } from '@docling/core';
import { ExtractedField } from '../../packages/contracts'; // Path as requested

const THRESHOLD = 0.90;

export interface RunRequest {
  image: string;
  domain: "bill" | "lease";
}

export async function read(req: RunRequest): Promise<ExtractedField[]> {
  const results: ExtractedField[] = [];

  try {
    if (!req.image || req.image.trim() === '') {
      return [];
    }

    const isPdf = req.image.toLowerCase().endsWith('.pdf') || req.image.startsWith('data:application/pdf');

    if (isPdf) {
      // 1. Use Docling for PDFs
      const converter = new DocumentConverter();
      const doc = await converter.convert(req.image);

      if (!doc) return [];

      // Extract regular text blocks
      if (doc.pages) {
        for (const page of doc.pages) {
          if (page.texts) {
            for (const textItem of page.texts) {
              results.push(parseField(
                textItem.text,
                [textItem.bbox.x, textItem.bbox.y, textItem.bbox.width, textItem.bbox.height],
                textItem.confidence ?? 1.0
              ));
            }
          }
        }
      }

      // 7. Handle tables specifically for line items
      if (doc.tables) {
        for (const table of doc.tables) {
          if (table.cells) {
            for (const cell of table.cells) {
              results.push(parseField(
                cell.text,
                [cell.bbox.x, cell.bbox.y, cell.bbox.width, cell.bbox.height],
                cell.confidence ?? 1.0
              ));
            }
          }
        }
      }

    } else {
      // 1. Fall back to Tesseract.js for Images
      const worker = await createWorker('eng');
      try {
        const { data } = await worker.recognize(req.image);
        
        if (data && data.words) {
          // Extract word-level data as requested
          for (const word of data.words) {
            const x = word.bbox.x0;
            const y = word.bbox.y0;
            const width = word.bbox.x1 - word.bbox.x0;
            const height = word.bbox.y1 - word.bbox.y0;
            
            results.push(parseField(
              word.text.trim(),
              [x, y, width, height],
              word.confidence / 100.0 // Normalize 0-100 to 0.0-1.0
            ));
          }
        }
      } finally {
        await worker.terminate();
      }
    }
  } catch (error) {
    console.error("OCR Pipeline failed gracefully:", error);
    // 6. Return empty array on failure, do not crash
    return [];
  }

  return results;
}

function parseField(text: string, bbox: [number, number, number, number], conf: number): ExtractedField {
  // 2. Parse out a numeric value if present
  let value: number | null = null;
  const numMatch = text.match(/-?[\d,]+(\.\d+)?/);
  if (numMatch) {
    const parsed = parseFloat(numMatch[0].replace(/,/g, ''));
    if (!isNaN(parsed)) {
      value = parsed;
    }
  }

  // 2. Parse out unit string if present (e.g. "per tablet")
  let unit: string | null = null;
  const unitMatch = text.match(/\b(per\s+[a-zA-Z]+)\b/i);
  if (unitMatch) {
    unit = unitMatch[1].toLowerCase();
  }

  // 3 & 4. Confidence and low_conf flag
  return {
    text,
    value,
    unit,
    bbox,
    confidence: conf,
    low_conf: conf < THRESHOLD
  };
}
