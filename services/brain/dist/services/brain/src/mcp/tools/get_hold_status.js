// Built with IBM Bob — AI SDLC Partner
import { billingGateway } from "../../gateway/billing_gateway.js";
export function getHoldStatus(hold_id) {
    return billingGateway.getStatus(hold_id);
}
