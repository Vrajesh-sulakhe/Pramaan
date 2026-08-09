// IBM: Granite — plain-language letter generation (Ajit)
// Built with IBM Bob — AI SDLC Partner

import type { ProofCard, HoldEvent, Draft } from "@pramaan/contracts";
import fs from "fs";
import path from "path";
import { auditLog } from "../../audit/audit_log.js";

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
    const prompt =
      "You are a professional medical billing advocate. Write a formal complaint letter to the hospital billing department.\n\n" +
      "OVERCHARGES DETECTED:\n" +
      gapCards
        .map(
          (c, i) =>
            `${i + 1}. ${c.item}: Charged ₹${c.your_value}, Official rate ₹${c.official_value}, Overcharge ₹${c.gap}. ${c.rule_says_plain}`
        )
        .join("\n") +
      (hold !== null
        ? `\n\nPROVISIONAL HOLD: A hold of ₹${hold.amount} has been placed on this invoice. It will auto-release in 72 hours unless confirmed by the patient.`
        : "") +
      "\n\nINSTRUCTIONS:\n" +
      "- Use ONLY the numbers provided above. Do not invent any amounts.\n" +
      "- Keep the tone professional, factual, and firm.\n" +
      "- Request a refund of the overcharged amount.\n" +
      "- Reference the official source for each overcharge.\n" +
      "- End with a request for written confirmation of the refund.";

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

    // ── Number guard ──────────────────────────────────────────────────────────
    // Build the set of all numbers that legitimately appear in gap cards + hold.
    // Any number Granite outputs that is NOT in this set is a hallucination.
    const validNumbers = new Set<number>();
    for (const c of gapCards) {
      validNumbers.add(c.your_value);
      validNumbers.add(c.official_value);
      validNumbers.add(c.gap);
    }
    if (hold !== null) validNumbers.add(hold.amount);

    // Extract every numeric token from Granite's output
    const numPattern = /₹?\s*([\d,]+\.?\d*)/g;
    const discardedNumbers: number[] = [];
    let match: RegExpExecArray | null;
    while ((match = numPattern.exec(graniteText)) !== null) {
      const parsed = parseFloat(match[1]!.replace(/,/g, ""));
      if (!isNaN(parsed) && !validNumbers.has(parsed)) {
        discardedNumbers.push(parsed);
      }
    }

    if (discardedNumbers.length > 0) {
      console.warn(
        "[06_draft] Number guard triggered — Granite hallucinated a value. Falling back.",
        { discarded: discardedNumbers, valid: [...validNumbers] }
      );
      auditLog.append({
        t: "error",
        run_id: "draft-run-unknown",
        ts: new Date().toISOString(),
        payload: {
          event: "granite_guard_triggered",
          discarded_numbers: discardedNumbers,
          valid_numbers: [...validNumbers],
        },
      });
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
