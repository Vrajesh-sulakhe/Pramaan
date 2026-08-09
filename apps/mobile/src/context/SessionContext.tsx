import React, { createContext, useContext, useState } from 'react';

export type CaptureType = 'image' | 'text' | 'file' | 'camera';

interface SessionState {
  captureType: CaptureType | null;
  captureData: string | null; // Base64 image, text string, or filename
  domain: 'bill' | 'lease';
  isTutorialComplete: boolean;
}

interface SessionContextProps {
  state: SessionState;
  setCapture: (type: CaptureType, data: string) => void;
  setDomain: (domain: 'bill' | 'lease') => void;
  completeTutorial: () => void;
  resetSession: () => void;
}

const initialState: SessionState = {
  captureType: null,
  captureData: null,
  domain: 'bill',
  isTutorialComplete: localStorage.getItem('pramaan_tutorial') === 'true',
};

const SessionContext = createContext<SessionContextProps | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<SessionState>(initialState);

  const setCapture = (type: CaptureType, data: string) => {
    setState(prev => ({ ...prev, captureType: type, captureData: data }));
  };

  const setDomain = (domain: 'bill' | 'lease') => {
    setState(prev => ({ ...prev, domain }));
  };

  const completeTutorial = () => {
    localStorage.setItem('pramaan_tutorial', 'true');
    setState(prev => ({ ...prev, isTutorialComplete: true }));
  };

  const resetSession = () => {
    setState(prev => ({ ...prev, captureType: null, captureData: null }));
  };

  return (
    <SessionContext.Provider value={{ state, setCapture, setDomain, completeTutorial, resetSession }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used within SessionProvider');
  return context;
};
