import React, { useEffect, useState } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanSearch, FileSearch, Calculator, ShieldAlert, Cpu } from 'lucide-react';

const steps = [
  { icon: <ScanSearch size={32} />, text: 'Extracting entities via OCR...' },
  { icon: <FileSearch size={32} />, text: 'Querying vector DB for rules...' },
  { icon: <Calculator size={32} />, text: 'Computing mathematical gaps...' },
  { icon: <ShieldAlert size={32} />, text: 'Generating verifiable proofs...' },
  { icon: <Cpu size={32} />, text: 'Drafting legal response...' },
];

export const Analyze: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const history = useHistory();

  useEffect(() => {
    if (currentStep < steps.length) {
      const timer = setTimeout(() => setCurrentStep(prev => prev + 1), 800);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => history.push('/results'), 400);
      return () => clearTimeout(timer);
    }
  }, [currentStep, history]);

  return (
    <IonPage>
      <IonContent fullscreen className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 32 }}>
          
          {/* Pulsing Orb */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)',
              marginBottom: 48,
              boxShadow: '0 0 40px rgba(255,255,255,0.2)'
            }}
          />

          <AnimatePresence mode="wait">
            {currentStep < steps.length && (
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
              >
                <div style={{ color: 'var(--glass-text)', opacity: 0.9 }}>
                  {steps[currentStep].icon}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--glass-text)', margin: 0, textAlign: 'center' }}>
                  {steps[currentStep].text}
                </h3>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress Bar */}
          <div style={{ width: '100%', height: 4, background: 'var(--glass-border)', borderRadius: 2, marginTop: 48, overflow: 'hidden' }}>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep) / steps.length) * 100}%` }}
              transition={{ duration: 0.5 }}
              style={{ height: '100%', background: 'var(--glass-highlight)' }}
            />
          </div>

        </div>

      </IonContent>
    </IonPage>
  );
};
