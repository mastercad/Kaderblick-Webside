import React from 'react';
import { Box } from '@mui/material';
import FeedbackFab from './FeedbackFab';
import { useFabStack } from './FabStackProvider';
import { useAuth } from '../context/AuthContext';

const FabStack: React.FC = () => {
  const fabStack = useFabStack();
  const { user } = useAuth();

  // Nur anzeigen wenn User eingeloggt ist
  if (!user) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: { xs: 72, sm: 24 },
        right: { xs: 16, sm: 24 },
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'row',
        gap: 2,
        alignItems: 'center',
        // FABs ausblenden wenn ein Modal offen ist
        ...(fabStack?.hidden ? {
          opacity: 0,
          pointerEvents: 'none',
          transition: 'opacity 0.2s ease',
        } : {
          opacity: 1,
          pointerEvents: 'auto',
          transition: 'opacity 0.2s ease',
        }),
      }}
    >
      <FeedbackFab />
      {fabStack?.fabs.map(fab => (
        <React.Fragment key={fab.key}>{fab.node}</React.Fragment>
      ))}
    </Box>
  );
};

export default FabStack;