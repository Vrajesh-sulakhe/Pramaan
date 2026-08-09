// apps/mobile/src/data/mockRun.ts
// UI-side RunResponse type + mock generator.
// This type is the ONLY shape the UI ever sees — dataSource.ts maps from engine contract.

import { AuditEvent } from '../components/AuditViewer';
export type { AuditEvent };
import { BBoxField } from '../components/BBoxOverlay';
import { ProofStatus } from '../components/ProofCard';
import { HoldStatus } from '../components/HoldChip';

export interface RunResponse {
  id: string;
  fields: BBoxField[];
  proofs: {
    id: string;
    status: ProofStatus;
    itemName: string;
    sourceLabel: string;
    sourceValue: string;
    sourceRef: string;
    sourceRefUrl?: string;       // V-2: clickable source anchor link
    computeLabel: string;
    computeValue: string;
    computeMath?: string;
    ruleLabel: string;
    ruleValue: string;
    ruleRefText: string;
    ruleRefUrl?: string;         // V-2: clickable rule anchor link
    summaryText: string;         // V-2: rule_says_plain from Manas's rulebook
  }[];
  hold: {                        // V-4: null = "No hold" state — render gracefully
    status: HoldStatus;
    amount: string;
  } | null;
  draftText: string;             // V-5: render verbatim, never rewrite
  draftBanner: string;           // V-5: MANDATORY AI banner per IBM Granite policy
  audit: AuditEvent[];
}

export const generateDynamicMockRun = (domain: 'bill' | 'lease', captureType: string | null, captureData: string | null): RunResponse => {
  const isLease = domain === 'lease';
  const textLen = (captureData || '').length;

  // Randomize some values so it feels "real" each time
  const randomGap = isLease ? (textLen > 50 ? 5000 : 2500) : (textLen > 50 ? 27000 : 1200);
  const gapStr = `₹${randomGap.toLocaleString()}`;

  return {
    id: `run-${Date.now()}`,
    fields: [
      { id: 'f1', value: isLease ? 'Security Deposit' : 'MRI Scan', bbox: [10, 20, 30, 5], low_conf: false },
      { id: 'f2', value: randomGap.toString(), bbox: [70, 20, 15, 5], low_conf: true }
    ],
    proofs: [
      {
        id: 'p1',
        status: 'gap',
        itemName: isLease ? 'Security Deposit Limit' : 'MRI Scan',
        sourceLabel: isLease ? 'Your Lease' : 'Your Bill',
        sourceValue: isLease ? '₹15,000' : '₹45,000',
        sourceRef: captureType === 'text' ? 'Paragraph 2' : 'Line 47 · OCR 97%',
        computeLabel: 'Gap',
        computeValue: gapStr,
        computeMath: isLease ? '15000 - 10000' : '45000 - 18000',
        ruleLabel: 'Official Rate',
        ruleValue: isLease ? '₹10,000' : '₹18,000',
        ruleRefText: isLease ? 'Rent Act Sec. 4' : 'CGHS 2024 Entry 214',
        summaryText: isLease
          ? `"The law caps security deposits at 2 months' rent. You were charged 3 months — an illegal ${gapStr} gap."`
          : `"CGHS caps MRI at ₹18,000. You were charged ₹45,000 — a ${gapStr} overcharge."`
      }
    ],
    hold: {
      status: 'staged',
      amount: gapStr
    },
    draftText: isLease
      ? `To Landlord,\n\nAccording to Rent Act Sec. 4, the maximum allowable security deposit is 2 months' rent (₹10,000). I was charged ₹15,000, resulting in an illegal ₹5,000 overcharge.\n\nPlease refund this immediately.`
      : `To Hospital Administration,\n\nI am writing regarding invoice #892. According to CGHS 2024 guidelines (Entry 214), the maximum allowable charge for an MRI Scan is ₹18,000. I was charged ₹45,000, resulting in a ₹27,000 overcharge.\n\nPlease rectify this immediately.`,
    draftBanner: 'AI-generated — review before sending',
    audit: [
      { id: 'a1', ts: new Date(Date.now() - 5000), t: captureType === 'text' ? 'ocr' : 'ocr', payload: `Extracted ${textLen || 42} characters/entities.` },
      { id: 'a2', ts: new Date(Date.now() - 4000), t: 'lookup', payload: `Found ${isLease ? 'Rent Act' : 'CGHS'} entry.` },
      { id: 'a3', ts: new Date(Date.now() - 3000), t: 'compare', payload: `Gaps computed.` },
      { id: 'a4', ts: new Date(Date.now() - 2000), t: 'prove', payload: `Proof cards built.` },
      { id: 'a5', ts: new Date(Date.now() - 1000), t: 'hold_staged', payload: `Hold staged — low confidence field detected.` },
      { id: 'a6', ts: new Date(Date.now() - 500), t: 'draft', payload: `Dispute letter drafted by IBM Granite.` },
    ]
  };
};

export const mockConsentResponse = (action: string) => {
  return {
    audit: {
      id: `a-${Date.now()}`,
      ts: new Date(),
      t: 'consent',
      payload: `User performed: ${action}`
    } as AuditEvent
  };
};
