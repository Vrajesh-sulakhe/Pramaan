import React, { useState } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHistory } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { ArrowRight, Scale, CheckCircle2, Zap } from 'lucide-react';

interface Slide {
  badge: string;
  title: string;
  description: string;
  visual: React.ReactNode;
}

const SlideScanVisual = () => (
  <div style={{ width: '100%', maxWidth: 320, margin: '0 auto' }}>
    <div style={{
      background: 'var(--c-surface-1)',
      border: '1px solid var(--c-border-md)',
      borderRadius: 16,
      padding: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--c-text-1)' }} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.6px', color: 'var(--c-text-1)' }}>HOSPITAL INVOICE #8921</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'var(--c-surface-2)', borderRadius: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--c-text-1)', fontWeight: 500 }}>Brain MRI (3.0 Tesla)</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-danger)' }}>₹45,000</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'var(--c-surface-2)', borderRadius: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--c-text-1)', fontWeight: 500 }}>Consultation Fee</span>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--c-text-2)' }}>₹500</span>
        </div>
      </div>

      <div style={{
        border: '1px solid var(--c-danger-border)',
        background: 'var(--c-danger-bg)',
        borderRadius: 8,
        padding: '8px 10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--c-text-1)' }}>CGHS Statutory Ceiling</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-danger)' }}>+ ₹27,000 GAP</span>
      </div>
    </div>
  </div>
);

const SlideRulesVisual = () => (
  <div style={{ width: '100%', maxWidth: 320, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
    <div style={{
      background: 'var(--c-surface-1)',
      border: '1px solid var(--c-border-md)',
      borderRadius: 14,
      padding: 14,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Scale size={18} color="var(--c-text-1)" />
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-text-1)' }}>CGHS Official Ceiling</div>
        <div style={{ fontSize: 12, color: 'var(--c-text-2)', marginTop: 2 }}>Cap is fixed at ₹18,000 max</div>
      </div>
    </div>

    <div style={{
      background: 'var(--c-surface-1)',
      border: '1px solid var(--c-border-md)',
      borderRadius: 14,
      padding: 14,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CheckCircle2 size={18} color="var(--c-success)" />
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-text-1)' }}>10,000+ Legal Rules</div>
        <div style={{ fontSize: 12, color: 'var(--c-text-2)', marginTop: 2 }}>Model Rent Act & Tariff Schedules</div>
      </div>
    </div>
  </div>
);

const SlideActionVisual = () => (
  <div style={{ width: '100%', maxWidth: 320, margin: '0 auto' }}>
    <div style={{
      background: 'var(--c-surface-1)',
      border: '1px solid var(--c-border-md)',
      borderRadius: 16,
      padding: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <CheckCircle2 size={15} color="var(--c-success)" />
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-success)' }}>72H REVERSIBLE PROTECTION</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--c-text-1)', marginBottom: 4 }}>₹27,000 Held</div>
      <div style={{ fontSize: 12, color: 'var(--c-text-2)', lineHeight: 1.5 }}>
        Legal notice automatically drafted & ready to send with 1 tap.
      </div>
    </div>
  </div>
);

const slides: Slide[] = [
  {
    badge: 'Step 1 of 3',
    title: 'Scan or Upload\nYour Bill or Lease',
    description: 'Photograph an invoice or lease agreement. The OCR extracts all items, amounts, and legal clauses in seconds.',
    visual: <SlideScanVisual />,
  },
  {
    badge: 'Step 2 of 3',
    title: 'Instant Audit\nAgainst Laws',
    description: 'We verify prices against government statutory rates (CGHS, Rent Acts) to find exact illegal overcharges.',
    visual: <SlideRulesVisual />,
  },
  {
    badge: 'Step 3 of 3',
    title: 'Freeze Funds &\nSend Legal Notice',
    description: 'Safeguard your money with a 72h reversible hold while sending an audit dispute notice directly.',
    visual: <SlideActionVisual />,
  },
];

export const Tutorial: React.FC = () => {
  const [idx, setIdx] = useState(0);
  const history = useHistory();
  const { completeTutorial } = useSession();

  const isLast = idx === slides.length - 1;
  const currentSlide = slides[idx];

  const handleNext = () => {
    if (isLast) {
      completeTutorial();
      history.push('/dashboard');
    } else {
      setIdx(p => p + 1);
    }
  };

  const handleSkip = () => {
    completeTutorial();
    history.push('/dashboard');
  };

  return (
    <IonPage>
      <IonContent fullscreen scrollX={false}>
        <div className="mobile-shell" style={{ justifyContent: 'space-between', padding: '24px 20px', paddingTop: 'calc(var(--sat) + 16px)', paddingBottom: 'calc(var(--sab) + 20px)' }}>

          {/* Top Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--c-text-1)' }} />
              <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.6px', color: 'var(--c-text-1)' }}>PRAMAAN</span>
            </div>
            <button
              onClick={handleSkip}
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--c-text-2)',
                padding: '5px 12px',
                borderRadius: 14,
                background: 'var(--c-surface-1)',
                border: '1px solid var(--c-border)',
                cursor: 'pointer',
              }}
            >
              Skip
            </button>
          </div>

          {/* Visual Showcase */}
          <div style={{ padding: '16px 0', width: '100%' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.97, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                {currentSlide.visual}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Description */}
          <div style={{ width: '100%' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={`text-${idx}`}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
              >
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '3px 8px',
                  borderRadius: 10,
                  background: 'var(--c-surface-2)',
                  border: '1px solid var(--c-border)',
                  color: 'var(--c-text-2)',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.4px',
                  textTransform: 'uppercase',
                  marginBottom: 10,
                }}>
                  <Zap size={10} />
                  {currentSlide.badge}
                </div>

                <h1 style={{
                  fontSize: 26,
                  fontWeight: 800,
                  lineHeight: 1.2,
                  letterSpacing: '-0.5px',
                  color: 'var(--c-text-1)',
                  margin: '0 0 8px 0',
                  whiteSpace: 'pre-line',
                }}>
                  {currentSlide.title}
                </h1>

                <p style={{
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: 'var(--c-text-2)',
                  margin: 0,
                }}>
                  {currentSlide.description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom Progress & Button */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', marginTop: 16 }}>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
              {slides.map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    width: i === idx ? 24 : 6,
                    background: i === idx ? '#f4f4f5' : 'var(--c-surface-3)',
                  }}
                  transition={{ duration: 0.25 }}
                  style={{ height: 4, borderRadius: 2 }}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="btn-primary"
            >
              {isLast ? 'Get Started' : 'Continue'}
              <ArrowRight size={16} />
            </button>
          </div>

        </div>
      </IonContent>
    </IonPage>
  );
};
