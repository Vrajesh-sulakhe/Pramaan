// Built with IBM Bob — AI SDLC Partner
import { billingGateway } from "../../gateway/billing_gateway.js";
export function releaseHold(hold_id, reason) {
    return billingGateway.release(hold_id, reason);
}
