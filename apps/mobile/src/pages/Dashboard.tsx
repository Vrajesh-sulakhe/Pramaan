import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { 
  ScanLine, 
  ChevronRight, 
  Clock, 
  TrendingUp, 
  FileCheck, 
  Scale, 
  Building2, 
  Hospital, 
  Pill, 
  ArrowUpRight, 
  Lock, 
  Layers, 
  ShieldCheck, 
  Sparkles,
  Zap,
  FileSpreadsheet
} from 'lucide-react';
import { motion } from 'framer-motion';

export const Dashboard: React.FC = () => {
  const history = useHistory();
  const { state, setDomain, setCapture } = useSession();

  const handleQuickTool = (domain: 'bill' | 'lease', prefill?: string) => {
    setDomain(domain);
    if (prefill) {
      setCapture('text', prefill);
      history.push('/analyze');
    } else {
      history.push('/capture');
    }
  };

  const sampleRecentCases = [
    {
      id: 'case-1',
      title: 'Fortis Healthcare — Brain MRI 3.0T',
      date: 'Today, 10:42 AM',
      category: 'Medical Bill',
      discrepancy: '₹27,000 Overcharge',
      status: '72h Hold Placed',
      statusType: 'danger' as const,
      sampleText: `HOSPITAL INVOICE #8921\n1. Brain MRI 3.0T: ₹45,000 (CGHS Ceiling: ₹18,000)\n2. Specialist Consultation: ₹500`
    },
    {
      id: 'case-2',
      title: 'Prestige Lakeside — 3BHK Lease',
      date: 'Yesterday, 3:15 PM',
      category: 'Rental Agreement',
      discrepancy: '10-Month Deposit Demand',
      status: 'Notice Prepared',
      statusType: 'warn' as const,
      sampleText: `RESIDENTIAL LEASE\n1. Monthly Rent: ₹35,000\n2. Security Deposit: ₹3,50,000 (Model Rent Act cap: 2 months)`
    }
  ];

  const totalDisputedFunds = state.vault.reduce((acc, v) => acc + v.disputedNumber, 0);

  return (
    <IonPage>
      <IonContent fullscreen scrollY={true} scrollX={false}>
        <div className="mobile-shell">

          {/* ──── Top Navigation Header ──── */}
          <div style={{
            paddingTop: 'calc(var(--sat) + 12px)',
            paddingLeft: 20,
            paddingRight: 20,
            paddingBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(5, 5, 8, 0.85)',
            backdropFilter: 'blur(20px)',
            position: 'sticky',
            top: 0,
            zIndex: 20,
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--c-text-1)', boxShadow: '0 0 8px rgba(255, 255, 255, 0.6)' }} />
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--c-text-3)' }}>
                  PRAMAAN ENGINE
                </span>
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px', color: 'var(--c-text-1)', margin: 0, lineHeight: 1.1 }}>
                Evidence Engine
              </h1>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 20,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            }}>
              <ShieldCheck size={14} color="var(--c-success)" />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-text-2)' }}>Deterministic</span>
            </div>
          </div>

          {/* ──── Dynamic Segmented Domain Switcher ──── */}
          <div style={{ padding: '16px 20px 0' }}>
            <div style={{
              display: 'flex',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 14,
              padding: 4,
              gap: 4,
              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.6)',
            }}>
              {(['bill', 'lease'] as const).map(d => {
                const active = state.domain === d;
                return (
                  <button
                    key={d}
                    onClick={() => setDomain(d)}
                    style={{
                      flex: 1,
                      height: 42,
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      background: active ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                      color: active ? '#ffffff' : 'var(--c-text-3)',
                      border: active ? '1px solid rgba(255, 255, 255, 0.18)' : '1px solid transparent',
                      boxShadow: active ? '0 4px 12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 7,
                    }}
                  >
                    {d === 'bill' ? <Hospital size={16} color={active ? '#ffffff' : 'var(--c-text-3)'} /> : <Building2 size={16} color={active ? '#ffffff' : 'var(--c-text-3)'} />}
                    {d === 'bill' ? 'Medical Bills (CGHS)' : 'Rental Leases (Act)'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ──── Hero Obsidian Scanner Card ──── */}
          <div style={{ padding: '16px 20px 0' }}>
            <motion.div
              whileTap={{ scale: 0.98 }}
              onClick={() => history.push('/capture')}
              style={{
                background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.07) 0%, rgba(255, 255, 255, 0.02) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.18)',
                backdropFilter: 'blur(24px)',
                borderRadius: 20,
                padding: 22,
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Subtle top specular accent shimmer */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: '20%',
                right: '20%',
                height: 1,
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
              }} />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 16px rgba(255, 255, 255, 0.25)',
                }}>
                  <ScanLine size={22} color="#050508" strokeWidth={2.4} />
                </div>

                <span style={{
                  padding: '5px 11px',
                  borderRadius: 20,
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  color: 'var(--c-text-2)',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.6px',
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}>
                  <Sparkles size={12} color="#ffffff" />
                  Forensic OCR
                </span>
              </div>

              <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.4px', color: '#ffffff', margin: '0 0 6px 0', lineHeight: 1.2 }}>
                Scan & Verify {state.domain === 'bill' ? 'Medical Invoice' : 'Rental Lease'}
              </h2>
              <p style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--c-text-2)', margin: '0 0 16px 0' }}>
                Cross-reference items against official tariff schedules, find unbilled caps, and place 72h protection holds.
              </p>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 12,
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>
                  Launch Camera or Upload Document
                </span>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <ArrowUpRight size={15} color="#ffffff" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* ──── Key Stat Metrics ──── */}
          <div style={{ padding: '14px 20px 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.035)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                borderRadius: 14,
                padding: '14px 12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                  <TrendingUp size={13} color="var(--c-danger)" />
                  <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: 'var(--c-text-3)', letterSpacing: '0.4px' }}>Disputed</span>
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px', fontFamily: 'IBM Plex Mono, monospace' }}>
                  ₹{totalDisputedFunds.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: 11, color: 'var(--c-text-3)', marginTop: 2 }}>In active holds</div>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.035)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                borderRadius: 14,
                padding: '14px 12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                  <FileCheck size={13} color="var(--c-success)" />
                  <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: 'var(--c-text-3)', letterSpacing: '0.4px' }}>Audit Proof</span>
                </div>
                <div style={{ fontSize: 19, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px', fontFamily: 'IBM Plex Mono, monospace' }}>100%</div>
                <div style={{ fontSize: 11, color: 'var(--c-text-3)', marginTop: 2 }}>Deterministic</div>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.035)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                borderRadius: 14,
                padding: '14px 12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                  <Scale size={13} color="var(--c-text-2)" />
                  <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: 'var(--c-text-3)', letterSpacing: '0.4px' }}>Tariffs</span>
                </div>
                <div style={{ fontSize: 19, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px', fontFamily: 'IBM Plex Mono, monospace' }}>10,240</div>
                <div style={{ fontSize: 11, color: 'var(--c-text-3)', marginTop: 2 }}>Statutory rules</div>
              </div>
            </div>
          </div>

          {/* ──── Quick Verification Presets ──── */}
          <div style={{ padding: '18px 20px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--c-text-3)', margin: 0 }}>
                1-Tap Forensic Presets
              </p>
              <span style={{ fontSize: 11, color: 'var(--c-text-3)', fontWeight: 600 }}>Instant Test</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button
                onClick={() => handleQuickTool('bill', `HOSPITAL INVOICE #8921\n1. Brain MRI with Contrast (3.0 Tesla): ₹45,000 (CGHS Ceiling: ₹18,000)\n2. Specialist Consultation: ₹500`)}
                style={{
                  background: 'rgba(255, 255, 255, 0.035)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                  borderRadius: 14,
                  padding: 14,
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(251, 113, 133, 0.12)', border: '1px solid rgba(251, 113, 133, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Hospital size={16} color="var(--c-danger)" />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#ffffff' }}>Hospital MRI Cap</div>
                  <div style={{ fontSize: 11, color: 'var(--c-text-3)', marginTop: 2 }}>CGHS ceiling check</div>
                </div>
              </button>

              <button
                onClick={() => handleQuickTool('lease', `RESIDENTIAL LEASE AGREEMENT\n1. Monthly Rent: ₹35,000\n2. Security Deposit: ₹3,50,000 (10 Months Demanded - Legal Cap is 2 Months)`)}
                style={{
                  background: 'rgba(255, 255, 255, 0.035)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                  borderRadius: 14,
                  padding: 14,
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={16} color="#ffffff" />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#ffffff' }}>Rental Deposit Cap</div>
                  <div style={{ fontSize: 11, color: 'var(--c-text-3)', marginTop: 2 }}>2-Month legal ceiling</div>
                </div>
              </button>
            </div>
          </div>

          {/* ──── Recent Verified Case Feed from Dynamic Vault ──── */}
          <div style={{ padding: '18px 20px 100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={13} color="var(--c-text-3)" />
                <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--c-text-3)', margin: 0 }}>
                  Recent Case Audits
                </p>
              </div>
              <button 
                onClick={() => history.push('/vault')}
                style={{ fontSize: 11, color: 'var(--c-text-2)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                View Vault ({state.vault.length}) →
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {state.vault.slice(0, 3).map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setDomain(item.domain);
                    setCapture(item.captureType || 'text', item.captureData || item.title);
                    history.push('/results');
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.035)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                    borderRadius: 14,
                    padding: 15,
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-text-3)' }}>
                      {item.domain === 'bill' ? 'Medical Bill' : 'Rental Lease'} • {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: item.holdStatus === 'placed' ? 'var(--c-success)' : 'var(--c-warn)',
                      background: item.holdStatus === 'placed' ? 'rgba(52, 211, 153, 0.12)' : 'rgba(251, 191, 36, 0.12)',
                      border: `1px solid ${item.holdStatus === 'placed' ? 'rgba(52, 211, 153, 0.3)' : 'rgba(251, 191, 36, 0.3)'}`,
                      padding: '3px 8px',
                      borderRadius: 6,
                    }}>
                      {item.holdStatus === 'placed' ? '72H FROZEN' : 'OVERCHARGE'}
                    </span>
                  </div>

                  <div style={{ fontSize: 14, fontWeight: 800, color: '#ffffff' }}>
                    {item.title}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Lock size={12} color="var(--c-text-2)" />
                      <span style={{ fontSize: 11, color: 'var(--c-text-2)', fontWeight: 700 }}>
                        {item.holdStatus === 'placed' ? '72h Reversible Protection' : 'Dispute Staged'}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--c-text-3)', fontWeight: 600 }}>Inspect Evidence →</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ──── Floating Smoked Glass Bottom Navigation ──── */}
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            margin: '0 auto',
            maxWidth: 440,
            padding: '10px 24px',
            paddingBottom: 'calc(var(--sab) + 8px)',
            background: 'rgba(5, 5, 8, 0.88)',
            borderTop: '1px solid rgba(255, 255, 255, 0.10)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            zIndex: 100,
          }}>
            <button
              onClick={() => history.push('/dashboard')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                color: '#ffffff',
                cursor: 'pointer',
                background: 'none',
                border: 'none',
              }}
            >
              <Layers size={20} />
              <span style={{ fontSize: 10, fontWeight: 800 }}>Engine</span>
            </button>

            <button
              onClick={() => history.push('/capture')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: '#ffffff',
                color: '#050508',
                cursor: 'pointer',
                border: 'none',
                boxShadow: '0 4px 18px rgba(255, 255, 255, 0.3)',
                marginTop: -16,
              }}
            >
              <ScanLine size={22} color="#050508" strokeWidth={2.4} />
            </button>

            <button
              onClick={() => history.push('/vault')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                color: 'var(--c-text-3)',
                cursor: 'pointer',
                background: 'none',
                border: 'none',
              }}
            >
              <Scale size={20} />
              <span style={{ fontSize: 10, fontWeight: 700 }}>Vault</span>
            </button>
          </div>

        </div>
      </IonContent>
    </IonPage>
  );
};
