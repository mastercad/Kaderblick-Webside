import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MessageDetailPane } from '../messages/MessageDetailPane';
import { Message } from '../messages/types';

// ── MUI-Mocks (einfache HTML-Elemente) ────────────────────────────────────────
jest.mock('@mui/material/Box',              () => ({ children, sx: _sx, component: _c, ...p }: any) => <div>{children}</div>);
jest.mock('@mui/material/Stack',            () => ({ children, direction: _d, spacing: _s, alignItems: _a, ...p }: any) => <div>{children}</div>);
jest.mock('@mui/material/Avatar',           () => ({ children, sx: _sx, ...p }: any) => <span {...p}>{children}</span>);
jest.mock('@mui/material/Typography',       () => ({ children, variant: _v, fontWeight: _fw, sx: _sx, component, ...p }: any) => <span {...p}>{children}</span>);
jest.mock('@mui/material/Button',           () => ({ children, startIcon, onClick, ...p }: any) => <button onClick={onClick} {...p}>{startIcon}{children}</button>);
jest.mock('@mui/material/CircularProgress', () => () => <span data-testid="loading-spinner" />);
jest.mock('@mui/material/Dialog',           () => ({ open, children }: any) => open ? <div data-testid="dialog">{children}</div> : null);
jest.mock('@mui/material/DialogTitle',      () => ({ children }: any) => <div data-testid="dialog-title">{children}</div>);
jest.mock('@mui/material/DialogContent',    () => ({ children }: any) => <div>{children}</div>);
jest.mock('@mui/material/DialogContentText',() => ({ children }: any) => <p>{children}</p>);
jest.mock('@mui/material/DialogActions',    () => ({ children }: any) => <div data-testid="dialog-actions">{children}</div>);

jest.mock('@mui/material/styles', () => ({
  useTheme: () => ({ palette: { mode: 'light', primary: { main: '#1976d2', dark: '#1565c0' } } }),
  alpha:    (_color: string, _opacity: number) => 'rgba(0,0,0,0)',
}));

jest.mock('@mui/icons-material/ArrowBack',       () => () => <span>back</span>);
jest.mock('@mui/icons-material/DeleteOutline',   () => () => <span>delete-icon</span>);
jest.mock('@mui/icons-material/ForwardToInbox',  () => () => <span>forward-icon</span>);
jest.mock('@mui/icons-material/MailOutline',     () => () => <span>mail-icon</span>);
jest.mock('@mui/icons-material/Reply',           () => () => <span>reply-icon</span>);
jest.mock('@mui/icons-material/ReplyAll',        () => () => <span>reply-all-icon</span>);
jest.mock('@mui/icons-material/Send',            () => () => <span>send-icon</span>);

// ── Fixtures ──────────────────────────────────────────────────────────────────

const BASE_MESSAGE: Message = {
  id:       '42',
  subject:  'Trainingsplan',
  sender:   'Max Müller',
  senderId: '5',
  sentAt:   '2026-03-07 10:00:00',
  isRead:   true,
  content:  'Bitte kommt pünktlich.',
  recipients: [{ id: '99', name: 'Anna Schmidt' }],
};

const MESSAGE_MULTI_RECIPIENTS: Message = {
  ...BASE_MESSAGE,
  id: '43',
  recipients: [
    { id: '99', name: 'Anna Schmidt' },
    { id: '100', name: 'Tom Fischer' },
  ],
};

