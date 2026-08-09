import React, { useEffect, useState } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ShieldAlert, Cpu, Database, ScanSearch, FileCheck2 } from 'lucide-react';

interface Step {
  label: string;
  detail: string;
  icon: React.ElementType;
}

const steps: Step[] = [
  { label: 'Optical Entity Recognition', detail: 'Extracting line items, rate codes & totals…', icon: ScanSearch },
  { label: 'Rule Graph Matching', detail: 'Cross-examining against 10,000+ legal schedules…', icon: Database },
  { label: 'Discrepancy Calculation', detail: 'Computing mathematical gaps & overcharge bounds…', icon: Cpu },
  { label: 'Evidence Sealing', detail: 'Generating cryptographic proof anchor hash…', icon: ShieldAlert },
  { label: 'Notice Generation', detail: 'Drafting structured dispute notice…', icon: FileCheck2 },
];

const STEP_DURATION = 750;

export const Analyze: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const [done, setDone] = useState<number[]>([]);
  const history = useHistory();

  useEffect(() => {
    if (current < steps.length) {
      const t = setTimeout(() => {
        setDone(p => [...p, current]);
        setCurrent(p => p + 1);
      }, STEP_DURATION);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => history.push('/results'), 400);
      return () => clearTimeout(t);
    }
  }, [current, history]);

  const pct = Math.round((done.length / steps.length) * 100);

  return (
    <IonPage>
      <IonContent fullscreen scrollX={false}>
        <div className="mobile-shell" style={{ justifyContent: 'space-between', padding: '24px 20px', paddingTop: 'calc(var(--sat) + 20px)', paddingBottom: 'calc(var(--sab) + 20px)' }}>

          {/* Central Progress Ring */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginTop: 16 }}>
            <div style={{
              width: 76,
              height: 76,
              borderRadius: '50%',
              background: 'var(--c-surface-1)',
              border: '1px solid var(--c-border-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              marginBottom: 16,
            }}>
              <motion.div
                animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 1.8, repeat: Infinity }}
                style={{
                  position: 'absolute',
                  inset: -4,
                  borderRadius: '50%',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                }}
              />
              <Cpu size={32} color="var(--c-text-1)" />
            </div>

            <h1 style={{
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: '-0.4px',
              color: 'var(--c-text-1)',
              margin: '0 0 6px 0',
            }}>
              Auditing Evidence…
            </h1>
            <p style={{ fontSize: 13, color: 'var(--c-text-2)', margin: 0 }}>
              Deterministic statutory verification in progress
            </p>
          </div>

          {/* Stepper Card */}
          <div style={{
            background: 'var(--c-surface-1)',
            border: '1px solid var(--c-border-md)',
            borderRadius: 16,
            padding: '10px 14px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}>
            {steps.map((step, i) => {
              const isDone = done.includes(i);
              const isActive = current === i;
              const StepIcon = step.icon;

              return (
                <React.Fragment key={i}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 6px',
                    opacity: isDone || isActive ? 1 : 0.35,
                    transition: 'all 0.25s ease',
                  }}>
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: 7,
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isDone ? 'var(--c-success-bg)' : 'var(--c-surface-2)',
                      border: `1px solid ${isDone ? 'var(--c-success-border)' : 'var(--c-border)'}`,
                    }}>
                      <AnimatePresence mode="wait">
                        {isDone ? (
                          <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                            <Check size={14} color="var(--c-success)" strokeWidth={2.5} />
                          </motion.div>
                        ) : isActive ? (
                          <motion.div
                            key="spin"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            style={{ width: 12, height: 12, borderRadius: '50%', border: '1.5px solid var(--c-text-1)', borderTopColor: 'transparent' }}
                          />
                        ) : (
                          <StepIcon size={14} color="var(--c-text-3)" />
                        )}
                      </AnimatePresence>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: isDone || isActive ? 'var(--c-text-1)' : 'var(--c-text-3)',
                      }}>
                        {step.label}
                      </div>
                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          style={{ fontSize: 11, fontWeight: 500, color: 'var(--c-text-2)', marginTop: 2 }}
                        >
                          {step.detail}
                        </motion.div>
                      )}
                    </div>
                  </div>
                  {i < steps.length - 1 && (
                    <div style={{ height: 1, background: 'var(--c-border)', marginLeft: 40 }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Progress Bar */}
          <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-text-3)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Pipeline Progress
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text-1)', fontFamily: 'IBM Plex Mono, monospace' }}>
                {pct}%
              </span>
            </div>
            <div style={{ width: '100%', height: 3, background: 'var(--c-surface-2)', borderRadius: 2, overflow: 'hidden' }}>
              <motion.div
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                style={{ height: '100%', background: '#f4f4f5', borderRadius: 2 }}
              />
            </div>
          </div>

        </div>
      </IonContent>
    </IonPage>
  );
};
