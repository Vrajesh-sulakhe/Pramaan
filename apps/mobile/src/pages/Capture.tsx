import React, { useState, useRef } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { ChevronLeft, Camera, FileUp, Type, Sparkles, Zap } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

type TabId = 'text' | 'upload' | 'camera';

const tabs: { id: TabId; icon: React.ElementType; label: string }[] = [
  { id: 'text', icon: Type, label: 'Text Input' },
  { id: 'upload', icon: FileUp, label: 'Upload File' },
  { id: 'camera', icon: Camera, label: 'Live Camera' },
];

export const Capture: React.FC = () => {
  const history = useHistory();
  const { state, setCapture } = useSession();
  const [tab, setTab] = useState<TabId>('text');
  const [text, setText] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const sampleBills = {
    bill: `HOSPITAL INVOICE #2024-8831
Patient: Rahul Sharma
Date: 14/08/2024
Department: Radiology & Diagnostic

1. Brain MRI with Contrast (3.0 Tesla): ₹45,000
2. Specialist Consultation Fee: ₹500
3. Nursing & Facility Charges: ₹1,200

Total Amount: ₹46,700`,
    lease: `RESIDENTIAL LEASE AGREEMENT
Landlord: Green Real Estate
Tenant: Priya Mehta
Property: Apt 4B, Koramangala 5th Block

1. Monthly Rent: ₹35,000 / month
2. Security Deposit: ₹3,50,000 (10 months rent demanded)
3. Annual Rent Escalation Clause: 15% automatic yearly increase`
  };

  const handleApplySample = () => {
    setText(sampleBills[state.domain]);
  };

  const handleAnalyze = () => {
    if (tab === 'text') {
      setCapture('text', text.trim() || sampleBills[state.domain]);
    } else if (tab === 'upload') {
      setCapture('file', 'document_upload.pdf');
    } else {
      setCapture('camera', 'camera_capture.jpg');
    }
    history.push('/analyze');
  };

  return (
    <IonPage>
      <IonContent fullscreen scrollX={false} scrollY={true}>
        <div className="mobile-shell" style={{ justifyContent: 'space-between', paddingBottom: 'calc(var(--sab) + 20px)' }}>

          {/* Top Header */}
          <div>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={() => history.goBack()}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: 'var(--c-surface-1)',
                    border: '1px solid var(--c-border-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--c-text-1)',
                  }}
                >
                  <ChevronLeft size={20} />
                </button>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', color: 'var(--c-text-3)', margin: 0, marginBottom: 2 }}>
                    Evidence Input
                  </p>
                  <h1 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.3px', color: 'var(--c-text-1)', margin: 0 }}>
                    {state.domain === 'bill' ? 'Scan Medical Bill' : 'Upload Lease Agreement'}
                  </h1>
                </div>
              </div>
            </div>

            {/* Segmented Mode Selector */}
            <div style={{ padding: '16px 20px' }}>
              <div style={{
                display: 'flex',
                background: 'var(--c-surface-1)',
                border: '1px solid var(--c-border)',
                borderRadius: 12,
                padding: 3,
                gap: 3,
              }}>
                {tabs.map(t => {
                  const Icon = t.icon;
                  const active = tab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      style={{
                        flex: 1,
                        height: 38,
                        borderRadius: 9,
                        fontSize: 13,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        cursor: 'pointer',
                        fontFamily: 'Inter, sans-serif',
                        transition: 'all 0.15s ease',
                        background: active ? 'var(--c-surface-2)' : 'transparent',
                        color: active ? 'var(--c-text-1)' : 'var(--c-text-3)',
                        border: active ? '1px solid var(--c-border-md)' : '1px solid transparent',
                      }}
                    >
                      <Icon size={15} color={active ? 'var(--c-text-1)' : 'var(--c-text-3)'} />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Interactive Tab Area */}
            <div style={{ padding: '0 20px' }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  {/* TEXT INPUT TAB */}
                  {tab === 'text' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{
                        background: 'var(--c-surface-1)',
                        border: '1px solid var(--c-border-md)',
                        borderRadius: 14,
                        padding: 14,
                        height: 230,
                        display: 'flex',
                        flexDirection: 'column',
                      }}>
                        <textarea
                          value={text}
                          onChange={e => setText(e.target.value)}
                          placeholder={`Paste invoice text or lease clauses...`}
                          style={{
                            width: '100%',
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--c-text-1)',
                            fontSize: 14,
                            lineHeight: 1.6,
                            resize: 'none',
                            outline: 'none',
                            fontFamily: 'Inter, sans-serif',
                          }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid var(--c-border)' }}>
                          <span style={{ fontSize: 11, color: 'var(--c-text-3)', fontFamily: 'IBM Plex Mono, monospace' }}>
                            {text.length > 0 ? `${text.length} characters` : 'Ready for input'}
                          </span>
                          {text.length > 0 && (
                            <button
                              onClick={() => setText('')}
                              style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-danger)', cursor: 'pointer', background: 'none', border: 'none' }}
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 1-Tap Sample Auto-Fill Button */}
                      <button
                        onClick={handleApplySample}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          padding: '12px 14px',
                          borderRadius: 10,
                          background: 'var(--c-surface-1)',
                          border: '1px solid var(--c-border-md)',
                          color: 'var(--c-text-2)',
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <Zap size={13} color="var(--c-text-1)" />
                        Auto-fill Sample {state.domain === 'bill' ? 'Medical Bill' : 'Rental Lease'}
                      </button>
                    </div>
                  )}

                  {/* FILE UPLOAD TAB */}
                  {tab === 'upload' && (
                    <div
                      onClick={() => fileRef.current?.click()}
                      style={{
                        background: 'var(--c-surface-1)',
                        border: '1.5px dashed var(--c-border-md)',
                        borderRadius: 16,
                        padding: '44px 20px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 12,
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      <input ref={fileRef} type="file" accept=".pdf,image/*" style={{ display: 'none' }} />
                      <div style={{
                        width: 52,
                        height: 52,
                        borderRadius: 14,
                        background: 'var(--c-surface-2)',
                        border: '1px solid var(--c-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <FileUp size={24} color="var(--c-text-1)" />
                      </div>
                      <div>
                        <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--c-text-1)', marginBottom: 3 }}>
                          Select Document File
                        </p>
                        <p style={{ fontSize: 13, color: 'var(--c-text-2)', margin: 0 }}>
                          PDF, JPG, or PNG from your device
                        </p>
                      </div>
                      <div style={{
                        padding: '4px 10px',
                        borderRadius: 12,
                        background: 'var(--c-surface-2)',
                        border: '1px solid var(--c-border)',
                        fontSize: 11,
                        fontWeight: 600,
                        color: 'var(--c-text-3)',
                      }}>
                        Max 15 MB
                      </div>
                    </div>
                  )}

                  {/* LIVE CAMERA TAB */}
                  {tab === 'camera' && (
                    <div style={{
                      height: 260,
                      borderRadius: 16,
                      background: 'var(--c-surface-1)',
                      border: '1px solid var(--c-border-md)',
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      gap: 12,
                    }}>
                      <div style={{
                        position: 'absolute',
                        width: '80%',
                        height: '75%',
                        border: '1px dashed rgba(255, 255, 255, 0.25)',
                        borderRadius: 12,
                        pointerEvents: 'none',
                      }}>
                        <motion.div
                          animate={{ y: [0, 160, 0] }}
                          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                          style={{
                            height: 1.5,
                            width: '100%',
                            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.7), transparent)',
                          }}
                        />
                      </div>

                      <Camera size={36} color="var(--c-text-3)" />
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--c-text-2)', zIndex: 2 }}>
                        Position document inside frame
                      </span>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div style={{ padding: '20px 20px 0' }}>
            <button
              onClick={handleAnalyze}
              className="btn-primary"
            >
              <Sparkles size={16} />
              Run Forensic AI Analysis
            </button>
          </div>

        </div>
      </IonContent>
    </IonPage>
  );
};
