import React, { createContext, useContext, useState, useEffect } from 'react';

export type CaptureType = 'image' | 'text' | 'file' | 'camera';

export interface VaultItem {
  id: string;
  title: string;
  domain: 'bill' | 'lease';
  captureType: CaptureType | null;
  captureData: string | null;
  createdAt: string;
  disputedAmount: string;
  disputedNumber: number;
  holdStatus: 'staged' | 'placed' | 'released' | 'resolved';
  proofsCount: number;
  gapCount: number;
  hash: string;
  summary: string;
}

interface SessionState {
  captureType: CaptureType | null;
  captureData: string | null; // Base64 image, text string, or filename
  domain: 'bill' | 'lease';
  isTutorialComplete: boolean;
  vault: VaultItem[];
  selectedVaultItemId: string | null;
}

interface SessionContextProps {
  state: SessionState;
  setCapture: (type: CaptureType, data: string) => void;
  setDomain: (domain: 'bill' | 'lease') => void;
  completeTutorial: () => void;
  resetSession: () => void;
  saveToVault: (item: VaultItem) => void;
  updateVaultItemHold: (id: string, status: 'staged' | 'placed' | 'released' | 'resolved') => void;
  deleteFromVault: (id: string) => void;
  clearVault: () => void;
  selectVaultItem: (id: string | null) => void;
}

const DEFAULT_VAULT_ITEMS: VaultItem[] = [
  {
    id: 'case-8921',
    title: 'Fortis Healthcare — Brain MRI 3.0T',
    domain: 'bill',
    captureType: 'text',
    captureData: `HOSPITAL INVOICE #8921\n1. Brain MRI with Contrast (3.0 Tesla): ₹45,000 (CGHS Ceiling: ₹18,000)\n2. Specialist Consultation: ₹500\n3. Nursing Charges: ₹1,200`,
    createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    disputedAmount: '₹27,000',
    disputedNumber: 27000,
    holdStatus: 'placed',
    proofsCount: 3,
    gapCount: 1,
    hash: '0x8f19b4e2a77c90e',
    summary: 'CGHS Entry 214 rate ceiling violated. Disputed overcharge frozen in 72h reversible escrow.',
  },
  {
    id: 'case-4412',
    title: 'Prestige Lakeside — 3BHK Lease Agreement',
    domain: 'lease',
    captureType: 'text',
    captureData: `RESIDENTIAL LEASE AGREEMENT\n1. Monthly Rent: ₹35,000\n2. Security Deposit: ₹3,50,000 (10 Months Demanded)\n3. Annual Escalation: 15% automatic`,
    createdAt: new Date(Date.now() - 3600 * 1000 * 26).toISOString(),
    disputedAmount: '₹2,80,000',
    disputedNumber: 280000,
    holdStatus: 'staged',
    proofsCount: 2,
    gapCount: 1,
    hash: '0x3c77d018fe49a12',
    summary: 'Model Rent Act Sec. 4 deposit ceiling (2 months max) violated by 8 months excess demand.',
  }
];

const loadVaultFromStorage = (): VaultItem[] => {
  try {
    const saved = localStorage.getItem('pramaan_evidence_vault');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to load vault from localStorage', e);
  }
  return DEFAULT_VAULT_ITEMS;
};

const initialState: SessionState = {
  captureType: null,
  captureData: null,
  domain: 'bill',
  isTutorialComplete: localStorage.getItem('pramaan_tutorial_completed') === 'true',
  vault: loadVaultFromStorage(),
  selectedVaultItemId: null,
};

const SessionContext = createContext<SessionContextProps | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<SessionState>(initialState);

  useEffect(() => {
    try {
      localStorage.setItem('pramaan_evidence_vault', JSON.stringify(state.vault));
    } catch (e) {
      console.error('Failed to save vault to localStorage', e);
    }
  }, [state.vault]);

  const setCapture = (type: CaptureType, data: string) => {
    setState(prev => ({ ...prev, captureType: type, captureData: data }));
  };

  const setDomain = (domain: 'bill' | 'lease') => {
    setState(prev => ({ ...prev, domain }));
  };

  const completeTutorial = () => {
    localStorage.setItem('pramaan_tutorial_completed', 'true');
    setState(prev => ({ ...prev, isTutorialComplete: true }));
  };

  const resetSession = () => {
    setState(prev => ({ ...prev, captureType: null, captureData: null, selectedVaultItemId: null }));
  };

  const saveToVault = (item: VaultItem) => {
    setState(prev => {
      const existsIndex = prev.vault.findIndex(v => v.id === item.id);
      let updated: VaultItem[];
      if (existsIndex >= 0) {
        updated = [...prev.vault];
        updated[existsIndex] = item;
      } else {
        updated = [item, ...prev.vault];
      }
      return { ...prev, vault: updated };
    });
  };

  const updateVaultItemHold = (id: string, status: 'staged' | 'placed' | 'released' | 'resolved') => {
    setState(prev => {
      const updated = prev.vault.map(v => v.id === id ? { ...v, holdStatus: status } : v);
      return { ...prev, vault: updated };
    });
  };

  const deleteFromVault = (id: string) => {
    setState(prev => ({
      ...prev,
      vault: prev.vault.filter(v => v.id !== id),
    }));
  };

  const clearVault = () => {
    setState(prev => ({ ...prev, vault: [] }));
  };

  const selectVaultItem = (id: string | null) => {
    setState(prev => ({ ...prev, selectedVaultItemId: id }));
  };

  return (
    <SessionContext.Provider value={{ 
      state, 
      setCapture, 
      setDomain, 
      completeTutorial, 
      resetSession, 
      saveToVault, 
      updateVaultItemHold, 
      deleteFromVault, 
      clearVault,
      selectVaultItem
    }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used within SessionProvider');
  return context;
};
