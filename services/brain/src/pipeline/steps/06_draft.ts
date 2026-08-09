// IBM: Granite — plain-language letter generation (Ajit)
// Built with IBM Bob — AI SDLC Partner

import type { ProofCard, HoldEvent, Draft } from "@pramaan/contracts";
import fs from "fs";
import path from "path";

export async function draft(
  cards: ProofCard[],
  hold: HoldEvent | null,
  template: string
): Promise<Draft> {
  // ═══════════════ AJIT SEAM — START ═══════════════
  const AI_BANNER = "AI-generated — review before sending";

  try {
    // Only gap cards belong in a dispute letter
    const gapCards = cards.filter((c) => c.status === "gap");
    if (gapCards.length === 0) {
      return templateFillStub(cards, hold, template);
    }

    // Verify required env vars are present — fall back gracefully if not
    const apiKey = process.env["WATSONX_API_KEY"];
    const projectId = process.env["WATSONX_PROJECT_ID"];
    const serviceUrl =
      process.env["WATSONX_URL"] ?? "https://us-south.ml.cloud.ibm.com";

    if (!apiKey || !projectId) {
      console.warn("[06_draft] WATSONX env vars missing — using fallback.");
      return templateFillStub(cards, hold, template);
    }

    // Build a grounded prompt from gap card data only — no hallucination surface
    const cardSummaries = gapCards
      .map(
        (c) =>
          `Item: ${c.item} | Charged: ₹${c.your_value} | Official: ₹${c.official_value} | Gap: ₹${c.gap} | Rule: ${c.rule_says_plain}`
      )
      .join("\n");

    const holdLine =
      hold !== null
        ? `A provisional dispute hold of ₹${hold.amount} has been placed on invoice ${hold.invoice_id}. It auto-releases in 72 hours unless confirmed (hold ID: ${hold.hold_id}).`
        : "No hold has been placed.";

    const prompt = `You are a formal complaint letter writer. Using ONLY the data provided below, write a professional dispute letter. Do NOT invent any numbers, names, dates, or items not listed below.

DISPUTED ITEMS:
${cardSummaries}

HOLD STATUS:
${holdLine}

TEMPLATE TO FILL:
${template}

Write the letter now using only the data above.`;

    // Dynamic imports — trunk compiles without these deps installed
    const { WatsonXAI } = await import("@ibm-cloud/watsonx-ai");
    const { IamAuthenticator } = await import("ibm-cloud-sdk-core");

    const service = WatsonXAI.newInstance({
      authenticator: new IamAuthenticator({ apikey: apiKey }),
      serviceUrl,
      version: "2023-05-29",
    });

    // Race Granite against a 10-second timeout
    const graniteText = await Promise.race([
      service
        .generateText({
          modelId: "ibm/granite-3-8b-instruct",
          projectId,
          input: prompt,
          parameters: { max_new_tokens: 800, temperature: 0.2 },
        })
        .then((r) => r.result?.results?.[0]?.generated_text ?? ""),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Granite timeout")), 10_000)
      ),
    ]);

    // Empty or whitespace output → fall back rather than send a blank letter
    if (!graniteText || graniteText.trim().length === 0) {
      console.warn("[06_draft] Granite returned empty output — using fallback.");
      return templateFillStub(cards, hold, template);
    }

    // Banner is a system label — never part of the generated content
    return { text: graniteText.trim(), banner: AI_BANNER };
  } catch (err) {
    console.error("[06_draft] Granite failed, using fallback:", err);
    return templateFillStub(cards, hold, template);
  }
  // ═══════════════ AJIT SEAM — END ══════════════════
}

function templateFillStub(
  cards: ProofCard[],
  hold: HoldEvent | null,
  template: string
): Draft {
  const gapCards = cards.filter((c) => c.status === "gap");

  let text =
    template ||
    "To Whom It May Concern,\n\nI am writing to dispute the following charges on my medical bill:\n\n{{ITEMS}}\n\nKindly review and issue a corrected bill.\n\nYours sincerely.";

  if (gapCards.length > 0) {
    const items = gapCards
      .map(
        (c) =>
          `- ${c.item}: charged ₹${c.your_value} vs official ₹${c.official_value} (gap: ₹${c.gap}). ${c.rule_says_plain}`
      )
      .join("\n");
    text = text.replace("{{ITEMS}}", items);
    text = text.replace("{{ITEM}}", gapCards[0]?.item ?? "");
    text = text.replace("{{YOUR_VALUE}}", String(gapCards[0]?.your_value ?? ""));
    text = text.replace("{{OFFICIAL_VALUE}}", String(gapCards[0]?.official_value ?? ""));
    text = text.replace("{{GAP}}", String(gapCards[0]?.gap ?? ""));
    text = text.replace("{{SOURCE}}", gapCards[0]?.rule_anchor?.url ?? "");
  }

  if (hold !== null) {
    text += `\n\nNote: A provisional hold of ₹${hold.amount} has been placed on invoice ${hold.invoice_id}, set to auto-release in 72 hours unless confirmed (hold ID: ${hold.hold_id}).`;
  }

  return {
    text,
    banner: "AI-generated — review before sending",
  };
}
