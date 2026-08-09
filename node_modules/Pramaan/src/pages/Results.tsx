import React, { useEffect, useState } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { ChevronLeft, TriangleAlert, Lock, Unlock, RotateCcw, Send, FileSpreadsheet, Eye, ShieldCheck, Clock, FileText, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchRun, consent } from '../data/dataSource';
import { RunResponse } from '../data/mockRun';
import { BBoxOverlay } from '../components/BBoxOverlay';

export const Results: React.FC = () => {
  const [data, setData] = useState<RunResponse | null>(null);
  const [viewMode, setViewMode] = useState<'proofs' | 'ocr' | 'letter'>('proofs');
  const { state, resetSession, saveToVault, updateVaultItemHold } = useSession();
  const history = useHistory();

  useEffect(() => {
    fetchRun({ domain: state.domain, captureType: state.captureType, captureData: state.captureData }).then((res: any) => {
      setData(res);
      // Auto-sync into dynamic persistent Vault
      const gapProofs = res.proofs.filter((p: any) => p.status === 'gap');
      const numMatch = res.hold.amount.replace(/[^0-9]/g, '');
      const numVal = parseInt(numMatch, 10) || 0;

      saveToVault({
        id: res.id,
        title: state.domain === 'bill' ? 'Hospital Invoice #8921 — Radiology' : 'Residential Lease Agreement',
        domain: state.domain,
        captureType: state.captureType,
        captureData: state.captureData,
        createdAt: new Date().toISOString(),
        disputedAmount: res.hold.amount,
        disputedNumber: numVal,
        holdStatus: res.hold.status,
        proofsCount: res.proofs.length,
        gapCount: gapProofs.length,
        hash: `0x${res.id.slice(-8)}a91e`,
        summary: gapProofs.length > 0 ? gapProofs[0].summaryText : 'All amounts match statutory ceilings.',
      });
    });
  }, []);

  const handleHold = async () => {
    if (!data || data.hold.status !== 'staged') return;
    const res = await consent(data.id, 'confirm_hold');
    setData({ ...data, hold: { ...data.hold, status: 'placed' }, audit: [...data.audit, res.audit] });
    updateVaultItemHold(data.id, 'placed');
  };

  const handleWithdraw = async () => {
    if (!data || data.hold.status !== 'placed') return;
    const res = await consent(data.id, 'withdraw_hold');
    setData({ ...data, hold: { ...data.hold, status: 'released' }, audit: [...data.audit, res.audit] });
    updateVaultItemHold(data.id, 'released');
  };

  const back = () => { resetSession(); history.push('/dashboard'); };

  const gapCount = data?.proofs.filter(p => p.status === 'gap').length ?? 0;
  const isStaged = data?.hold.status === 'staged';
  const isPlaced = data?.hold.status === 'placed';

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
                    {gapCount > 0 ? `${data.hold.amount} Disputed Gap` : '₹0 Gap Detected'}
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
                  <button
                    onClick={() => setViewMode('proofs')}
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
                      border: viewMode === 'proofs' ? '1px solid rgba(255, 255, 255, 0.16)' : '1px solid transparent',
                      background: viewMode === 'proofs' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                      color: viewMode === 'proofs' ? '#ffffff' : 'var(--c-text-3)',
                    }}
                  >
                    <FileSpreadsheet size={15} />
                    Verified Proofs ({data.proofs.length})
                  </button>
                  <button
                    onClick={() => setViewMode('ocr')}
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
                      border: viewMode === 'ocr' ? '1px solid rgba(255, 255, 255, 0.16)' : '1px solid transparent',
                      background: viewMode === 'ocr' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                      color: viewMode === 'ocr' ? '#ffffff' : 'var(--c-text-3)',
                    }}
                  >
                    <Eye size={15} />
                    OCR Scanner
                  </button>
                  <button
                    onClick={() => setViewMode('letter')}
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
                      border: viewMode === 'letter' ? '1px solid rgba(255, 255, 255, 0.16)' : '1px solid transparent',
                      background: viewMode === 'letter' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                      color: viewMode === 'letter' ? '#ffffff' : 'var(--c-text-3)',
                    }}
                  >
                    <FileText size={15} />
                    Notice Letter
                  </button>
                </div>
              </div>

              {/* Main Content Pane */}
              <div style={{ padding: '14px 20px 0' }}>
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

                {viewMode === 'letter' && (
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.035)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
                    borderRadius: 18,
                    padding: 18,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <CheckCircle2 size={16} color="var(--c-success)" />
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#ffffff' }}>Statutory Notice Draft</span>
                    </div>
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
                  </div>
                )}

                {viewMode === 'proofs' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {data.proofs.map((proof, i) => (
                      <motion.div
                        key={proof.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        style={{
                          background: 'rgba(255, 255, 255, 0.035)',
                          border: `1px solid ${proof.status === 'gap' ? 'var(--c-danger-border)' : 'rgba(255, 255, 255, 0.1)'}`,
                          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
                          backdropFilter: 'blur(20px)',
                          borderRadius: 18,
                          padding: 18,
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                      >
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: 3,
                          background: proof.status === 'gap' ? 'var(--c-danger)' : 'var(--c-success)',
                        }} />

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                          <span style={{ fontSize: 15, fontWeight: 800, color: '#ffffff' }}>
                            {proof.itemName}
                          </span>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: 10,
                            background: proof.status === 'gap' ? 'var(--c-danger-bg)' : 'var(--c-success-bg)',
                            color: proof.status === 'gap' ? 'var(--c-danger)' : 'var(--c-success)',
                            fontSize: 10,
                            fontWeight: 800,
                            letterSpacing: '0.4px',
                            textTransform: 'uppercase',
                          }}>
                            {proof.status === 'gap' ? 'OVERCHARGE' : 'VERIFIED'}
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
                          <div style={{ textAlign: 'left' }}>
                            <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', color: 'var(--c-text-3)', display: 'block', marginBottom: 2 }}>
                              {proof.sourceLabel}
                            </span>
                            <span style={{ fontSize: 16, fontWeight: 900, color: '#ffffff', fontFamily: 'IBM Plex Mono, monospace' }}>
                              {proof.sourceValue}
                            </span>
                            <span style={{ fontSize: 10, color: 'var(--c-text-3)', display: 'block', marginTop: 1 }}>
                              {proof.sourceRef}
                            </span>
                          </div>

                          <div>
                            <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', color: 'var(--c-text-3)', display: 'block', marginBottom: 2 }}>
                              {proof.computeLabel}
                            </span>
                            <span style={{ fontSize: 16, fontWeight: 900, color: proof.status === 'gap' ? 'var(--c-danger)' : 'var(--c-success)', fontFamily: 'IBM Plex Mono, monospace' }}>
                              {proof.computeValue}
                            </span>
                            {proof.computeMath && (
                              <span style={{ fontSize: 9, fontFamily: 'IBM Plex Mono, monospace', color: 'var(--c-text-3)', display: 'block', marginTop: 1 }}>
                                {proof.computeMath}
                              </span>
                            )}
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', color: 'var(--c-text-3)', display: 'block', marginBottom: 2 }}>
                              {proof.ruleLabel}
                            </span>
                            <span style={{ fontSize: 16, fontWeight: 900, color: '#ffffff', fontFamily: 'IBM Plex Mono, monospace' }}>
                              {proof.ruleValue}
                            </span>
                            <span style={{ fontSize: 10, color: 'var(--c-text-2)', textDecoration: 'underline', display: 'block', marginTop: 1 }}>
                              {proof.ruleRefText}
                            </span>
                          </div>
                        </div>

                        <p style={{
                          fontSize: 12,
                          lineHeight: 1.55,
                          color: 'var(--c-text-2)',
                          margin: 0,
                          paddingLeft: 10,
                          borderLeft: `2px solid ${proof.status === 'gap' ? 'var(--c-danger)' : 'var(--c-success)'}`,
                        }}>
                          {proof.summaryText}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Audit Blockchain Trail */}
              <div style={{ padding: '16px 20px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Clock size={13} color="var(--c-text-3)" />
                  <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--c-text-3)', margin: 0 }}>
                    Deterministic Audit Trail
                  </p>
                </div>

                <div style={{
                  background: 'rgba(255, 255, 255, 0.035)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                  borderRadius: 14,
                  padding: '8px 14px',
                }}>
                  {data.audit.map((ev, i) => (
                    <div key={ev.id} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      padding: '10px 0',
                      borderBottom: i < data.audit.length - 1 ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
                    }}>
                      <div style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#ffffff', fontFamily: 'IBM Plex Mono, monospace' }}>
                          {ev.t}
                        </span>
                        <p style={{ fontSize: 11, color: 'var(--c-text-2)', margin: '2px 0 0 0' }}>
                          {ev.payload}
                        </p>
                      </div>
                      <span style={{ fontSize: 10, color: 'var(--c-text-3)', fontFamily: 'IBM Plex Mono, monospace', flexShrink: 0 }}>
                        {new Date(ev.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sticky Bottom Protective Action Bar */}
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
              {/* Hold Trigger Bar */}
              {(isStaged || isPlaced) && (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={isStaged ? handleHold : undefined}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 14,
                    border: `1px solid ${isPlaced ? 'var(--c-success-border)' : 'var(--c-warn-border)'}`,
                    background: isPlaced ? 'rgba(52, 211, 153, 0.12)' : 'rgba(251, 191, 36, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: isStaged ? 'pointer' : 'default',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: isPlaced ? 'var(--c-success)' : 'var(--c-warn)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#050508',
                    }}>
                      {isPlaced ? <Lock size={18} strokeWidth={2.4} /> : <Unlock size={18} strokeWidth={2.4} />}
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 15, fontWeight: 900, color: '#ffffff', fontFamily: 'IBM Plex Mono, monospace' }}>
                        {data.hold.amount} Disputed
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--c-text-2)' }}>
                        {isStaged ? 'Tap to place 72h reversible protection hold' : '72h Reversible Protection Active'}
                      </div>
                    </div>
                  </div>

                  <span style={{
                    padding: '4px 9px',
                    borderRadius: 12,
                    background: isPlaced ? 'var(--c-success)' : 'var(--c-warn)',
                    color: '#050508',
                    fontSize: 10,
                    fontWeight: 900,
                  }}>
                    {isPlaced ? 'LOCKED' : 'FREEZE'}
                  </span>
                </motion.button>
              )}

              {/* If Placed: Actions to Withdraw or Send */}
              {isPlaced && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={handleWithdraw}
                    style={{
                      flex: 1,
                      height: 48,
                      borderRadius: 12,
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#ffffff',
                      fontSize: 13,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      cursor: 'pointer',
                    }}
                  >
                    <RotateCcw size={15} />
                    Withdraw
                  </button>
                  <button
                    onClick={() => alert('Dispute notice officially sent to billing administrator!')}
                    className="btn-primary"
                    style={{ flex: 2, height: 48, borderRadius: 12, fontSize: 13 }}
                  >
                    <Send size={15} />
                    Send Legal Notice
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </IonContent>
    </IonPage>
  );
};
