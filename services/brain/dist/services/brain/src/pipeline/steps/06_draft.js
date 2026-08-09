// IBM: Granite — plain-language letter generation (Ajit)
// Built with IBM Bob — AI SDLC Partner
import fs from "fs";
import path from "path";
export async function draft(cards, hold, template) {
    // ═══════════════ AJIT SEAM — START ═══════════════
    // Attempt an AI-driven fill (Granite) but fall back to deterministic
    // template-fill. Banner must always be the required string.
    const AI_BANNER = "AI-generated — review before sending";
    // Load template: prefer provided template, else try file, else default
    let templateContent = template || "";
    if (!templateContent) {
        try {
            const templatePath = path.resolve(new URL("../../../../../packages/templates/bill_complaint.txt", import.meta.url).pathname);
            templateContent = fs.readFileSync(templatePath, "utf8");
        }
        catch (err) {
            templateContent = "To Whom It May Concern,\n\nI am writing to dispute the following charges on my medical bill:\n\n{{ITEMS}}\n\nKindly review and issue a corrected bill.\n\nYours sincerely.";
        }
    }
    // Prepare gap card data for template replacement
    const gapCards = cards.filter((c) => c.status === "gap");
    const first = gapCards[0] ?? null;
    // Try to call Granite (simulated here); on any failure fall back
    try {
        // A real Granite call would go here using env WATSONX_* values.
        // Simulate AI by filling template variables from the gap cards
        let aiDraft = templateContent;
        aiDraft = aiDraft
            .replace(/{{official_value}}/g, String(first?.official_value ?? ""))
            .replace(/{{your_value}}/g, String(first?.your_value ?? ""))
            .replace(/{{gap_amount}}/g, String(first?.gap ?? ""))
            .replace(/{{invoice_id}}/g, String(first?.rule_anchor?.url ?? "INV-001"))
            .replace(/{{bill_date}}/g, new Date().toLocaleDateString())
            .replace(/{{user_name}}/g, "")
            .replace(/{{hospital_name}}/g, "")
            .replace(/{{current_date}}/g, new Date().toLocaleDateString())
            .replace(/{{item_category}}/g, String(first?.item ?? ""))
            .replace(/{{official_source}}/g, String(first?.rule_anchor?.ref ?? ""))
            .replace(/{{rule_says_plain}}/g, String(first?.rule_says_plain ?? ""));
        if (gapCards.length > 0) {
            const items = gapCards
                .map((c) => `- ${c.item}: charged ₹${c.your_value} vs official ₹${c.official_value} (gap: ₹${c.gap}). ${c.rule_says_plain}`)
                .join("\n");
            aiDraft = aiDraft.replace("{{ITEMS}}", items);
        }
        if (hold !== null) {
            aiDraft += `\n\nNote: A provisional hold of ₹${hold.amount} has been placed on invoice ${hold.invoice_id}, set to auto-release in 72 hours unless confirmed (hold ID: ${hold.hold_id}).`;
        }
        return {
            text: aiDraft,
            banner: AI_BANNER,
        };
    }
    catch (err) {
        // Fallback to deterministic template-fill stub
        return templateFillStub(cards, hold, templateContent);
    }
    // ═══════════════ AJIT SEAM — END ══════════════════
}
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
