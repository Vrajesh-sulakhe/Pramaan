import React, { useState, useRef } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { ChevronLeft, Camera, FileUp, Type, Sparkles, Zap, ShieldCheck } from 'lucide-react';
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

  const sampleBills: Record<string, string> = {
    bill: `HOSPITAL INVOICE #2024-8831
Patient: Rahul Sharma
Date: 14/08/2024
Department: Radiology & Diagnostic

1. Brain MRI with Contrast (3.0 Tesla): ₹8,500 (CGHS Cap: ₹6,400)
2. Paracetamol 500mg Tablets x 10: ₹45 (DPCO Cap: ₹2)
3. Complete Blood Count (CBC): ₹150

Total Amount Billed: ₹8,695`,
    lease: `RESIDENTIAL LEASE AGREEMENT
Landlord: Green Real Estate
Tenant: Priya Mehta
Property: Apt 4B, Koramangala 5th Block

1. Monthly Rent: ₹35,000 / month
2. Security Deposit: ₹3,50,000 (10 Months Demanded - Legal Ceiling: 2 Months)
3. Annual Escalation: 15% automatic yearly increase`,
    gig_payslip: `AGGREGATOR WEEKLY DRIVER SETTLEMENT
Driver: Suresh Kumar
Platform: QuickRide Aggregator
Week: 01 Aug - 07 Aug 2025

1. Gross Customer Fare Billed: ₹5,000
2. Platform Commission Deducted: ₹2,200 (44%)
3. Driver Net Payout: ₹2,800 (56%)
(Note: MoRTH 2025 Clause 17 mandates minimum 80% driver payout: ₹4,000)`,
    insurance: `TPA HEALTH CLAIM SETTLEMENT SUMMARY
Policyholder: Anita Roy
Insurer: Star Health Assurance
Hospital: City Multispeciality

1. Total Incurred Hospital Bill: ₹1,20,000
2. Approved Amount Settled: ₹85,000
3. Disallowed Room Rent Proportionate Deduction: ₹35,000 (Violates IRDAI 2024)`,
    medicine: `PHARMACY CASH MEMO & TAX INVOICE
Store: MedPlus Chemist & Druggist
Date: 10/08/2025

1. Paracetamol 650mg Strip of 10: ₹45 (NPPA DPCO Price Ceiling: ₹22)
2. Azithromycin Tablets IP 500mg (Batch AYC-2407): ₹185 (Flagged under CDSCO NSQ Safety Recall)`,
    challan: `TRAFFIC E-CHALLAN VIOLATION NOTICE
Notice No: DL-8849-2025-CH
Vehicle No: DL-03-CC-9120

1. Alleged Offense: Section 183 MV Act (Speed Violation: 74 km/h in 60 km/h zone)
2. Fine Demanded: ₹2,000
(Note: Lacks mandatory Section 136A electronic speed camera calibration proof)`,
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
              paddingTop: 'calc(var(--sat) + 12px)',
              paddingLeft: 20,
              paddingRight: 20,
              paddingBottom: 16,
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(5, 5, 8, 0.85)',
              backdropFilter: 'blur(20px)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={() => history.goBack()}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#ffffff',
                  }}
                >
                  <ChevronLeft size={22} />
                </button>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--c-text-3)', margin: 0, marginBottom: 2 }}>
                    Evidence Input
                  </p>
                  <h1 style={{ fontSize: 19, fontWeight: 900, letterSpacing: '-0.4px', color: '#ffffff', margin: 0 }}>
                    {state.domain === 'bill' ? 'Scan Medical Bill' : 'Upload Lease Agreement'}
                  </h1>
                </div>
              </div>
            </div>

            {/* Segmented Mode Selector */}
            <div style={{ padding: '16px 20px' }}>
              <div style={{
                display: 'flex',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 14,
                padding: 4,
                gap: 4,
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.6)',
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
                        height: 40,
                        borderRadius: 10,
                        fontSize: 13,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        cursor: 'pointer',
                        fontFamily: 'Inter, sans-serif',
                        transition: 'all 0.15s ease',
                        background: active ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                        color: active ? '#ffffff' : 'var(--c-text-3)',
                        border: active ? '1px solid rgba(255, 255, 255, 0.18)' : '1px solid transparent',
                        boxShadow: active ? '0 4px 12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)' : 'none',
                      }}
                    >
                      <Icon size={16} color={active ? '#ffffff' : 'var(--c-text-3)'} />
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
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* TEXT INPUT TAB */}
                  {tab === 'text' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.035)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: 18,
                        padding: 16,
                        height: 240,
                        display: 'flex',
                        flexDirection: 'column',
                      }}>
                        <textarea
                          value={text}
                          onChange={e => setText(e.target.value)}
                          placeholder={`Paste invoice text or lease clauses here...`}
                          style={{
                            width: '100%',
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            color: '#ffffff',
                            fontSize: 14,
                            lineHeight: 1.65,
                            resize: 'none',
                            outline: 'none',
                            fontFamily: 'Inter, sans-serif',
                          }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                          <span style={{ fontSize: 11, color: 'var(--c-text-3)', fontFamily: 'IBM Plex Mono, monospace' }}>
                            {text.length > 0 ? `${text.length} characters` : 'Ready for input'}
                          </span>
                          {text.length > 0 && (
                            <button
                              onClick={() => setText('')}
                              style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-danger)', cursor: 'pointer', background: 'none', border: 'none' }}
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 1-Tap Quick Sample Auto-Fill Button */}
                      <button
                        onClick={handleApplySample}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          padding: '13px 16px',
                          borderRadius: 14,
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                          color: '#ffffff',
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <Zap size={14} color="#ffffff" />
                        Auto-fill Sample {state.domain === 'bill' ? 'Medical Bill (MRI Cap Violation)' : 'Rental Lease (Deposit Dispute)'}
                      </button>
                    </div>
                  )}

                  {/* FILE UPLOAD TAB */}
                  {tab === 'upload' && (
                    <div
                      onClick={() => fileRef.current?.click()}
                      style={{
                        background: 'rgba(255, 255, 255, 0.035)',
                        border: '1.5px dashed rgba(255, 255, 255, 0.18)',
                        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: 20,
                        padding: '48px 20px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 14,
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      <input ref={fileRef} type="file" accept=".pdf,image/*" style={{ display: 'none' }} />
                      <div style={{
                        width: 58,
                        height: 58,
                        borderRadius: 16,
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <FileUp size={28} color="#ffffff" />
                      </div>
                      <div>
                        <p style={{ fontSize: 16, fontWeight: 800, color: '#ffffff', marginBottom: 4 }}>
                          Select Document File
                        </p>
                        <p style={{ fontSize: 13, color: 'var(--c-text-2)', margin: 0 }}>
                          Tap to select PDF, JPG, or PNG from device
                        </p>
                      </div>
                      <div style={{
                        padding: '5px 12px',
                        borderRadius: 20,
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--c-text-3)',
                      }}>
                        Max 15 MB
                      </div>
                    </div>
                  )}

                  {/* LIVE CAMERA TAB */}
                  {tab === 'camera' && (
                    <div style={{
                      height: 280,
                      borderRadius: 20,
                      background: 'rgba(255, 255, 255, 0.035)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      gap: 14,
                    }}>
                      {/* Viewfinder Target Laser */}
                      <div style={{
                        position: 'absolute',
                        width: '80%',
                        height: '75%',
                        border: '1.5px dashed rgba(255, 255, 255, 0.35)',
                        borderRadius: 14,
                        pointerEvents: 'none',
                      }}>
                        <motion.div
                          animate={{ y: [0, 180, 0] }}
                          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                          style={{
                            height: 1.5,
                            width: '100%',
                            background: 'linear-gradient(90deg, transparent, #ffffff, transparent)',
                            boxShadow: '0 0 12px rgba(255, 255, 255, 0.8)',
                          }}
                        />
                      </div>

                      <Camera size={40} color="var(--c-text-3)" />
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#ffffff', zIndex: 2 }}>
                        Position document inside frame
                      </span>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div style={{ padding: '24px 20px 0' }}>
            <button
              onClick={handleAnalyze}
              className="btn-primary"
            >
              <Sparkles size={17} />
              Run Forensic AI Analysis
            </button>
          </div>

        </div>
      </IonContent>
    </IonPage>
  );
};
