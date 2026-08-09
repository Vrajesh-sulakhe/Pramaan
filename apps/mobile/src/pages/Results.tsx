import React, { useEffect, useState } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { ChevronLeft, TriangleAlert, Lock, Unlock, RotateCcw, Send, FileSpreadsheet, Eye, ShieldCheck, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { fetchRun, consent } from '../data/dataSource';
import { RunResponse } from '../data/mockRun';
import { BBoxOverlay } from '../components/BBoxOverlay';

export const Results: React.FC = () => {
  const [data, setData] = useState<RunResponse | null>(null);
  const [viewMode, setViewMode] = useState<'proofs' | 'ocr'>('proofs');
  const { state, resetSession } = useSession();
  const history = useHistory();

  useEffect(() => {
    fetchRun({ domain: state.domain, captureType: state.captureType, captureData: state.captureData }).then((res: any) => setData(res));
  }, []);

  const handleHold = async () => {
    if (!data || data.hold.status !== 'staged') return;
    const res = await consent(data.id, 'confirm_hold');
    setData({ ...data, hold: { ...data.hold, status: 'placed' }, audit: [...data.audit, res.audit] });
  };

  const handleWithdraw = async () => {
    if (!data || data.hold.status !== 'placed') return;
    const res = await consent(data.id, 'withdraw_hold');
    setData({ ...data, hold: { ...data.hold, status: 'released' }, audit: [...data.audit, res.audit] });
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
            paddingTop: 'calc(var(--sat) + 14px)',
            paddingLeft: 20,
            paddingRight: 20,
            paddingBottom: 16,
            borderBottom: '1px solid var(--c-border)',
            background: '#000000',
          }}>
            <button
              onClick={back}
              style={{
                background: 'var(--c-surface-1)',
                border: '1px solid var(--c-border-md)',
                borderRadius: 10,
                padding: '7px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                color: 'var(--c-text-1)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <ChevronLeft size={16} />
              Dashboard
            </button>

            {data && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 9px',
                borderRadius: 12,
                background: gapCount > 0 ? 'var(--c-danger-bg)' : 'var(--c-success-bg)',
                border: `1px solid ${gapCount > 0 ? 'var(--c-danger-border)' : 'var(--c-success-border)'}`,
                color: gapCount > 0 ? 'var(--c-danger)' : 'var(--c-success)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.4px',
                textTransform: 'uppercase',
              }}>
                {gapCount > 0 ? `${gapCount} Discrepancies` : '100% Verified'}
              </span>
            )}
          </div>

          {/* Loading State */}
          {!data && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14, padding: 48 }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid var(--c-text-2)', borderTopColor: 'transparent' }}
              />
              <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--c-text-2)', margin: 0 }}>Finalizing verification report…</p>
            </div>
          )}

          {data && (
            <div>
              {/* Hero Banner */}
              <div style={{ padding: '16px 20px 0' }}>
                <div style={{
                  background: 'var(--c-surface-1)',
                  border: `1px solid ${gapCount > 0 ? 'var(--c-danger-border)' : 'var(--c-success-border)'}`,
                  borderRadius: 16,
                  padding: 18,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    {gapCount > 0 ? <TriangleAlert size={16} color="var(--c-danger)" /> : <ShieldCheck size={16} color="var(--c-success)" />}
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', color: gapCount > 0 ? 'var(--c-danger)' : 'var(--c-success)' }}>
                      {gapCount > 0 ? 'Statutory Overcharge Alert' : 'Deterministic Audit Passed'}
                    </span>
                  </div>

                  <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--c-text-1)', letterSpacing: '-0.6px', lineHeight: 1.1, marginBottom: 6 }}>
                    {gapCount > 0 ? `${data.hold.amount} Disputed Gap` : '₹0 Gap Detected'}
                  </div>

                  <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--c-text-2)', margin: 0 }}>
                    {gapCount > 0
                      ? 'Official rate schedule violated. A 72-hour reversible protection hold and dispute letter are prepared.'
                      : 'All charges match government tariff schedules perfectly.'}
                  </p>
                </div>
              </div>

              {/* View Mode Switcher */}
              <div style={{ padding: '14px 20px 0' }}>
                <div style={{
                  display: 'flex',
                  background: 'var(--c-surface-1)',
                  border: '1px solid var(--c-border)',
                  borderRadius: 10,
                  padding: 3,
                  gap: 3,
                }}>
                  <button
                    onClick={() => setViewMode('proofs')}
                    style={{
                      flex: 1,
                      height: 36,
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                      cursor: 'pointer',
                      border: 'none',
                      background: viewMode === 'proofs' ? 'var(--c-surface-2)' : 'transparent',
                      color: viewMode === 'proofs' ? 'var(--c-text-1)' : 'var(--c-text-3)',
                    }}
                  >
                    <FileSpreadsheet size={14} />
                    Verified Proofs ({data.proofs.length})
                  </button>
                  <button
                    onClick={() => setViewMode('ocr')}
                    style={{
                      flex: 1,
                      height: 36,
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                      cursor: 'pointer',
                      border: 'none',
                      background: viewMode === 'ocr' ? 'var(--c-surface-2)' : 'transparent',
                      color: viewMode === 'ocr' ? 'var(--c-text-1)' : 'var(--c-text-3)',
                    }}
                  >
                    <Eye size={14} />
                    OCR Scanner
                  </button>
                </div>
              </div>

              {/* Proofs List */}
              <div style={{ padding: '14px 20px 0' }}>
                {viewMode === 'ocr' ? (
                  <div style={{
                    background: 'var(--c-surface-1)',
                    border: '1px solid var(--c-border)',
                    borderRadius: 16,
                    overflow: 'hidden',
                  }}>
                    <BBoxOverlay
                      captureType={state.captureType}
                      captureData={state.captureData}
                      fields={data.fields}
                    />
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {data.proofs.map((proof, i) => (
                      <motion.div
                        key={proof.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        style={{
                          background: 'var(--c-surface-1)',
                          border: `1px solid ${proof.status === 'gap' ? 'var(--c-danger-border)' : 'var(--c-border-md)'}`,
                          borderRadius: 16,
                          padding: 14,
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                      >
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: 2.5,
                          background: proof.status === 'gap' ? 'var(--c-danger)' : 'var(--c-success)',
                        }} />

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-text-1)' }}>
                            {proof.itemName}
                          </span>
                          <span style={{
                            padding: '2px 7px',
                            borderRadius: 8,
                            background: proof.status === 'gap' ? 'var(--c-danger-bg)' : 'var(--c-success-bg)',
                            color: proof.status === 'gap' ? 'var(--c-danger)' : 'var(--c-success)',
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: '0.4px',
                            textTransform: 'uppercase',
                          }}>
                            {proof.status === 'gap' ? 'OVERCHARGE' : 'VERIFIED'}
                          </span>
                        </div>

                        {/* 3-Column Comparison */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr 1fr',
                          gap: 6,
                          background: 'var(--c-surface-2)',
                          padding: 10,
                          borderRadius: 10,
                          marginBottom: 10,
                          textAlign: 'center',
                        }}>
                          <div style={{ textAlign: 'left' }}>
                            <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--c-text-3)', display: 'block', marginBottom: 2 }}>
                              {proof.sourceLabel}
                            </span>
                            <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--c-text-1)' }}>
                              {proof.sourceValue}
                            </span>
                            <span style={{ fontSize: 10, color: 'var(--c-text-3)', display: 'block', marginTop: 1 }}>
                              {proof.sourceRef}
                            </span>
                          </div>

                          <div>
                            <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--c-text-3)', display: 'block', marginBottom: 2 }}>
                              {proof.computeLabel}
                            </span>
                            <span style={{ fontSize: 15, fontWeight: 800, color: proof.status === 'gap' ? 'var(--c-danger)' : 'var(--c-success)' }}>
                              {proof.computeValue}
                            </span>
                            {proof.computeMath && (
                              <span style={{ fontSize: 9, fontFamily: 'IBM Plex Mono, monospace', color: 'var(--c-text-3)', display: 'block', marginTop: 1 }}>
                                {proof.computeMath}
                              </span>
                            )}
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--c-text-3)', display: 'block', marginBottom: 2 }}>
                              {proof.ruleLabel}
                            </span>
                            <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--c-text-1)' }}>
                              {proof.ruleValue}
                            </span>
                            <span style={{ fontSize: 10, color: 'var(--c-text-2)', textDecoration: 'underline', display: 'block', marginTop: 1 }}>
                              {proof.ruleRefText}
                            </span>
                          </div>
                        </div>

                        <p style={{
                          fontSize: 12,
                          lineHeight: 1.5,
                          color: 'var(--c-text-2)',
                          margin: 0,
                          paddingLeft: 8,
                          borderLeft: `2px solid ${proof.status === 'gap' ? 'var(--c-danger)' : 'var(--c-success)'}`,
                        }}>
                          {proof.summaryText}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Audit Trail */}
              <div style={{ padding: '16px 20px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                  <Clock size={13} color="var(--c-text-3)" />
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', color: 'var(--c-text-3)', margin: 0 }}>
                    Deterministic Audit Trail
                  </p>
                </div>

                <div style={{
                  background: 'var(--c-surface-1)',
                  border: '1px solid var(--c-border)',
                  borderRadius: 12,
                  padding: '8px 12px',
                }}>
                  {data.audit.map((ev, i) => (
                    <div key={ev.id} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      padding: '8px 0',
                      borderBottom: i < data.audit.length - 1 ? '1px solid var(--c-border)' : 'none',
                    }}>
                      <div style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--c-text-1)', fontFamily: 'IBM Plex Mono, monospace' }}>
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

          {/* Sticky Bottom Action Bar */}
          {data && (
            <div style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              margin: '0 auto',
              maxWidth: 480,
              padding: '12px 20px',
              paddingBottom: 'calc(var(--sab) + 12px)',
              background: 'rgba(0, 0, 0, 0.95)',
              borderTop: '1px solid var(--c-border-md)',
              backdropFilter: 'blur(16px)',
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
                    borderRadius: 12,
                    border: `1px solid ${isPlaced ? 'var(--c-success-border)' : 'var(--c-warn-border)'}`,
                    background: isPlaced ? 'var(--c-surface-1)' : 'var(--c-surface-1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: isStaged ? 'pointer' : 'default',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      background: isPlaced ? 'var(--c-success-bg)' : 'var(--c-warn-bg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isPlaced ? 'var(--c-success)' : 'var(--c-warn)',
                    }}>
                      {isPlaced ? <Lock size={16} strokeWidth={2.2} /> : <Unlock size={16} strokeWidth={2.2} />}
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--c-text-1)' }}>
                        {data.hold.amount} Disputed
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--c-text-2)' }}>
                        {isStaged ? 'Tap to place 72h reversible hold' : '72h Reversible Protection Active'}
                      </div>
                    </div>
                  </div>

                  <span style={{
                    padding: '4px 8px',
                    borderRadius: 8,
                    background: isPlaced ? 'var(--c-success-bg)' : 'var(--c-warn-bg)',
                    color: isPlaced ? 'var(--c-success)' : 'var(--c-warn)',
                    border: `1px solid ${isPlaced ? 'var(--c-success-border)' : 'var(--c-warn-border)'}`,
                    fontSize: 10,
                    fontWeight: 800,
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
                      height: 46,
                      borderRadius: 10,
                      background: 'var(--c-surface-1)',
                      border: '1px solid var(--c-border-md)',
                      color: 'var(--c-text-1)',
                      fontSize: 13,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                      cursor: 'pointer',
                    }}
                  >
                    <RotateCcw size={14} />
                    Withdraw
                  </button>
                  <button
                    onClick={() => alert('Dispute notice officially sent to billing administrator!')}
                    className="btn-primary"
                    style={{ flex: 2, height: 46, borderRadius: 10, fontSize: 13 }}
                  >
                    <Send size={14} />
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
