import React from 'react';
import { ConfirmationModal } from './ConfirmationModal';

interface CupDeleteConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  cupName?: string;
}

export const CupDeleteConfirmationModal: React.FC<CupDeleteConfirmationModalProps> = ({
  open,
  onClose,
  onConfirm,
  cupName,
}) => (
  <ConfirmationModal
    open={open}
    onClose={onClose}
    onConfirm={onConfirm}
    title="Pokal löschen?"
    message={`Soll der Pokal${cupName ? ` "${cupName}"` : ''} wirklich entfernt werden?`}
    confirmText="Löschen"
    confirmColor="error"
  />
);

export default CupDeleteConfirmationModal;
