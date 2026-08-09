// apps/mobile/src/data/mockRun.ts
// UI-side RunResponse type + 6-Domain Multi-Regulatory Dynamic Engine.
// This type is the ONLY shape the UI ever sees — dataSource.ts maps from engine contract.

import { AuditEvent } from '../components/AuditViewer';
export type { AuditEvent };
import { BBoxField } from '../components/BBoxOverlay';
import { ProofStatus } from '../components/ProofCard';
import { HoldStatus } from '../components/HoldChip';
import { Domain } from '../context/SessionContext';

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
    sourceRefUrl?: string;       // Clickable source anchor link
    computeLabel: string;
    computeValue: string;
    computeMath?: string;
    ruleLabel: string;
    ruleValue: string;
    ruleRefText: string;
    ruleRefUrl?: string;         // Clickable rule anchor link
    summaryText: string;         // Plain language rule citation
  }[];
  hold: {
    status: HoldStatus;
    amount: string;
  } | null;
  draftText: string;
  draftBanner: string;
  audit: AuditEvent[];
}

export const generateDynamicMockRun = (domain: Domain, captureType: string | null, captureData: string | null): RunResponse => {
  const rawText = (captureData || '').trim();
  const lowerText = rawText.toLowerCase();

  // Extract all numbers from text
  const allNumbers = (rawText.match(/(?:₹|Rs\.?|INR)?\s*([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{1,7})/gi) || [])
    .map(n => parseInt(n.replace(/[^0-9]/g, ''), 10))
    .filter(n => n > 0);

  let sourceVal = 0;
  let ruleVal = 0;
  let gapVal = 0;
  let itemName = 'Statutory Evidence Item';
  let sourceLabel = 'Your Document';
  let refText = 'Government Regulatory Gazette';
  let ruleRefUrl = 'https://indiacode.nic.in';
  let draftNotice = '';

  const currentDateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. RENTAL LEASE DOMAIN (Model Tenancy Act 2021)
  // ═══════════════════════════════════════════════════════════════════════════
  if (domain === 'lease') {
    const rentMatch = rawText.match(/(?:rent|monthly)\s*[:=-]?\s*(?:₹|Rs\.?|INR)?\s*([0-9,]+)/i);
    const depositMatch = rawText.match(/(?:deposit|security)\s*[:=-]?\s*(?:₹|Rs\.?|INR)?\s*([0-9,]+)/i);

    let monthlyRent = 35000;
    if (rentMatch && rentMatch[1]) {
      monthlyRent = parseInt(rentMatch[1].replace(/,/g, ''), 10) || 35000;
    }

    if (depositMatch && depositMatch[1]) {
      sourceVal = parseInt(depositMatch[1].replace(/,/g, ''), 10) || (monthlyRent * 10);
    } else {
      sourceVal = allNumbers.find(n => n >= 20000) || (monthlyRent * 10);
    }

    ruleVal = monthlyRent * 2; // Model Tenancy Act max 2 months ceiling
    gapVal = Math.max(0, sourceVal - ruleVal);
    itemName = 'Residential Security Deposit';
    sourceLabel = 'Draft Lease Agreement';
    refText = 'Model Tenancy Act, 2021 (Section 11(2))';
    ruleRefUrl = 'https://legislative.gov.in/model-tenancy-act';

    draftNotice = `TO: Landlord / Property Manager\nDATE: ${currentDateStr}\nSUBJECT: Proposed Amendments to Draft Rental Agreement\n\nDear Landlord,\n\nThank you for sharing the draft rental agreement. After reviewing the terms against current statutory tenancy regulations under the Model Tenancy Act, 2021 (Section 11(2)), I found a clause requiring mandatory amendment:\n\n- Draft Clause: Residential Security Deposit\n- Demanded Amount: ₹${sourceVal.toLocaleString('en-IN')}\n- Statutory Legal Ceiling (2 Months' Rent): ₹${ruleVal.toLocaleString('en-IN')}\n- Unlawful Disputed Excess: ₹${gapVal.toLocaleString('en-IN')}\n\nTo ensure the lease agreement remains legally binding and compliant with statutory law, please replace the existing deposit clause with the statutory two-month ceiling of ₹${ruleVal.toLocaleString('en-IN')}.\n\nSincerely,\nTenant`;

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. GIG PAYSLIP DOMAIN (Motor Vehicle Aggregator Guidelines 2025)
  // ═══════════════════════════════════════════════════════════════════════════
  } else if (domain === 'gig_payslip') {
    const fareMatch = rawText.match(/(?:fare|gross|customer fare|total trip)\s*[:=-]?\s*(?:₹|Rs\.?|INR)?\s*([0-9,]+)/i);
    const payoutMatch = rawText.match(/(?:payout|paid|driver share|net earning)\s*[:=-]?\s*(?:₹|Rs\.?|INR)?\s*([0-9,]+)/i);

    let grossFare = 5000;
    if (fareMatch && fareMatch[1]) {
      grossFare = parseInt(fareMatch[1].replace(/,/g, ''), 10) || 5000;
    } else {
      grossFare = allNumbers.find(n => n >= 3000) || 5000;
    }

    if (payoutMatch && payoutMatch[1]) {
      sourceVal = parseInt(payoutMatch[1].replace(/,/g, ''), 10) || Math.round(grossFare * 0.56);
    } else {
      sourceVal = allNumbers.find(n => n < grossFare && n >= 1000) || Math.round(grossFare * 0.56);
    }

    ruleVal = Math.round(grossFare * 0.80); // MoRTH Clause 17 mandates min 80% driver share
    gapVal = Math.max(0, ruleVal - sourceVal);
    itemName = 'Driver Minimum Fare Payout (80% Share)';
    sourceLabel = 'Aggregator Payslip / Settlement';
    refText = 'Motor Vehicle Aggregator Guidelines 2025 (Clause 17(1))';
    ruleRefUrl = 'https://morth.nic.in/motor-vehicle-aggregator-guidelines-2025';

    draftNotice = `TO: Driver Grievance Cell / Platform Operations\nDATE: ${currentDateStr}\nSUBJECT: FORMAL DISPUTE OF TRIP PAYOUT UNDER AGGREGATOR GUIDELINES 2025\n\nDear Team,\n\nI am writing to formally dispute the fare split and remuneration on the attached settlement statement. Under Clause 17(1) of the Motor Vehicle Aggregator Guidelines, 2025 (MoRTH), the driver is entitled to receive not less than eighty percent (80%) of the total customer fare for each journey undertaken:\n\n- Total Passenger Fare Billed: ₹${grossFare.toLocaleString('en-IN')}\n- Driver Remuneration Credited: ₹${sourceVal.toLocaleString('en-IN')} (${Math.round((sourceVal / grossFare) * 100)}%)\n- Statutory Minimum Driver Payout (80%): ₹${ruleVal.toLocaleString('en-IN')}\n- Unlawful Underpayment Shortfall: ₹${gapVal.toLocaleString('en-IN')}\n\nPlease credit the statutory difference of ₹${gapVal.toLocaleString('en-IN')} to my registered payout wallet within 72 hours.\n\nSincerely,\nPartner Driver`;

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. INSURANCE CLAIMS DOMAIN (IRDAI Master Circulars 2024)
  // ═══════════════════════════════════════════════════════════════════════════
  } else if (domain === 'insurance') {
    const claimMatch = rawText.match(/(?:claim|total claim|hospital bill)\s*[:=-]?\s*(?:₹|Rs\.?|INR)?\s*([0-9,]+)/i);
    const approvedMatch = rawText.match(/(?:approved|settled|disbursed)\s*[:=-]?\s*(?:₹|Rs\.?|INR)?\s*([0-9,]+)/i);

    let totalClaim = 120000;
    if (claimMatch && claimMatch[1]) {
      totalClaim = parseInt(claimMatch[1].replace(/,/g, ''), 10) || 120000;
    } else {
      totalClaim = allNumbers.find(n => n >= 50000) || 120000;
    }

    let approvedAmount = 85000;
    if (approvedMatch && approvedMatch[1]) {
      approvedAmount = parseInt(approvedMatch[1].replace(/,/g, ''), 10) || (totalClaim - 35000);
    } else {
      approvedAmount = allNumbers.find(n => n < totalClaim && n >= 20000) || (totalClaim - 35000);
    }

    sourceVal = totalClaim - approvedAmount; // Disputed deduction
    ruleVal = 0; // Statutory allowable non-medical deduction
    gapVal = sourceVal;
    itemName = 'Disallowed Room Rent / Proportionate Claim Deduction';
    sourceLabel = 'TPA Claim Settlement Summary';
    refText = 'IRDAI Master Circular on Health Insurance Business, 2024 (Clause 14)';
    ruleRefUrl = 'https://irdai.gov.in';

    draftNotice = `TO: Grievance Redressal Officer (GRO) & Insurance Ombudsman\nDATE: ${currentDateStr}\nSUBJECT: FORMAL DISPUTE OF UNLAWFUL CLAIM DEDUCTION / DENIAL\n\nDear Sir/Madam,\n\nI am writing to register a formal complaint against the arbitrary claim deduction on the above policy. Under the IRDAI Master Circular on Health Insurance Business (2024) and Section 45 of the Insurance Act 1938:\n\n- Total Hospital Claim Incurred: ₹${totalClaim.toLocaleString('en-IN')}\n- Amount Approved by Insurer: ₹${approvedAmount.toLocaleString('en-IN')}\n- Disallowed Deductions: ₹${gapVal.toLocaleString('en-IN')}\n- Statutory Assessment: Unlawful proportionate deduction not justified under standard exclusions.\n\nPlease reprocess and disburse the retained balance of ₹${gapVal.toLocaleString('en-IN')} within 15 days, failing which this matter will be escalated to the Insurance Ombudsman under Ombudsman Rules 2017.\n\nSincerely,\nPolicyholder`;

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. MEDICINE & NSQ SAFETY DOMAIN (NPPA DPCO & CDSCO Alerts)
  // ═══════════════════════════════════════════════════════════════════════════
  } else if (domain === 'medicine') {
    if (lowerText.includes('azithromycin') || lowerText.includes('ayc-2407')) {
      itemName = 'Azithromycin Tablets IP 500mg (Batch AYC-2407)';
      sourceVal = 185;
      ruleVal = 0; // NSQ Recall - Not of Standard Quality
      gapVal = 185;
      refText = 'CDSCO NSQ Recall Alert (June 2025 — Failed Assay / Dissolution)';
      ruleRefUrl = 'https://cdsco.gov.in';
    } else if (lowerText.includes('paracetamol') || lowerText.includes('dolo') || lowerText.includes('crocin')) {
      itemName = 'Paracetamol 650mg Tablets (Strip of 10)';
      sourceVal = allNumbers.find(n => n > 25) || 45;
      ruleVal = 22; // DPCO ceiling ₹2.15/tab * 10
      gapVal = Math.max(0, sourceVal - ruleVal);
      refText = 'NPPA Drug Price Control Order (DPCO 2013 / Jan 2026 List)';
      ruleRefUrl = 'https://nppa.gov.in';
    } else {
      itemName = 'Essential Prescription Medicines / Consumables';
      sourceVal = allNumbers.find(n => n > 50) || 1250;
      ruleVal = Math.round(sourceVal * 0.35);
      gapVal = Math.max(0, sourceVal - ruleVal);
      refText = 'NPPA Scheduled Drug Price Capping & Legal Metrology Act';
      ruleRefUrl = 'https://nppa.gov.in';
    }

    sourceLabel = 'Pharmacy Cash Memo / Bill';
    draftNotice = `TO: State Drugs Controller / Pharmacy Grievance Desk\nDATE: ${currentDateStr}\nSUBJECT: FORMAL COMPLAINT OF DRUG OVERCHARGING / NSQ BATCH DISPENSATION\n\nDear Sir/Madam,\n\nI am reporting a statutory violation regarding medicines dispensed at the pharmacy. Under the Drugs (Prices Control) Order, 2013 read with the Essential Commodities Act, 1955 and CDSCO Safety Notifications:\n\n- Drug Name: ${itemName}\n- Price Charged at Counter: ₹${sourceVal.toLocaleString('en-IN')}\n- Statutory NPPA Ceiling / Permitted Price: ₹${ruleVal.toLocaleString('en-IN')}\n- Illegal Overcharge / Disputed Gap: ₹${gapVal.toLocaleString('en-IN')}\n- Safety / Regulatory Reference: ${refText}\n\nPlease issue an immediate refund of the overcharge (₹${gapVal.toLocaleString('en-IN')}) and inspect the inventory batch for regulatory compliance.\n\nSincerely,\nConsumer`;

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. TRAFFIC CHALLAN DOMAIN (Motor Vehicles Act 1988 Sec 136A/159)
  // ═══════════════════════════════════════════════════════════════════════════
  } else if (domain === 'challan') {
    const fineMatch = rawText.match(/(?:fine|penalty|amount|challan amount)\s*[:=-]?\s*(?:₹|Rs\.?|INR)?\s*([0-9,]+)/i);
    sourceVal = fineMatch && fineMatch[1] ? (parseInt(fineMatch[1].replace(/,/g, ''), 10) || 2000) : (allNumbers.find(n => n >= 500) || 2000);
    ruleVal = 0; // Disputed in full due to lack of mandatory statutory certificate
    gapVal = sourceVal;
    itemName = 'Automated Speed Violation Notice (Sec 183 MV Act)';
    sourceLabel = 'Traffic e-Challan Notice';
    refText = 'Motor Vehicles Act, 1988 (Section 136A & Rule 167A)';
    ruleRefUrl = 'https://echallan.parivahan.gov.in';

    draftNotice = `TO: The Traffic Police Commissioner / Virtual Court\nDATE: ${currentDateStr}\nSUBJECT: OBJECTION AND CONTEST OF E-CHALLAN UNDER SECTION 136A OF MV ACT\n\nDear Sir/Madam,\n\nI am writing to formally contest the e-challan notice. Under Section 136A of the Motor Vehicles Act, 1988 and Rule 167A of the Central Motor Vehicles Rules, electronic enforcement devices must be accompanied by mandatory calibration certificates and clear visual photographic proof:\n\n- Challan Penalty Demanded: ₹${sourceVal.toLocaleString('en-IN')}\n- Statutory Assessment: Defective notice lacking statutory calibration seal and timestamped radar certificate.\n- Disputed Fine: ₹${gapVal.toLocaleString('en-IN')}\n\nKindly review and cancel the defective e-challan or schedule the matter before the Virtual Court.\n\nSincerely,\nVehicle Owner`;

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. MEDICAL BILL DOMAIN (CGHS Tariff Schedules & Clinical Establishments)
  // ═══════════════════════════════════════════════════════════════════════════
  } else {
    if (lowerText.includes('mri')) {
      itemName = 'Brain MRI 3.0T with Contrast';
      refText = 'CGHS Rate Card 2024 (Schedule II #214)';
      ruleVal = 6400;
      sourceVal = allNumbers.find(n => n > 6400) || 8500;
    } else if (lowerText.includes('paracetamol') || lowerText.includes('dolo') || lowerText.includes('crocin')) {
      itemName = 'Paracetamol 650mg Tablets x 10';
      refText = 'NPPA DPCO 2013 Drug Price Ceiling Notification';
      ruleVal = 20;
      sourceVal = allNumbers.find(n => n > 20) || 45;
    } else if (lowerText.includes('cbc') || lowerText.includes('blood count')) {
      itemName = 'Complete Blood Count (CBC / Haemogram)';
      refText = 'CGHS Rate Card 2024 (Pathology #48)';
      ruleVal = 150;
      sourceVal = 150;
    } else {
      itemName = 'Hospital Diagnostic & Consumable Line Items';
      ruleVal = 18000;
      sourceVal = allNumbers.find(n => n > 18000) || 45000;
    }

    gapVal = Math.max(0, sourceVal - ruleVal);
    sourceLabel = 'Hospital Invoice Statement';
    ruleRefUrl = 'https://cghs.gov.in';

    draftNotice = `TO: The Billing Manager / Medical Superintendent\nDATE: ${currentDateStr}\nSUBJECT: FORMAL DISPUTE OF INVOICE CHARGES FOR ${itemName.toUpperCase()}\n\nDear Sir/Madam,\n\nI am writing to formally dispute specific line item charges on the above-referenced invoice. Under statutory government guidelines (${refText}), the maximum allowable price ceiling for ${itemName} is ₹${ruleVal.toLocaleString('en-IN')}.\n\nYour hospital has billed ₹${sourceVal.toLocaleString('en-IN')}, resulting in an illegal overcharge of ₹${gapVal.toLocaleString('en-IN')}.\n\nA provisional protection hold of ₹${gapVal.toLocaleString('en-IN')} has been placed. Please issue an amended invoice reflecting the statutory rate ceiling.\n\nSincerely,\nPatient`;
  }

  const gapStr = `₹${gapVal.toLocaleString('en-IN')}`;
  const sourceStr = `₹${sourceVal.toLocaleString('en-IN')}`;
  const ruleStr = `₹${ruleVal.toLocaleString('en-IN')}`;

  const summary = gapVal > 0
    ? `Under ${refText}, the statutory ceiling for ${itemName} is ${ruleStr}. The document specifies ${sourceStr}, creating a legally actionable gap of ${gapStr}.`
    : `All verified terms and charges for ${itemName} comply 100% with ${refText}.`;

  return {
    id: `run-${Date.now()}`,
    fields: [
      { id: 'f1', value: itemName, bbox: [10, 20, 30, 5], low_conf: false },
      { id: 'f2', value: sourceStr, bbox: [50, 20, 15, 5], low_conf: false },
      { id: 'f3', value: gapStr, bbox: [70, 20, 15, 5], low_conf: false },
    ],
    proofs: [
      {
        id: 'p1',
        status: gapVal > 0 ? 'gap' : 'ok',
        itemName: itemName,
        sourceLabel: sourceLabel,
        sourceValue: sourceStr,
        sourceRef: captureType === 'text' ? 'Extracted Line Input' : 'Line 14 · Forensic OCR (98% Conf)',
        sourceRefUrl: ruleRefUrl,
        computeLabel: 'Disputed Gap',
        computeValue: gapStr,
        computeMath: `${sourceStr} - ${ruleStr}`,
        ruleLabel: 'Statutory Ceiling',
        ruleValue: ruleStr,
        ruleRefText: refText,
        ruleRefUrl: ruleRefUrl,
        summaryText: summary,
      },
    ],
    hold: gapVal > 0 ? {
      status: 'placed',
      amount: gapStr,
    } : null,
    draftText: draftNotice,
    draftBanner: 'AI-generated counter-notice draft — review before sending',
    audit: [
      { id: 'a1', ts: new Date(), t: 'ocr', payload: JSON.stringify({ item: itemName, billed: sourceStr }) },
      { id: 'a2', ts: new Date(), t: 'lookup', payload: JSON.stringify({ rule: refText, ceiling: ruleStr }) },
      { id: 'a3', ts: new Date(), t: 'compare', payload: JSON.stringify({ math: `${sourceStr} - ${ruleStr}`, gap: gapStr }) },
      { id: 'a4', ts: new Date(), t: 'prove', payload: JSON.stringify({ status: gapVal > 0 ? 'gap' : 'ok' }) },
      ...(gapVal > 0 ? [{ id: 'a5', ts: new Date(), t: 'hold_placed' as const, payload: JSON.stringify({ amount: gapStr, lock_period: '72h' }) }] : []),
      { id: 'a6', ts: new Date(), t: 'draft', payload: JSON.stringify({ type: 'counter_notice', template_domain: domain }) },
    ],
  };
};

export const mockConsentResponse = (action: 'confirm_hold' | 'withdraw_hold' | 'send_letter'): { audit: AuditEvent } => {
  return {
    audit: {
      id: `audit-${Date.now()}`,
      ts: new Date(),
      t: 'consent',
      payload: JSON.stringify({ action, timestamp: new Date().toISOString() }),
    },
  };
};
