import React, { useEffect, useState } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { BBoxOverlay } from '../components/BBoxOverlay';
import { ProofCard } from '../components/ProofCard';
import { HoldChip } from '../components/HoldChip';
import { DraftLetter } from '../components/DraftLetter';
import { ConsentButton } from '../components/ConsentButton';
import { AuditViewer } from '../components/AuditViewer';
import { fetchRun, consent } from '../data/dataSource';
import { RunResponse } from '../data/mockRun';
import { useSession } from '../context/SessionContext';
import { ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export const Results: React.FC = () => {
  const [data, setData] = useState<RunResponse | null>(null);
  const { state, resetSession } = useSession();
  const history = useHistory();

  useEffect(() => {
    // Pass the session state to fetchRun to get dynamic mock data
    fetchRun({ domain: state.domain, captureType: state.captureType, captureData: state.captureData }).then((res: any) => setData(res));
  }, [state.domain, state.captureType, state.captureData]);

  const handleHoldTap = async () => {
    if (data?.hold.status === 'staged') {
      const res = await consent(data.id, 'confirm_hold');
      setData({
        ...data,
        hold: { ...data.hold, status: 'placed' },
        audit: [...data.audit, res.audit]
      });
    }
  };

  const handleWithdraw = async () => {
    if (data?.hold.status === 'placed') {
      const res = await consent(data.id, 'withdraw_hold');
      setData({
        ...data,
        hold: { ...data.hold, status: 'released' },
        audit: [...data.audit, res.audit]
      });
    }
  };

  const handleBack = () => {
    resetSession();
    history.push('/dashboard');
  };

  if (!data) return null; // Or a small spinner

  return (
    <IonPage>
      <IonContent fullscreen className="app-container">
        
        {/* Header */}
        <div style={{ padding: '48px 24px 0', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div onClick={handleBack} style={{ padding: 8, cursor: 'pointer', background: 'var(--glass-bg)', borderRadius: '50%' }}>
            <ChevronLeft size={24} color="var(--glass-text)" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Analysis Complete</h1>
        </div>

        {/* MIDDLE: OCR Document View or Text View */}
        <div style={{ padding: '24px 24px 0' }}>
          <BBoxOverlay 
            captureType={state.captureType}
            captureData={state.captureData}
            fields={data.fields}
            onConfirmField={(id) => {
              const newFields = data.fields.map(f => f.id === id ? { ...f, low_conf: false } : f);
              setData({ ...data, fields: newFields });
            }}
          />
        </div>

        {/* PROOFS */}
        <div className="proof-stack">
          {data.proofs.map((proof, i) => (
            <motion.div
              key={proof.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <ProofCard {...proof} />
            </motion.div>
          ))}

          {/* AUDIT */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <AuditViewer audit={data.audit} />
          </motion.div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <motion.div 
          className="action-bar"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', damping: 20, delay: 0.3 }}
        >
          <HoldChip 
            status={data.hold.status} 
            amount={data.hold.amount} 
            onTap={handleHoldTap}
          />
          
          {data.hold.status === 'placed' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
              <DraftLetter previewText={data.draftText} />
              <div style={{ display: 'flex', gap: 12 }}>
                <ConsentButton 
                  label="Withdraw" 
                  variant="secondary" 
                  fullWidth 
                  onClick={handleWithdraw}
                />
                <ConsentButton 
                  label="Confirm & Send" 
                  variant="primary" 
                  fullWidth 
                />
              </div>
            </motion.div>
          )}
        </motion.div>

      </IonContent>
    </IonPage>
  );
};
