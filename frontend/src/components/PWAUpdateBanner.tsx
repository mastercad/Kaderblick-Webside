import React, { useEffect, useRef, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import {
  Snackbar,
  Alert,
  Button,
  Stack,
  Typography,
} from '@mui/material';
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt';

const RELOAD_DELAY_MS = 1500; // kurze Pause bevor Seite neugeladen wird

/**
 * Zeigt einen Snackbar-Banner an, wenn eine neue App-Version bereit steht.
 *
 * Flow:
 *  1. Neuer Service Worker installiert sich und geht in den "waiting"-Status.
 *  2. VitePWA erkennt das und setzt needRefresh = true.
 *  3. Dieser Banner erscheint mit zwei Optionen:
 *     a) "Jetzt aktualisieren" → sendet SKIP_WAITING an den SW → Seite lädt neu.
 *     b) "Später" → Banner wird für diese Sitzung ausgeblendet (Update kommt
 *        beim nächsten Seitenaufruf automatisch).
 */
export const PWAUpdateBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [updating, setUpdating] = useState(false);
  const reloadTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl: string, r: ServiceWorkerRegistration | undefined) {
      // Alle 30 Minuten im Hintergrund auf Updates prüfen
      if (r) {
        setInterval(async () => {
          if (!r.installing && navigator.onLine) {
            await r.update();
          }
        }, 30 * 60 * 1000);
      }
    },
    onRegisterError(error: unknown) {
      console.error('[PWA] Service Worker Registrierung fehlgeschlagen:', error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      setVisible(true);
    }
  }, [needRefresh]);

  const handleUpdate = () => {
    setUpdating(true);
    // Kurze Verzögerung, damit der Nutzer das Feedback sieht
    reloadTimeout.current = setTimeout(() => {
      updateServiceWorker(true);
    }, RELOAD_DELAY_MS);
  };

  const handleDismiss = () => {
    setVisible(false);
  };

  // Cleanup beim Unmount
  useEffect(() => {
    return () => {
      if (reloadTimeout.current) clearTimeout(reloadTimeout.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <Snackbar
      open={visible}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{ mb: { xs: '64px', md: 2 } }} // Platz für mobile Bottom-Navigation
    >
      <Alert
        icon={<SystemUpdateAltIcon />}
        severity="info"
        variant="filled"
        sx={{ width: '100%', maxWidth: 480, alignItems: 'center' }}
        action={
          <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
            <Button
              size="small"
              color="inherit"
              variant="outlined"
              onClick={handleDismiss}
              disabled={updating}
              sx={{ whiteSpace: 'nowrap', borderColor: 'rgba(255,255,255,0.5)' }}
            >
              Später
            </Button>
            <Button
              size="small"
              color="inherit"
              variant="contained"
              onClick={handleUpdate}
              disabled={updating}
              sx={{
                whiteSpace: 'nowrap',
                bgcolor: 'rgba(255,255,255,0.2)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.35)' },
              }}
            >
              {updating ? 'Wird aktualisiert…' : 'Jetzt aktualisieren'}
            </Button>
          </Stack>
        }
      >
        <Typography variant="body2" fontWeight={600}>
          Version {__APP_VERSION__} verfügbar
        </Typography>
        <Typography variant="caption" display="block" sx={{ opacity: 0.9 }}>
          Ein Update steht bereit – jetzt neu laden für die neuesten Features.
        </Typography>
      </Alert>
    </Snackbar>
  );
};
