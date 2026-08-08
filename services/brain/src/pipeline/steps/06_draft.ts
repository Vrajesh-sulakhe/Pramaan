import fs from 'fs';
import path from 'path';

// Note: In Node.js, you can use the official '@ibm-cloud/watsonx-ai' SDK.
// Ensure you have WATSONX_API_KEY and WATSONX_PROJECT_ID in your .env

export interface DraftResult {
  finalDraft: string;
  usedFallback: boolean;
}

/**
 * Phase 3: Granite Integration (AJIT - SAP)
 * Takes the deterministic math gap, reads the template, and generates the complaint.
 * Hardened with Phase 4 Fallback: If Granite fails, it returns the filled template.
 */
export async function generateDraft(gapData: any): Promise<DraftResult> {
  const AI_BANNER = "\n\n*** AI-generated — review before sending ***";
  let templateContent = "";

  // 1. Load Manas's Template
  try {
    // Navigate from services/brain/src/pipeline/steps/06_draft.ts -> packages/templates
    const templatePath = path.resolve(__dirname, '../../../../../packages/templates/bill_complaint.txt');
    templateContent = fs.readFileSync(templatePath, 'utf8');
    
    if (!templateContent.trim()) {
      // Temporary placeholder since Manas hasn't written the file yet
      templateContent = "Dear Authority,\n\nI am writing to formally dispute a charge. The official rule states the limit is {OFFICIAL_LIMIT}, but I was charged {ACTUAL_CHARGE}. This is an illegal overcharge of {GAP_AMOUNT}.";
    }
  } catch (err) {
    console.error("Warning: Could not read template file. Using default.", err);
    templateContent = "Dear Authority, I am reporting an overcharge of {GAP_AMOUNT}.";
  }

  // 2. Call IBM Granite API
  try {
    // TODO: Initialize WatsonX client using process.env.WATSONX_API_KEY
    // Example: const client = new WatsonXAI({ apiKey, projectId });
    // const response = await client.generateText({ modelId: 'ibm/granite-13b-instruct-v2', input: prompt });
    
    // For now, simulate Granite filling the template (since we don't have the API key in the environment yet)
    let aiDraft = templateContent
      .replace('{OFFICIAL_LIMIT}', gapData.officialValue || 'Rs. 18,000')
      .replace('{ACTUAL_CHARGE}', gapData.actualValue || 'Rs. 45,000')
      .replace('{GAP_AMOUNT}', gapData.gap || 'Rs. 27,000');

    return {
      finalDraft: aiDraft + AI_BANNER, // Mandatory Ethical Gate Requirement
      usedFallback: false
    };

  } catch (error) {
    // 3. Phase 4 Fallback (If Granite crashes or network is down)
    console.error("Granite API Call Failed. Executing Template Fallback.", error);
    
    let fallbackDraft = templateContent
      .replace('{OFFICIAL_LIMIT}', gapData.officialValue || 'Rs. 18,000')
      .replace('{ACTUAL_CHARGE}', gapData.actualValue || 'Rs. 45,000')
      .replace('{GAP_AMOUNT}', gapData.gap || 'Rs. 27,000');

    return {
      finalDraft: fallbackDraft + AI_BANNER,
      usedFallback: true
    };
  }
}
