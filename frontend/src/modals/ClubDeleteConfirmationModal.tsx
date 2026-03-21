import React from 'react';
import { ConfirmationModal } from './ConfirmationModal';

interface ClubDeleteConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  clubName?: string;
}

export const ClubDeleteConfirmationModal: React.FC<ClubDeleteConfirmationModalProps> = ({
  open,
  onClose,
  onConfirm,
  clubName,
}) => (
  <ConfirmationModal
    open={open}
    onClose={onClose}
    onConfirm={onConfirm}
    title="Verein löschen?"
    message={`Soll der Verein${clubName ? ` "${clubName}"` : ''} wirklich entfernt werden?`}
    confirmText="Löschen"
    confirmColor="error"
  />
);

export default ClubDeleteConfirmationModal;
