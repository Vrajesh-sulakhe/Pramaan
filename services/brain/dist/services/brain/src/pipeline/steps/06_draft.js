// IBM: Granite — plain-language letter generation (Ajit)
// Built with IBM Bob — AI SDLC Partner
export async function draft(cards, hold, template) {
    // ═══════════════ AJIT SEAM — START ═══════════════
    // TODO(ajit): replace this stub with the Granite call + template-fill fallback.
    // Contract: signature, types, and orchestrator wiring are Murgesh's.
    // Replace ONLY the body between the seam markers. Nothing else.
    //
    // RULES FOR YOUR BODY:
    //   1. Granite touches WORDING only — every number must come from the proof cards.
    //      If Granite outputs a number not present in the cards, discard it.
    //   2. banner MUST ALWAYS be "AI-generated — review before sending".
    //      Present on every response, even on fallback. Non-negotiable.
    //   3. FALLBACK: if Granite fails or times out (10s), fall back to pure
    //      template-fill (string interpolation). The letter must render without a model.
    //   4. Only include cards with status "gap" in the letter. Skip "ok" and "unverified".
    //   5. If hold != null, include a line about the hold amount and auto-release time.
    return templateFillStub(cards, hold, template);
    // ═══════════════ AJIT SEAM — END ══════════════════
}
/**
 * Pure template-fill fallback — no model call.
 * Used by the stub and should also be used by Ajit's fallback path.
 */
function templateFillStub(cards, hold, template) {
    const gapCards = cards.filter((c) => c.status === "gap");
    let text = template ||
        "To Whom It May Concern,\n\nI am writing to dispute the following charges on my medical bill:\n\n{{ITEMS}}\n\nKindly review and issue a corrected bill.\n\nYours sincerely.";
    if (gapCards.length > 0) {
        const items = gapCards
            .map((c) => `- ${c.item}: charged ₹${c.your_value} vs official ₹${c.official_value} (gap: ₹${c.gap}). ${c.rule_says_plain}`)
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
