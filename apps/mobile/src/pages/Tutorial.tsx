import React, { useState } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHistory } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { ShieldCheck, ScanLine, FileText, ChevronRight } from 'lucide-react';
import { ConsentButton } from '../components/ConsentButton';

const slides = [
  {
    icon: <ScanLine size={48} />,
    title: 'Capture Reality',
    desc: 'Scan a medical bill or upload a rental lease. Pramaan extracts the truth from your documents instantly.'
  },
  {
    icon: <ShieldCheck size={48} />,
    title: 'Verify Against Rules',
    desc: 'Our AI engine compares your document against official rules and laws, finding overcharges and illegal clauses.'
  },
  {
    icon: <FileText size={48} />,
    title: 'Take Action',
    desc: 'We draft the legal response for you. Review the evidence, hold the funds, and send the letter with one tap.'
  }
];

export const Tutorial: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const history = useHistory();
  const { completeTutorial } = useSession();

  const nextSlide = () => {
    if (currentSlide === slides.length - 1) {
      completeTutorial();
      history.push('/dashboard');
    } else {
      setCurrentSlide(prev => prev + 1);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 32, justifyContent: 'center' }}>
          
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AnimatePresence mode="wait">
              <motion.div 
                key={currentSlide}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                style={{ textAlign: 'center' }}
              >
                <div style={{ marginBottom: 24, color: 'var(--glass-text)', opacity: 0.8 }}>
                  {slides[currentSlide].icon}
                </div>
                <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 16 }}>{slides[currentSlide].title}</h1>
                <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.7 }}>
                  {slides[currentSlide].desc}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 48 }}>
            {slides.map((_, i) => (
              <div 
                key={i} 
                style={{ 
                  width: i === currentSlide ? 24 : 8, 
                  height: 8, 
                  borderRadius: 4,
                  background: i === currentSlide ? 'var(--glass-text)' : 'var(--glass-border)',
                  transition: 'width 0.3s ease'
                }} 
              />
            ))}
          </div>

          <ConsentButton 
            label={currentSlide === slides.length - 1 ? "Get Started" : "Next"} 
            icon={<ChevronRight />}
            fullWidth 
            onClick={nextSlide}
          />
        </div>
      </IonContent>
    </IonPage>
  );
};
