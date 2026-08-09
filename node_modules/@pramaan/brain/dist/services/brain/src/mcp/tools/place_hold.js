// Built with IBM Bob — AI SDLC Partner
import { billingGateway } from "../../gateway/billing_gateway.js";
export function placeHold(invoice_id, amount, evidence_pack_id) {
    const hold = billingGateway.placeHold(invoice_id, amount, evidence_pack_id);
    return {
        hold_id: hold.hold_id,
        status: hold.status,
        expires_at: hold.expires_at,
        reversible: hold.reversible,
    };
}
