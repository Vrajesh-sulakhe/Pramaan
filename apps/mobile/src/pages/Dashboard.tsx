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
  Search
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
      title: 'Fortis Hospital — Brain MRI 3.0T',
      date: 'Today, 10:42 AM',
      category: 'Medical Bill',
      discrepancy: '₹27,000 Overcharge',
      status: '72h Hold Active',
      statusType: 'danger' as const,
      sampleText: `HOSPITAL INVOICE #8921\n1. Brain MRI 3.0T: ₹45,000 (CGHS Ceiling: ₹18,000)\n2. Specialist Consultation: ₹500`
    },
    {
      id: 'case-2',
      title: 'Prestige Lakeside — 3BHK Lease',
      date: 'Yesterday, 3:15 PM',
      category: 'Rental Lease',
      discrepancy: '10-Mo. Deposit Demand',
      status: 'Notice Prepared',
      statusType: 'warn' as const,
      sampleText: `RESIDENTIAL LEASE\n1. Monthly Rent: ₹35,000\n2. Security Deposit: ₹3,50,000 (Model Rent Act cap: 2 months)`
    }
  ];

  return (
    <IonPage>
      <IonContent fullscreen scrollY={true} scrollX={false}>
        <div className="mobile-shell">

          {/* ──── Everyday Clean App Header ──── */}
          <div style={{
            paddingTop: 'calc(var(--sat) + 14px)',
            paddingLeft: 20,
            paddingRight: 20,
            paddingBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--c-border)',
            background: '#000000',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--c-text-2)' }} />
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--c-text-3)' }}>
                  PRAMAAN
                </span>
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.4px', color: 'var(--c-text-1)', margin: 0 }}>
                Evidence Engine
              </h1>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 16,
              background: 'var(--c-surface-1)',
              border: '1px solid var(--c-border)',
            }}>
              <ShieldCheck size={14} color="var(--c-text-2)" />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-text-2)' }}>Verified</span>
            </div>
          </div>

          {/* ──── Neutral Segmented Domain Switcher ──── */}
          <div style={{ padding: '16px 20px 0' }}>
            <div style={{
              display: 'flex',
              background: 'var(--c-surface-1)',
              border: '1px solid var(--c-border)',
              borderRadius: 12,
              padding: 3,
              gap: 3,
            }}>
              {(['bill', 'lease'] as const).map(d => {
                const active = state.domain === d;
                return (
                  <button
                    key={d}
                    onClick={() => setDomain(d)}
                    style={{
                      flex: 1,
                      height: 40,
                      borderRadius: 9,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif',
                      border: active ? '1px solid var(--c-border-md)' : '1px solid transparent',
                      transition: 'all 0.15s ease',
                      background: active ? 'var(--c-surface-2)' : 'transparent',
                      color: active ? '#ffffff' : 'var(--c-text-3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    {d === 'bill' ? <Hospital size={15} color={active ? '#ffffff' : 'var(--c-text-3)'} /> : <Building2 size={15} color={active ? '#ffffff' : 'var(--c-text-3)'} />}
                    {d === 'bill' ? 'Medical Bills' : 'Rental Leases'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ──── Calm Hero Scanner Action Card ──── */}
          <div style={{ padding: '16px 20px 0' }}>
            <motion.div
              whileTap={{ scale: 0.98 }}
              onClick={() => history.push('/capture')}
              style={{
                background: 'var(--c-surface-1)',
                border: '1px solid var(--c-border-md)',
                borderRadius: 16,
                padding: 18,
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: '#f4f4f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <ScanLine size={20} color="#09090b" strokeWidth={2.2} />
                </div>

                <span style={{
                  padding: '4px 10px',
                  borderRadius: 12,
                  background: 'var(--c-surface-2)',
                  border: '1px solid var(--c-border)',
                  color: 'var(--c-text-2)',
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.4px',
                  textTransform: 'uppercase',
                }}>
                  Document OCR
                </span>
              </div>

              <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px', color: 'var(--c-text-1)', margin: '0 0 4px 0' }}>
                Scan & Verify {state.domain === 'bill' ? 'Medical Bill' : 'Rental Lease'}
              </h2>
              <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--c-text-2)', margin: '0 0 14px 0' }}>
                Cross-check rates against statutory laws and place 72-hour reversible holds on overcharges.
              </p>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 10,
                borderTop: '1px solid var(--c-border)',
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text-1)' }}>
                  Launch Camera or Upload
                </span>
                <ArrowUpRight size={15} color="var(--c-text-2)" />
              </div>
            </motion.div>
          </div>

          {/* ──── Key Stat Metrics ──── */}
          <div style={{ padding: '14px 20px 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <div style={{
                background: 'var(--c-surface-1)',
                border: '1px solid var(--c-border)',
                borderRadius: 12,
                padding: '12px 10px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <TrendingUp size={12} color="var(--c-danger)" />
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--c-text-3)' }}>Disputed</span>
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--c-text-1)', letterSpacing: '-0.4px' }}>₹27,000</div>
                <div style={{ fontSize: 10, color: 'var(--c-text-3)', marginTop: 2 }}>In active holds</div>
              </div>

              <div style={{
                background: 'var(--c-surface-1)',
                border: '1px solid var(--c-border)',
                borderRadius: 12,
                padding: '12px 10px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <FileCheck size={12} color="var(--c-success)" />
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--c-text-3)' }}>Audit Hash</span>
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--c-text-1)', letterSpacing: '-0.4px' }}>100%</div>
                <div style={{ fontSize: 10, color: 'var(--c-text-3)', marginTop: 2 }}>Deterministic</div>
              </div>

              <div style={{
                background: 'var(--c-surface-1)',
                border: '1px solid var(--c-border)',
                borderRadius: 12,
                padding: '12px 10px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <Scale size={12} color="var(--c-text-2)" />
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--c-text-3)' }}>Laws</span>
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--c-text-1)', letterSpacing: '-0.4px' }}>10,240</div>
                <div style={{ fontSize: 10, color: 'var(--c-text-3)', marginTop: 2 }}>Tariff rules</div>
              </div>
            </div>
          </div>

          {/* ──── Everyday Quick Presets ──── */}
          <div style={{ padding: '16px 20px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', color: 'var(--c-text-3)', margin: 0 }}>
                Quick Verification Presets
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button
                onClick={() => handleQuickTool('bill', `HOSPITAL INVOICE #8921\n1. Brain MRI with Contrast: ₹45,000\n2. Specialist Consultation: ₹500`)}
                style={{
                  background: 'var(--c-surface-1)',
                  border: '1px solid var(--c-border)',
                  borderRadius: 12,
                  padding: 12,
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--c-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Hospital size={14} color="var(--c-text-2)" />
                </div>
                <div style={{ marginTop: 2 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text-1)' }}>Hospital MRI Cap</div>
                  <div style={{ fontSize: 11, color: 'var(--c-text-3)', marginTop: 1 }}>CGHS ceiling check</div>
                </div>
              </button>

              <button
                onClick={() => handleQuickTool('lease', `RESIDENTIAL LEASE AGREEMENT\n1. Monthly Rent: ₹35,000\n2. Security Deposit: ₹3,50,000 (10 Months Demanded)`)}
                style={{
                  background: 'var(--c-surface-1)',
                  border: '1px solid var(--c-border)',
                  borderRadius: 12,
                  padding: 12,
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--c-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={14} color="var(--c-text-2)" />
                </div>
                <div style={{ marginTop: 2 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text-1)' }}>Rental Deposit Cap</div>
                  <div style={{ fontSize: 11, color: 'var(--c-text-3)', marginTop: 1 }}>2-Month legal ceiling</div>
                </div>
              </button>
            </div>
          </div>

          {/* ──── Recent Case History ──── */}
          <div style={{ padding: '16px 20px 100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <Clock size={13} color="var(--c-text-3)" />
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', color: 'var(--c-text-3)', margin: 0 }}>
                Recent Audits
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sampleRecentCases.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setDomain(item.category === 'Medical Bill' ? 'bill' : 'lease');
                    setCapture('text', item.sampleText);
                    history.push('/results');
                  }}
                  style={{
                    background: 'var(--c-surface-1)',
                    border: '1px solid var(--c-border)',
                    borderRadius: 12,
                    padding: 14,
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--c-text-3)' }}>
                      {item.category} • {item.date}
                    </span>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: item.statusType === 'danger' ? 'var(--c-danger)' : 'var(--c-warn)',
                      background: item.statusType === 'danger' ? 'var(--c-danger-bg)' : 'var(--c-warn-bg)',
                      padding: '2px 6px',
                      borderRadius: 4,
                    }}>
                      {item.discrepancy}
                    </span>
                  </div>

                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-text-1)' }}>
                    {item.title}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid var(--c-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Lock size={11} color="var(--c-text-2)" />
                      <span style={{ fontSize: 11, color: 'var(--c-text-2)', fontWeight: 600 }}>{item.status}</span>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--c-text-3)', fontWeight: 500 }}>View Details →</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ──── Everyday Bottom Tab Bar ──── */}
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            margin: '0 auto',
            maxWidth: 480,
            padding: '8px 20px',
            paddingBottom: 'calc(var(--sab) + 6px)',
            background: 'rgba(0, 0, 0, 0.95)',
            borderTop: '1px solid var(--c-border)',
            backdropFilter: 'blur(16px)',
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
                gap: 3,
                color: '#ffffff',
                cursor: 'pointer',
                background: 'none',
                border: 'none',
              }}
            >
              <Layers size={18} />
              <span style={{ fontSize: 10, fontWeight: 700 }}>Engine</span>
            </button>

            <button
              onClick={() => history.push('/capture')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: '#f4f4f5',
                color: '#09090b',
                cursor: 'pointer',
                border: 'none',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.4)',
                marginTop: -14,
              }}
            >
              <ScanLine size={20} color="#09090b" strokeWidth={2.2} />
            </button>

            <button
              onClick={() => history.push('/results')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                color: 'var(--c-text-3)',
                cursor: 'pointer',
                background: 'none',
                border: 'none',
              }}
            >
              <Scale size={18} />
              <span style={{ fontSize: 10, fontWeight: 600 }}>Vault</span>
            </button>
          </div>

        </div>
      </IonContent>
    </IonPage>
  );
};
