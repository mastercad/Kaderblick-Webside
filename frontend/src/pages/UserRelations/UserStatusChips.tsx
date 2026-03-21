import React from 'react';
import { Chip } from '@mui/material';
import { UserRow } from './types';

export const VerifiedChip: React.FC<{ user: UserRow; onClick: () => void }> = ({ user, onClick }) =>
  user.isVerified
    ? <Chip label="Verifiziert"       color="success" size="small" sx={{ mr: 0.5, cursor: 'pointer' }} onClick={onClick} />
    : <Chip label="Nicht verifiziert" color="warning" size="small" sx={{ mr: 0.5, cursor: 'pointer' }} onClick={onClick} />;

export const StatusChip: React.FC<{ status: 'pending' | 'approved' | 'rejected' }> = ({ status }) => {
  const map = {
    pending:  { label: 'Ausstehend', color: 'warning' as const },
    approved: { label: 'Genehmigt',  color: 'success' as const },
    rejected: { label: 'Abgelehnt',  color: 'error'   as const },
  };
  return <Chip label={map[status].label} color={map[status].color} size="small" />;
};
