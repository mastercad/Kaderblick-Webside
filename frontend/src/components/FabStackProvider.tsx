import React, { createContext, useContext, useCallback, useRef, useState } from 'react';

type FabStackContextType = {
  addFab: (fab: React.ReactNode, key: string) => void;
  removeFab: (key: string) => void;
  fabs: { key: string; node: React.ReactNode }[];
  /** Increment modal counter – hides FABs while any modal is open */
  hideForModal: () => void;
  /** Decrement modal counter – shows FABs when all modals closed */
  showAfterModal: () => void;
  hidden: boolean;
};

const FabStackContext = createContext<FabStackContextType | undefined>(undefined);

export const useFabStack = () => useContext(FabStackContext);

const FabStackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fabs, setFabs] = useState<{ key: string; node: React.ReactNode }[]>([]);
  const [modalCount, setModalCount] = useState(0);

  const addFab = (fab: React.ReactNode, key: string) => {
    setFabs(prev => {
      if (prev.some(f => f.key === key)) return prev;
      return [...prev, { key, node: fab }];
    });
  };
  const removeFab = (key: string) => {
    setFabs(prev => prev.filter(f => f.key !== key));
  };

  const hideForModal = useCallback(() => setModalCount(c => c + 1), []);
  const showAfterModal = useCallback(() => setModalCount(c => Math.max(0, c - 1)), []);

  return (
    <FabStackContext.Provider value={{ addFab, removeFab, fabs, hideForModal, showAfterModal, hidden: modalCount > 0 }}>
      {children}
    </FabStackContext.Provider>
  );
};

export default FabStackProvider;