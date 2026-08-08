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
  } catch (err) {
    console.error("Warning: Could not read template file. Using default.", err);
    templateContent = "Dear Billing Department, I am reporting an overcharge of ₹{{gap_amount}}.";
  }

  // 2. Call IBM Granite API
  try {
    // TODO: Initialize WatsonX client using process.env.WATSONX_API_KEY
    // Example: const client = new WatsonXAI({ apiKey, projectId });
    // const response = await client.generateText({ modelId: 'ibm/granite-13b-instruct-v2', input: prompt });
    
    // For now, simulate Granite filling the template using Manas's specific {{variables}}
    let aiDraft = templateContent
      .replace(/{{official_value}}/g, gapData.officialValue || '18,000')
      .replace(/{{your_value}}/g, gapData.actualValue || '45,000')
      .replace(/{{gap_amount}}/g, gapData.gap || '27,000')
      .replace(/{{invoice_id}}/g, gapData.invoiceId || 'INV-001')
      .replace(/{{bill_date}}/g, gapData.billDate || 'Aug 8, 2026')
      .replace(/{{user_name}}/g, gapData.userName || 'Ajit')
      .replace(/{{hospital_name}}/g, gapData.hospitalName || 'City Hospital')
      .replace(/{{current_date}}/g, gapData.currentDate || 'Aug 8, 2026')
      .replace(/{{item_category}}/g, gapData.itemCategory || 'Bed Charges')
      .replace(/{{official_source}}/g, gapData.officialSource || 'CGHS Rate Card 2024')
      .replace(/{{rule_says_plain}}/g, gapData.ruleSaysPlain || 'Maximum allowed charge is ₹18,000.');

    return {
      finalDraft: aiDraft + AI_BANNER, // Mandatory Ethical Gate Requirement
      usedFallback: false
    };

  } catch (error) {
    // 3. Phase 4 Fallback (If Granite crashes or network is down)
    console.error("Granite API Call Failed. Executing Template Fallback.", error);
    
    let fallbackDraft = templateContent
      .replace(/{{official_value}}/g, gapData.officialValue || '18,000')
      .replace(/{{your_value}}/g, gapData.actualValue || '45,000')
      .replace(/{{gap_amount}}/g, gapData.gap || '27,000')
      .replace(/{{invoice_id}}/g, gapData.invoiceId || 'INV-001')
      .replace(/{{bill_date}}/g, gapData.billDate || 'Aug 8, 2026')
      .replace(/{{user_name}}/g, gapData.userName || 'Ajit')
      .replace(/{{hospital_name}}/g, gapData.hospitalName || 'City Hospital')
      .replace(/{{current_date}}/g, gapData.currentDate || 'Aug 8, 2026')
      .replace(/{{item_category}}/g, gapData.itemCategory || 'Bed Charges')
      .replace(/{{official_source}}/g, gapData.officialSource || 'CGHS Rate Card 2024')
      .replace(/{{rule_says_plain}}/g, gapData.ruleSaysPlain || 'Maximum allowed charge is ₹18,000.');

    return {
      finalDraft: fallbackDraft + AI_BANNER,
      usedFallback: true
    };
  }
}
