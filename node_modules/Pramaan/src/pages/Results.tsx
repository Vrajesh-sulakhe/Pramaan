import React, { useEffect, useState } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { ChevronLeft, TriangleAlert, Lock, Unlock, RotateCcw, Send, FileSpreadsheet, Eye, ShieldCheck, Clock, FileText, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { fetchRun, consent, fetchAudit } from '../data/dataSource';
import { RunResponse, AuditEvent } from '../data/mockRun';
import { BBoxOverlay } from '../components/BBoxOverlay';

export const Results: React.FC = () => {
  const [data, setData] = useState<RunResponse | null>(null);
  const [viewMode, setViewMode] = useState<'proofs' | 'ocr' | 'letter'>('proofs');
  const { state, resetSession, saveToVault, updateVaultItemHold } = useSession();
  const history = useHistory();

  useEffect(() => {
    fetchRun({ domain: state.domain, captureType: state.captureType, captureData: state.captureData }).then((res) => {
      setData(res);
      console.log('[Results] RunResponse received:', res);

      // Auto-sync into persistent vault
      const gapProofs = res.proofs.filter((p) => p.status === 'gap');
      const numVal = res.hold ? parseInt(res.hold.amount.replace(/[^0-9]/g, ''), 10) || 0 : 0;

      saveToVault({
        id: res.id,
        title: state.domain === 'bill' ? 'Hospital Invoice #8921 — Radiology' : 'Residential Lease Agreement',
        domain: state.domain,
        captureType: state.captureType,
        captureData: state.captureData,
        createdAt: new Date().toISOString(),
        disputedAmount: res.hold?.amount ?? '₹0',
        disputedNumber: numVal,
        holdStatus: res.hold?.status ?? 'released',
        proofsCount: res.proofs.length,
        gapCount: gapProofs.length,
        hash: `0x${res.id.slice(-8)}a91e`,
        summary: gapProofs.length > 0 ? gapProofs[0].summaryText : 'All amounts match statutory ceilings.',
      });
    }).catch(err => {
      console.error('[Results] fetchRun failed:', err);
    });
  }, []);

  // V-6: re-fetch audit after consent
  const refreshAudit = async (runId: string) => {
    const events = await fetchAudit(runId);
    if (events.length > 0) {
      setData(prev => prev ? { ...prev, audit: events } : prev);
    }
  };

  // V-4: consent handlers — POST /consent, then refresh audit
  const handleHold = async () => {
    if (!data || data.hold?.status !== 'staged') return;
    const res = await consent(data.id, 'confirm_hold');
    setData({ ...data, hold: { ...data.hold!, status: 'placed' }, audit: [...data.audit, res.audit] });
    updateVaultItemHold(data.id, 'placed');
    await refreshAudit(data.id);
  };

  const handleWithdraw = async () => {
    if (!data || data.hold?.status !== 'placed') return;
    const res = await consent(data.id, 'withdraw_hold');
    setData({ ...data, hold: { ...data.hold!, status: 'released' }, audit: [...data.audit, res.audit] });
    updateVaultItemHold(data.id, 'released');
    await refreshAudit(data.id);
  };

  const handleSendLetter = async () => {
    if (!data) return;
    const res = await consent(data.id, 'send_letter');
    setData({ ...data, audit: [...data.audit, res.audit] });
    await refreshAudit(data.id);
  };

  const back = () => { resetSession(); history.push('/dashboard'); };

  const gapCount = data?.proofs.filter(p => p.status === 'gap').length ?? 0;
  // V-4: null-safe hold status checks
  const isStaged = data?.hold?.status === 'staged';
  const isPlaced = data?.hold?.status === 'placed';
  const hasHold = data?.hold != null;
  const hasDraft = !!data?.draftText;

  return (
    <IonPage>
      <IonContent fullscreen scrollX={false} scrollY={true}>
        <div className="mobile-shell" style={{ paddingBottom: isPlaced ? 180 : 120 }}>

          {/* Top Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 'calc(var(--sat) + 12px)',
            paddingLeft: 20,
            paddingRight: 20,
            paddingBottom: 16,
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(5, 5, 8, 0.85)',
            backdropFilter: 'blur(20px)',
            position: 'sticky',
            top: 0,
            zIndex: 30,
          }}>
            <button
              onClick={back}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                borderRadius: 12,
                padding: '8px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: 'var(--c-text-1)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <ChevronLeft size={18} />
              Dashboard
            </button>

            {data && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 11px',
                borderRadius: 20,
                background: gapCount > 0 ? 'var(--c-danger-bg)' : 'var(--c-success-bg)',
                border: `1px solid ${gapCount > 0 ? 'var(--c-danger-border)' : 'var(--c-success-border)'}`,
                color: gapCount > 0 ? 'var(--c-danger)' : 'var(--c-success)',
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.4px',
                textTransform: 'uppercase',
              }}>
                {gapCount > 0 ? `${gapCount} Discrepancy Found` : '100% Compliant'}
              </span>
            )}
          </div>

          {/* Loading State */}
          {!data && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 48 }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(255, 255, 255, 0.6)', borderTopColor: 'transparent' }}
              />
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-text-2)', margin: 0 }}>Finalizing verification report…</p>
            </div>
          )}

          {data && (
            <div>
              {/* Hero Banner */}
              <div style={{ padding: '16px 20px 0' }}>
                <div style={{
                  background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%)',
                  border: `1px solid ${gapCount > 0 ? 'var(--c-danger-border)' : 'var(--c-success-border)'}`,
                  boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: 20,
                  padding: 22,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    {gapCount > 0 ? <TriangleAlert size={18} color="var(--c-danger)" /> : <ShieldCheck size={18} color="var(--c-success)" />}
                    <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', color: gapCount > 0 ? 'var(--c-danger)' : 'var(--c-success)' }}>
                      {gapCount > 0 ? 'Statutory Overcharge Detected' : 'Deterministic Audit Passed'}
                    </span>
                  </div>

                  <div style={{ fontSize: 30, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.8px', lineHeight: 1.1, marginBottom: 8, fontFamily: 'IBM Plex Mono, monospace' }}>
                    {/* V-4: null hold → ₹0 gap, not an error */}
                    {gapCount > 0 ? `${data.hold?.amount ?? '₹0'} Disputed Gap` : '₹0 Gap Detected'}
                  </div>

                  <p style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--c-text-2)', margin: 0 }}>
                    {gapCount > 0
                      ? 'Statutory rate schedule violated. A 72-hour reversible protection hold and dispute letter are ready.'
                      : 'All charges match government tariff schedules perfectly.'}
                  </p>
                </div>
              </div>

              {/* View Mode Switcher */}
              <div style={{ padding: '14px 20px 0' }}>
                <div style={{
                  display: 'flex',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 12,
                  padding: 3,
                  gap: 3,
                }}>
                  {[
                    { id: 'proofs' as const, icon: <FileSpreadsheet size={15} />, label: `Verified Proofs (${data.proofs.length})` },
                    { id: 'ocr' as const, icon: <Eye size={15} />, label: 'OCR Scanner' },
                    { id: 'letter' as const, icon: <FileText size={15} />, label: 'Notice Letter' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setViewMode(tab.id)}
                      style={{
                        flex: 1,
                        height: 38,
                        borderRadius: 9,
                        fontSize: 12,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 5,
                        cursor: 'pointer',
                        border: viewMode === tab.id ? '1px solid rgba(255, 255, 255, 0.16)' : '1px solid transparent',
                        background: viewMode === tab.id ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                        color: viewMode === tab.id ? '#ffffff' : 'var(--c-text-3)',
                      }}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Content Pane */}
              <div style={{ padding: '14px 20px 0' }}>

                {/* V-3: BBox Overlay with yellow confidence gate */}
                {viewMode === 'ocr' && (
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.035)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
                    borderRadius: 18,
                    overflow: 'hidden',
                  }}>
                    <BBoxOverlay
                      captureType={state.captureType}
                      captureData={state.captureData}
                      fields={data.fields}
                    />
                  </div>
                )}

                {/* V-5: Granite draft + mandatory AI banner */}
                {viewMode === 'letter' && (
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.035)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
                    borderRadius: 18,
                    padding: 18,
                  }}>
                    {/* MANDATORY AI banner — non-negotiable per IBM Granite usage policy */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 14,
                      padding: '8px 12px',
                      borderRadius: 10,
                      background: 'rgba(251, 191, 36, 0.1)',
                      border: '1px solid rgba(251, 191, 36, 0.3)',
                    }}>
                      <span style={{ fontSize: 14 }}>⚠️</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-warn)' }}>
                        {data.draftBanner || 'AI-generated — review before sending'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <CheckCircle2 size={16} color="var(--c-success)" />
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#ffffff' }}>Statutory Notice Draft</span>
                    </div>
                    {/* V-5: render draft verbatim; no draft → "No draft available" state */}
                    {data.draftText ? (
                      <pre style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: 13,
                        lineHeight: 1.6,
                        color: 'var(--c-text-2)',
                        whiteSpace: 'pre-wrap',
                        margin: 0,
                      }}>
                        {data.draftText}
                      </pre>
                    ) : (
                      <p style={{ fontSize: 13, color: 'var(--c-text-3)', margin: 0, fontStyle: 'italic' }}>
                        No draft available.
                      </p>
                    )}
                  </div>
                )}

                {/* V-2: Proof cards with color logic + empty state */}
                {viewMode === 'proofs' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* V-2: empty proof_cards[] → "No issues found", not an error */}
                    {data.proofs.length === 0 && (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 12,
                        padding: '40px 20px',
                        background: 'rgba(52, 211, 153, 0.06)',
                        border: '1px solid var(--c-success-border)',
                        borderRadius: 18,
                      }}>
                        <ShieldCheck size={36} color="var(--c-success)" />
                        <p style={{ fontSize: 15, fontWeight: 800, color: '#ffffff', margin: 0 }}>No issues found</p>
                        <p style={{ fontSize: 13, color: 'var(--c-text-2)', margin: 0, textAlign: 'center' }}>
                          All charges match government tariff schedules. Nothing to dispute.
                        </p>
                      </div>
                    )}

                    {data.proofs.map((proof, i) => {
                      // V-2: color logic — gap=RED, ok=GREEN, unverified=GREY
                      const statusColor =
                        proof.status === 'gap' ? 'var(--c-danger)' :
                        proof.status === 'ok' ? 'var(--c-success)' :
                        'var(--c-text-3)';
                      const statusBorder =
                        proof.status === 'gap' ? 'var(--c-danger-border)' :
                        proof.status === 'ok' ? 'var(--c-success-border)' :
                        'rgba(255, 255, 255, 0.1)';
                      const statusBg =
                        proof.status === 'gap' ? 'var(--c-danger-bg)' :
                        proof.status === 'ok' ? 'var(--c-success-bg)' :
                        'rgba(255, 255, 255, 0.05)';
                      const statusLabel =
                        proof.status === 'gap' ? 'OVERCHARGE' :
                        proof.status === 'ok' ? 'VERIFIED' :
                        'UNVERIFIED';

                      return (
                        <motion.div
                          key={proof.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.06 }}
                          style={{
                            background: 'rgba(255, 255, 255, 0.035)',
                            border: `1px solid ${statusBorder}`,
                            boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
                            backdropFilter: 'blur(20px)',
                            borderRadius: 18,
                            padding: 18,
                            position: 'relative',
                            overflow: 'hidden',
                          }}
                        >
                          {/* Color strip at top */}
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: 3,
                            background: statusColor,
                          }} />

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <span style={{ fontSize: 15, fontWeight: 800, color: '#ffffff' }}>
                              {proof.itemName}
                            </span>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: 10,
                              background: statusBg,
                              color: statusColor,
                              fontSize: 10,
                              fontWeight: 800,
                              letterSpacing: '0.4px',
                              textTransform: 'uppercase',
                            }}>
                              {statusLabel}
                            </span>
                          </div>

                          {/* 3-Column Comparison Grid */}
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr 1fr',
                            gap: 6,
                            background: 'rgba(0, 0, 0, 0.4)',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            padding: 12,
                            borderRadius: 12,
                            marginBottom: 12,
                            textAlign: 'center',
                          }}>
                            {/* Source anchor */}
                            <div style={{ textAlign: 'left' }}>
                              <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', color: 'var(--c-text-3)', display: 'block', marginBottom: 2 }}>
                                {proof.sourceLabel}
                              </span>
                              <span style={{ fontSize: 16, fontWeight: 900, color: '#ffffff', fontFamily: 'IBM Plex Mono, monospace' }}>
                                {proof.sourceValue}
                              </span>
                              {/* V-2: clickable source anchor */}
                              {proof.sourceRefUrl ? (
                                <a href={proof.sourceRefUrl} target="_blank" rel="noreferrer"
                                  style={{ fontSize: 10, color: 'var(--c-text-3)', display: 'block', marginTop: 1, textDecoration: 'underline' }}>
                                  {proof.sourceRef}
                                </a>
                              ) : (
                                <span style={{ fontSize: 10, color: 'var(--c-text-3)', display: 'block', marginTop: 1 }}>
                                  {proof.sourceRef}
                                </span>
                              )}
                            </div>

                            {/* Gap / compute column */}
                            <div>
                              <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', color: 'var(--c-text-3)', display: 'block', marginBottom: 2 }}>
                                {proof.computeLabel}
                              </span>
                              <span style={{ fontSize: 16, fontWeight: 900, color: statusColor, fontFamily: 'IBM Plex Mono, monospace' }}>
                                {proof.computeValue}
                              </span>
                              {proof.computeMath && (
                                <span style={{ fontSize: 9, fontFamily: 'IBM Plex Mono, monospace', color: 'var(--c-text-3)', display: 'block', marginTop: 1 }}>
                                  {proof.computeMath}
                                </span>
                              )}
                            </div>

                            {/* Rule anchor */}
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', color: 'var(--c-text-3)', display: 'block', marginBottom: 2 }}>
                                {proof.ruleLabel}
                              </span>
                              <span style={{ fontSize: 16, fontWeight: 900, color: '#ffffff', fontFamily: 'IBM Plex Mono, monospace' }}>
                                {proof.ruleValue}
                              </span>
                              {/* V-2: clickable rule anchor */}
                              {proof.ruleRefUrl ? (
                                <a href={proof.ruleRefUrl} target="_blank" rel="noreferrer"
                                  style={{ fontSize: 10, color: 'var(--c-text-2)', textDecoration: 'underline', display: 'block', marginTop: 1 }}>
                                  {proof.ruleRefText}
                                </a>
                              ) : (
                                <span style={{ fontSize: 10, color: 'var(--c-text-2)', textDecoration: 'underline', display: 'block', marginTop: 1 }}>
                                  {proof.ruleRefText}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* V-2: rule_says_plain — human-readable rule line from Manas */}
                          <p style={{
                            fontSize: 12,
                            lineHeight: 1.55,
                            color: 'var(--c-text-2)',
                            margin: 0,
                            paddingLeft: 10,
                            borderLeft: `2px solid ${statusColor}`,
                          }}>
                            {proof.summaryText}
                          </p>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* V-6: Audit Trail Timeline */}
              <AuditTrail audit={data.audit} />
            </div>
          )}

          {/* V-4: Sticky Bottom Protective Action Bar */}
          {data && (
            <div style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              margin: '0 auto',
              maxWidth: 440,
              padding: '14px 20px',
              paddingBottom: 'calc(var(--sab) + 12px)',
              background: 'rgba(5, 5, 8, 0.92)',
              borderTop: '1px solid rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              zIndex: 100,
            }}>

              {/* V-4: hold === null → "No hold" grey chip */}
              {!hasHold && (
                <div style={{
                  width: '100%',
                  padding: '10px 16px',
                  borderRadius: 14,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheck size={18} color="var(--c-text-3)" />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--c-text-2)' }}>No hold</div>
                    <div style={{ fontSize: 11, color: 'var(--c-text-3)' }}>No dispute hold required</div>
                  </div>
                </div>
              )}

              {/* V-4: hold.status staged → amber "Confirm Hold" */}
              {isStaged && (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleHold}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 14,
                    border: '1px solid var(--c-warn-border)',
                    background: 'rgba(251, 191, 36, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--c-warn)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#050508' }}>
                      <Unlock size={18} strokeWidth={2.4} />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 15, fontWeight: 900, color: '#ffffff', fontFamily: 'IBM Plex Mono, monospace' }}>
                        {data.hold?.amount} Disputed
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--c-text-2)' }}>
                        Staged — tap to confirm hold
                      </div>
                    </div>
                  </div>
                  <Lock size={18} color="var(--c-warn)" />
                </motion.button>
              )}

              {/* V-4: hold.status placed → green "Frozen — Withdraw" */}
              {isPlaced && (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleWithdraw}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 14,
                    border: '1px solid var(--c-success-border)',
                    background: 'rgba(52, 211, 153, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--c-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#050508' }}>
                      <Lock size={18} strokeWidth={2.4} />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 15, fontWeight: 900, color: '#ffffff', fontFamily: 'IBM Plex Mono, monospace' }}>
                        {data.hold?.amount} Frozen
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--c-text-2)' }}>
                        Frozen — auto-releases in 72h · tap to withdraw
                      </div>
                    </div>
                  </div>
                  <Unlock size={18} color="var(--c-success)" />
                </motion.button>
              )}

              {/* V-4: Send Letter — always show if draft exists */}
              {hasDraft && (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSendLetter}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 14,
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    background: 'rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    color: '#ffffff',
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  <Send size={16} />
                  Send Letter
                </motion.button>
              )}
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

