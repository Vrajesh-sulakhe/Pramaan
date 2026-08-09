import React, { useState } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { Camera, FileUp, Type, ChevronLeft } from 'lucide-react';
import { ConsentButton } from '../components/ConsentButton';

export const Capture: React.FC = () => {
  const history = useHistory();
  const { setCapture } = useSession();
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'text'>('text');
  const [textInput, setTextInput] = useState('');

  const handleStartAnalysis = () => {
    if (activeTab === 'text') {
      setCapture('text', textInput);
    } else {
      setCapture('image', 'mock_image_data');
    }
    history.push('/analyze');
  };

  return (
    <IonPage>
      <IonContent fullscreen className="app-container">
        
        <div style={{ padding: '48px 24px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div onClick={() => history.goBack()} style={{ padding: 8, cursor: 'pointer', background: 'var(--glass-bg)', borderRadius: '50%' }}>
            <ChevronLeft size={24} color="var(--glass-text)" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Capture Evidence</h1>
        </div>

        <div style={{ padding: 24 }}>
          {/* Tabs */}
          <div className="glass-tree-toggle" style={{ margin: '0 0 24px 0' }}>
            <div className="glass-filter"></div>
            <div className="glass-overlay"></div>
            <div className="glass-specular"></div>
            <div className="glass-content toggle-container">
              <div 
                className="toggle-active-bg" 
                style={{ 
                  width: 'calc(33.33% - 4px)',
                  transform: `translateX(${activeTab === 'camera' ? 0 : activeTab === 'upload' ? '100%' : '200%'})` 
                }}
              ></div>
              
              <button className={`toggle-option ${activeTab === 'camera' ? 'active' : ''}`} onClick={() => setActiveTab('camera')}>
                <Camera size={16} />
              </button>
              <button className={`toggle-option ${activeTab === 'upload' ? 'active' : ''}`} onClick={() => setActiveTab('upload')}>
                <FileUp size={16} />
              </button>
              <button className={`toggle-option ${activeTab === 'text' ? 'active' : ''}`} onClick={() => setActiveTab('text')}>
                <Type size={16} />
              </button>
            </div>
          </div>

          <div className="glass-proof-card" style={{ padding: 24, minHeight: 300 }}>
            <div className="glass-filter"></div>
            <div className="glass-overlay"></div>
            <div className="glass-specular"></div>
            <div className="glass-content" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              
              {activeTab === 'camera' && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
                  <Camera size={48} style={{ opacity: 0.5 }} />
                  <span style={{ opacity: 0.7 }}>Camera view simulated</span>
                </div>
              )}

              {activeTab === 'upload' && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, border: '2px dashed var(--glass-border)', borderRadius: 12 }}>
                  <FileUp size={48} style={{ opacity: 0.5 }} />
                  <span style={{ opacity: 0.7 }}>Tap to select file</span>
                </div>
              )}

              {activeTab === 'text' && (
                <textarea 
                  style={{ 
                    flex: 1, 
                    width: '100%', 
                    background: 'transparent', 
                    border: 'none', 
                    color: 'var(--glass-text)',
                    fontSize: 16,
                    resize: 'none',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                  placeholder="Paste OCR text, rule text, or bill contents here..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                />
              )}
            </div>
          </div>
        </div>

        <div className="action-bar">
          <ConsentButton 
            label="Analyze" 
            variant="primary" 
            fullWidth 
            onClick={handleStartAnalysis}
          />
        </div>

      </IonContent>
    </IonPage>
  );
};
