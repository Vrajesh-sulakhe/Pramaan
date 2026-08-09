import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { ConsentButton } from '../components/ConsentButton';
import { Scan, History, Settings } from 'lucide-react';
import { DomainSwitch } from '../components/DomainSwitch';
import { useSession } from '../context/SessionContext';

export const Dashboard: React.FC = () => {
  const history = useHistory();
  const { state, setDomain } = useSession();

  return (
    <IonPage>
      <IonContent fullscreen className="app-container">
        
        {/* Header */}
        <div style={{ padding: '48px 24px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Pramaan</h1>
          <div style={{ padding: 8, background: 'var(--glass-bg)', borderRadius: '50%', backdropFilter: 'blur(10px)' }}>
            <Settings size={20} color="var(--glass-text)" />
          </div>
        </div>

        <DomainSwitch activeDomain={state.domain} onChange={setDomain} />

        <div style={{ padding: 24, marginTop: 40 }}>
          <div 
            className="glass-proof-card" 
            style={{ 
              padding: 32, 
              textAlign: 'center', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              gap: 16
            }}
          >
            <div className="glass-filter"></div>
            <div className="glass-overlay"></div>
            <div className="glass-specular"></div>
            <div className="glass-content">
              <Scan size={48} color="var(--glass-text)" style={{ opacity: 0.8, marginBottom: 16 }} />
              <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0, marginBottom: 8 }}>Ready to scan</h2>
              <p style={{ opacity: 0.7, margin: 0, marginBottom: 24, fontSize: 14 }}>
                Upload a {state.domain === 'bill' ? 'Medical Bill' : 'Rental Lease'} to verify against official rules.
              </p>
              
              <ConsentButton 
                label="New Scan" 
                icon={<Scan />} 
                fullWidth 
                onClick={() => history.push('/capture')}
              />
            </div>
          </div>

          <h3 style={{ marginTop: 48, fontSize: 16, fontWeight: 600, opacity: 0.8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <History size={16} /> Recent Scans
          </h3>
          <div style={{ opacity: 0.5, fontSize: 14, marginTop: 16, textAlign: 'center', padding: 24, border: '1px dashed var(--glass-border)', borderRadius: 16 }}>
            No recent scans
          </div>
        </div>

      </IonContent>
    </IonPage>
  );
};
