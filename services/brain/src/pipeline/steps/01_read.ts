import { createWorker } from 'tesseract.js';

export interface ExtractedField {
  text: string;
  value: string | number | null;
  bbox: [number, number, number, number];
  confidence: number;
}

export interface ReadResult {
  documentId: string;
  fields: Record<string, ExtractedField>;
  metadata: {
    lowConfidenceFlag: boolean;
    confidenceThreshold: number;
  };
}

/**
 * Phase 2: OCR Pipeline implementation (AJIT - SAP)
 * Hardened to score confidence per field and emit a low-confidence flag
 * for the yellow "tap to confirm" UI.
 */
export async function readDocument(imageBuffer: Buffer): Promise<ReadResult> {
  // Graceful failure check for empty/bad input
  if (!imageBuffer || imageBuffer.length === 0) {
    console.warn("Received empty image buffer. Gracefully returning unverified.");
    return generateUnverifiedResult();
  }

  const worker = await createWorker('eng');
  const confidenceThreshold = 90.0; // 90% threshold for the yellow UI gate
  let lowConfidenceFlag = false;
  
  try {
    // 1. Run OCR (extracts text, bounding boxes, and confidence per word/line)
    const { data } = await worker.recognize(imageBuffer);
    const fields: Record<string, ExtractedField> = {};
    
    // 2. Process lines and check against the confidence gate
    data.lines.forEach((line, index) => {
      const conf = line.confidence; // Tesseract returns 0-100
      
      // Confidence Gate Logic
      if (conf < confidenceThreshold) {
        lowConfidenceFlag = true;
      }
      
      fields[`line_${index}`] = {
        text: line.text.trim(),
        value: line.text.trim(), // Storing raw text as value for generic lines
        bbox: [line.bbox.x0, line.bbox.y0, line.bbox.x1, line.bbox.y1],
        confidence: conf / 100.0, // Normalize to 0.0 - 1.0 contract
      };
    });
    
    // 3. Return output perfectly matching the Vrajesh UI contract
    return {
      documentId: `doc_${Date.now()}`,
      fields,
      metadata: {
        lowConfidenceFlag,
        confidenceThreshold: confidenceThreshold / 100.0
      }
    };
    
  } catch (error) {
    console.error("OCR Pipeline Crashed. Catching and returning unverified state.", error);
    return generateUnverifiedResult();
  } finally {
    await worker.terminate();
  }
}

function generateUnverifiedResult(): ReadResult {
  return {
    documentId: `doc_${Date.now()}`,
    fields: {},
    metadata: {
      lowConfidenceFlag: true,
      confidenceThreshold: 0.90
    }
  };
}