const defaultProps = {
  loading: false,
  isMobile: false,
  isOutbox: false,
  canReply: true,
  onBack:    jest.fn(),
  onReply:   jest.fn(),
  onReplyAll: jest.fn(),
  onResend:  jest.fn(),
  onForward: jest.fn(),
  onDelete:  jest.fn(),
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('MessageDetailPane – canReply', () => {
  beforeEach(() => jest.clearAllMocks());

  it('zeigt "Antworten"-Button wenn canReply=true und Posteingang', () => {
    render(<MessageDetailPane {...defaultProps} message={BASE_MESSAGE} canReply={true} isOutbox={false} />);
    expect(screen.getByText('Antworten')).toBeInTheDocument();
  });

  it('versteckt "Antworten"-Button wenn canReply=false', () => {
    render(<MessageDetailPane {...defaultProps} message={BASE_MESSAGE} canReply={false} isOutbox={false} />);
    expect(screen.queryByText('Antworten')).not.toBeInTheDocument();
  });

  it('zeigt "Erneut senden" statt "Antworten" im Postausgang (isOutbox=true)', () => {
    render(<MessageDetailPane {...defaultProps} message={BASE_MESSAGE} isOutbox={true} canReply={true} />);
    expect(screen.getByText('Erneut senden')).toBeInTheDocument();
    expect(screen.queryByText('Antworten')).not.toBeInTheDocument();
  });

  it('versteckt "Erneut senden" nicht wenn isOutbox=true und canReply=false', () => {
    // Im Ausgang ist canReply irrelevant für "Erneut senden"
    render(<MessageDetailPane {...defaultProps} message={BASE_MESSAGE} isOutbox={true} canReply={false} />);
    expect(screen.getByText('Erneut senden')).toBeInTheDocument();
  });

  it('zeigt "Allen antworten" nur wenn canReply=true UND mehrere Empfänger', () => {
    render(<MessageDetailPane {...defaultProps} message={MESSAGE_MULTI_RECIPIENTS} canReply={true} isOutbox={false} />);
    expect(screen.getByText('Allen antworten')).toBeInTheDocument();
  });

  it('versteckt "Allen antworten" wenn canReply=false', () => {
    render(<MessageDetailPane {...defaultProps} message={MESSAGE_MULTI_RECIPIENTS} canReply={false} isOutbox={false} />);
    expect(screen.queryByText('Allen antworten')).not.toBeInTheDocument();
  });

  it('versteckt "Allen antworten" bei nur einem Empfänger', () => {
    render(<MessageDetailPane {...defaultProps} message={BASE_MESSAGE} canReply={true} isOutbox={false} />);
    expect(screen.queryByText('Allen antworten')).not.toBeInTheDocument();
  });

  it('ruft onReply auf wenn "Antworten" geklickt wird', () => {
    const onReply = jest.fn();
    render(<MessageDetailPane {...defaultProps} message={BASE_MESSAGE} canReply={true} isOutbox={false} onReply={onReply} />);
    fireEvent.click(screen.getByText('Antworten'));
    expect(onReply).toHaveBeenCalledTimes(1);
  });

  it('ruft onResend auf wenn "Erneut senden" geklickt wird', () => {
    const onResend = jest.fn();
    render(<MessageDetailPane {...defaultProps} message={BASE_MESSAGE} isOutbox={true} onResend={onResend} />);
    fireEvent.click(screen.getByText('Erneut senden'));
    expect(onResend).toHaveBeenCalledTimes(1);
  });
});

describe('MessageDetailPane – Löschen-Dialog', () => {
  beforeEach(() => jest.clearAllMocks());

  it('öffnet Bestätigungs-Dialog beim Klick auf Löschen', () => {
    render(<MessageDetailPane {...defaultProps} message={BASE_MESSAGE} />);
    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Löschen'));
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
  });

  it('ruft onDelete auf wenn "Endgültig löschen" bestätigt wird', () => {
    const onDelete = jest.fn();
    render(<MessageDetailPane {...defaultProps} message={BASE_MESSAGE} onDelete={onDelete} />);
    fireEvent.click(screen.getByText('Löschen'));
    fireEvent.click(screen.getByText('Endgültig löschen'));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('schließt Dialog ohne onDelete bei "Abbrechen"', () => {
    const onDelete = jest.fn();
    render(<MessageDetailPane {...defaultProps} message={BASE_MESSAGE} onDelete={onDelete} />);
    fireEvent.click(screen.getByText('Löschen'));
    fireEvent.click(screen.getByText('Abbrechen'));
    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
  });
});

describe('MessageDetailPane – Leere Zustände', () => {
  it('zeigt "Nachricht auswählen" wenn keine Nachricht übergeben', () => {
    render(<MessageDetailPane {...defaultProps} message={null} />);
    expect(screen.getByText('Nachricht auswählen')).toBeInTheDocument();
  });

  it('zeigt Lade-Spinner wenn loading=true', () => {
    render(<MessageDetailPane {...defaultProps} message={BASE_MESSAGE} loading={true} />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.queryByText('Antworten')).not.toBeInTheDocument();
  });
});