// ─── V-6: Inline Audit Trail Timeline ────────────────────────────────────────
const AUDIT_LABELS: Record<string, string> = {
  ocr:          'Document scanned',
  lookup:       'Rules matched',
  compare:      'Gaps computed',
  prove:        'Proof cards built',
  hold_placed:  'Hold placed (auto)',
  hold_staged:  'Hold staged (low confidence)',
  consent:      'User confirmed/withdrew/sent',
  draft:        'Letter drafted',
};

const AuditTrail: React.FC<{ audit: AuditEvent[] }> = ({ audit }) => (
  <div style={{ padding: '16px 20px 0' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
      <Clock size={13} color="var(--c-text-3)" />
      <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--c-text-3)', margin: 0 }}>
        Governance Audit Trail
      </p>
    </div>

    <div style={{
      background: 'rgba(255, 255, 255, 0.035)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)',
      borderRadius: 14,
      padding: '8px 14px',
    }}>
      {audit.length === 0 && (
        <p style={{ fontSize: 12, color: 'var(--c-text-3)', margin: '8px 0', fontStyle: 'italic' }}>No audit events yet.</p>
      )}
      {audit.map((ev, i) => (
        <div key={ev.id} style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '10px 0',
          borderBottom: i < audit.length - 1 ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flex: 1, minWidth: 0, paddingRight: 10 }}>
            {/* Timeline dot */}
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: ev.t === 'consent' ? 'var(--c-success)' : ev.t.startsWith('hold') ? 'var(--c-warn)' : 'rgba(255, 255, 255, 0.4)',
              flexShrink: 0,
              marginTop: 3,
            }} />
            <div>
              {/* V-6: human-readable label from the t: mapping */}
              <span style={{ fontSize: 11, fontWeight: 700, color: '#ffffff', display: 'block' }}>
                {AUDIT_LABELS[ev.t] ?? ev.t}
              </span>
              <p style={{ fontSize: 11, color: 'var(--c-text-2)', margin: '2px 0 0 0' }}>
                {ev.payload}
              </p>
            </div>
          </div>
          <span style={{ fontSize: 10, color: 'var(--c-text-3)', fontFamily: 'IBM Plex Mono, monospace', flexShrink: 0 }}>
            {new Date(ev.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      ))}
    </div>
  </div>
);
