import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import { useState, useEffect } from 'react';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';
import Alert from '@mui/material/Alert';
import { useAuth } from '../context/AuthContext';
import BaseModal from './BaseModal';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register';
}

interface GoogleAuthMessage {
  source: string;
  success?: boolean;
  token?: string;
  refreshToken?: string;
  user?: {
    id: number;
    email: string;
    name: string;
    firstName: string;
    lastName: string;
    roles: { [key: string]: string };
  };
  error?: string;
  message?: string;
}

export default function AuthModal({ open, onClose, initialTab }: AuthModalProps) {
  const { loginWithGoogle } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>(initialTab ?? 'login');
  const [googleLoginError, setGoogleLoginError] = useState<string | null>(null);
  const [googleLoginSuccess, setGoogleLoginSuccess] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(open);

  // Listen for custom event to open modal
  useEffect(() => {
    const handleOpenAuthModal = () => {
      setIsOpen(true);
      setTab('login');
    };

    window.addEventListener('open-auth-modal', handleOpenAuthModal);
    return () => {
      window.removeEventListener('open-auth-modal', handleOpenAuthModal);
    };
  }, []);

  // Sync with prop changes
  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  // Sync tab when initialTab prop changes (e.g. deep-link)
  useEffect(() => {
    if (open && initialTab) {
      setTab(initialTab);
    }
  }, [open, initialTab]);

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  useEffect(() => {
    const handler = (event: MessageEvent<GoogleAuthMessage>) => {
      if (
        typeof event.data === 'object' &&
        event.data !== null &&
        event.data.source === 'google-auth'
      ) {
        try {
          if (event.data.success && event.data.token && event.data.user) {
            loginWithGoogle(event.data);
            setGoogleLoginSuccess(`Willkommen, ${event.data.user.name}!`);
            setGoogleLoginError(null);
            
            setTimeout(() => {
              handleClose();
              setGoogleLoginSuccess(null);
            }, 1500);
            
          } else {
            const errorMessage = event.data.message || event.data.error || 'Unbekannter Fehler';
            setGoogleLoginError(`Google-Login fehlgeschlagen: ${errorMessage}`);
            setGoogleLoginSuccess(null);
          }
        } catch (error) {
          setGoogleLoginError('Fehler bei der Verarbeitung der Google-Authentifizierung');
          setGoogleLoginSuccess(null);
        }
      }
    };

    window.addEventListener('message', handler);
    
    return () => {
      window.removeEventListener('message', handler);
    };
  }, [loginWithGoogle, onClose]);

  useEffect(() => {
    if (googleLoginError || googleLoginSuccess) {
      const timer = setTimeout(() => {
        setGoogleLoginError(null);
        setGoogleLoginSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [googleLoginError, googleLoginSuccess]);

  if (!isOpen) return null;

  return (
    <BaseModal 
      open={isOpen} 
      onClose={handleClose} 
      maxWidth="sm"
      title={
        <Tabs 
          value={tab} 
          onChange={(_, v) => setTab(v)} 
          variant="fullWidth"
          sx={{ 
            width: '100%',
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Tab label="Login" value="login" />
          <Tab label="Register" value="register" />
        </Tabs>
      }
      showCloseButton={true}
    >
      <Box>
        {googleLoginError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {googleLoginError}
          </Alert>
        )}
        
        {googleLoginSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {googleLoginSuccess}
          </Alert>
        )}
        
        {tab === 'login'
          ? <LoginForm onSuccess={handleClose} onClose={handleClose} />
          : <RegisterForm onSwitchToLogin={() => setTab('login')} />
        }
      </Box>
    </BaseModal>
  );
}
