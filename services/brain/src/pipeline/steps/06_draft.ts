import { ProofCard, HoldEvent } from '../../packages/contracts';

const BANNER = "AI-generated — review before sending";
const TIMEOUT_MS = 10000;

export async function draft(
  cards: ProofCard[],
  hold: HoldEvent | null,
  template: string
): Promise<{ text: string; banner: string }> {
  // 6. Filter cards: only include cards with status "gap"
  const gapCards = cards.filter((c) => c.status === "gap");

  let generatedText = "";
  let useFallback = false;

  try {
    // 1. & 4. Call IBM Granite API via fetch with a 10s timeout
    generatedText = await invokeGraniteWithTimeout(gapCards, hold, template, TIMEOUT_MS);

    // 2. CRITICAL: Verify deterministic output
    if (!verifyNumbers(generatedText, gapCards, hold, template)) {
      console.warn("Granite hallucinated numbers not present in proof cards. Discarding output and using fallback.");
      useFallback = true;
    }
  } catch (error) {
    // 4. FALLBACK path for failures or timeouts
    console.error("Granite API call failed or timed out. Falling back to template-fill approach.", error);
    useFallback = true;
  }

  if (useFallback) {
    generatedText = fallbackFill(gapCards, hold, template);
  }

  // 3. Attach the banner string. Always present.
  return {
    text: generatedText,
    banner: BANNER,
  };
}

async function invokeGraniteWithTimeout(
  gapCards: ProofCard[],
  hold: HoldEvent | null,
  template: string,
  timeoutMs: number
): Promise<string> {
  const apiKey = process.env.WATSONX_API_KEY;
  const projectId = process.env.WATSONX_PROJECT_ID;

  if (!apiKey || !projectId) {
    throw new Error("WatsonX credentials (WATSONX_API_KEY, WATSONX_PROJECT_ID) are missing.");
  }

  const prompt = buildPrompt(gapCards, hold, template);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Exchange API Key for IAM Token
    const tokenRes = await fetch("https://iam.cloud.ibm.com/identity/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${apiKey}`,
      signal: controller.signal,
    });

    if (!tokenRes.ok) {
      throw new Error(`Failed to get IAM token: ${tokenRes.status}`);
    }

    const tokenData = await tokenRes.json();

    // Call WatsonX Granite Model
    const watsonRes = await fetch("https://us-south.ml.cloud.ibm.com/ml/v1/text/generation?version=2023-05-29", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        model_id: "ibm/granite-13b-chat-v2",
        project_id: projectId,
        input: prompt,
        parameters: { max_new_tokens: 500 },
      }),
      signal: controller.signal,
    });

    if (!watsonRes.ok) {
      throw new Error(`WatsonX API returned status: ${watsonRes.status}`);
    }

    const responseData = await watsonRes.json();
    return responseData.results[0].generated_text.trim();
  } finally {
    clearTimeout(timeoutId);
  }
}

function buildPrompt(gapCards: ProofCard[], hold: HoldEvent | null, template: string): string {
  let prompt = `You are a helpful AI drafting a complaint letter.
Your task is to fill in the TEMPLATE exactly using ONLY the data provided in DATA.
Do NOT invent, guess, or hallucinate any numbers or amounts.
If there are multiple DATA items, combine them nicely in the text.

DATA:
${JSON.stringify(gapCards, null, 2)}
`;

  if (hold) {
    prompt += `\nHOLD DATA:\n${JSON.stringify(hold, null, 2)}\n`;
  }

  prompt += `\nTEMPLATE:\n${template}\n\nDraft the filled letter below:\n`;
  return prompt;
}

function fallbackFill(gapCards: ProofCard[], hold: HoldEvent | null, template: string): string {
  let result = template;

  if (gapCards.length > 0) {
    // Iterate the proof cards and replace the template placeholders
    const items = gapCards.map(c => c.item).join(", ");
    const yourValues = gapCards.map(c => c.your_value).join(", ");
    const officialValues = gapCards.map(c => c.official_value).join(", ");
    const gaps = gapCards.map(c => c.gap).join(", ");
    const sources = gapCards.map(c => c.rule_anchor.ref).join(", ");
    const rules = gapCards.map(c => c.rule_says_plain).join(", ");

    result = result
      .replace(/{{ITEM}}|{{item_category}}/gi, items)
      .replace(/{{YOUR_VALUE}}|{{your_value}}/gi, yourValues)
      .replace(/{{OFFICIAL_VALUE}}|{{official_value}}/gi, officialValues)
      .replace(/{{GAP}}|{{gap_amount}}/gi, gaps)
      .replace(/{{SOURCE}}|{{official_source}}/gi, sources)
      .replace(/{{RULE_SAYS}}|{{rule_says_plain}}/gi, rules);
  }

  if (hold) {
    result = result.replace(/{{INVOICE_ID}}|{{invoice_id}}/gi, hold.invoice_id);
  }

  // 5. If hold is not null, include a line in the letter mentioning the hold
  if (hold) {
    result += `\n\nA provisional hold of ₹${hold.amount} has been placed on invoice ${hold.invoice_id}, set to auto-release in 72 hours unless confirmed.`;
  }

  return result;
}

function verifyNumbers(generatedText: string, gapCards: ProofCard[], hold: HoldEvent | null, template: string): boolean {
  // Extract all numeric sequences from the generated text
  const textNumbers = (generatedText.match(/\b\d+(?:,\d{3})*(?:\.\d+)?\b/g) || [])
    .map(n => Number(n.replace(/,/g, '')));

  const allowedNumbers = new Set<number>();

  // Add numbers from cards
  gapCards.forEach(c => {
    allowedNumbers.add(c.your_value);
    allowedNumbers.add(c.official_value);
    allowedNumbers.add(c.gap);
  });

  // Add numbers from hold
  if (hold) {
    allowedNumbers.add(hold.amount);
    allowedNumbers.add(72); // "72 hours" auto-release rule
    const invoiceNums = (hold.invoice_id.match(/\b\d+(?:,\d{3})*(?:\.\d+)?\b/g) || [])
      .map(n => Number(n.replace(/,/g, '')));
    invoiceNums.forEach(n => allowedNumbers.add(n));
  }

  // Add numbers from the template (so we don't reject standard template boilerplate)
  const templateNums = (template.match(/\b\d+(?:,\d{3})*(?:\.\d+)?\b/g) || [])
    .map(n => Number(n.replace(/,/g, '')));
  templateNums.forEach(n => allowedNumbers.add(n));

  // Verify that EVERY number found in the text is within the allowed set
  for (const num of textNumbers) {
    // Allow small list numbers (1-10) just to be safe against standard bullet formatting by the model
    if (!allowedNumbers.has(num) && num > 10) {
      return false;
    }
  }

  return true;
}
