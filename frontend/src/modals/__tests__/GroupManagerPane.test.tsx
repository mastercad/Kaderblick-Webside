/**
 * Tests for GroupManagerPane component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GroupManagerPane } from '../messages/GroupManagerPane';
import { MessageGroup, User } from '../messages/types';

// ── API mock ──────────────────────────────────────────────────────────────────

jest.mock('../../utils/api', () => ({ apiJson: jest.fn() }));
import { apiJson } from '../../utils/api';

// ── MUI mocks ─────────────────────────────────────────────────────────────────

jest.mock('@mui/material/Alert', () => ({
  __esModule: true,
  default: ({ children, severity, onClose }: any) => (
    <div role="alert" data-severity={severity}>
      {children}
      <button onClick={onClose} data-testid="alert-close">×</button>
    </div>
  ),
}));
jest.mock('@mui/material/Autocomplete', () => ({
  __esModule: true,
  default: ({ renderInput, options, value, onChange, multiple: _m, isOptionEqualToValue: _ioe, getOptionLabel: _gl, renderTags: _rt }: any) => (
    <div data-testid="members-autocomplete">
      {renderInput({ InputProps: {}, inputProps: {} })}
      {options.map((o: User) => (
        <button
          key={o.id}
          data-testid={`member-option-${o.id}`}
          onClick={() => onChange({}, _m ? [...(value ?? []), o] : o)}
        >
          {o.fullName}
        </button>
      ))}
    </div>
  ),
}));
jest.mock('@mui/material/Box', () => ({ children, sx: _sx, ...p }: any) => <div {...p}>{children}</div>);
jest.mock('@mui/material/Button', () => ({
  __esModule: true,
  default: ({ children, onClick, disabled, startIcon, variant: _v, size: _s, sx: _sx }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-testid={typeof children === 'string' ? `btn-${children}` : undefined}
    >
      {startIcon}
      {children}
    </button>
  ),
}));
jest.mock('@mui/material/Chip', () => ({
  __esModule: true,
  default: ({ label }: any) => <span data-testid="chip">{label}</span>,
}));
jest.mock('@mui/material/CircularProgress', () => ({
  __esModule: true,
  default: () => <span data-testid="spinner" />,
}));
jest.mock('@mui/material/Dialog', () => ({
  __esModule: true,
  default: ({ open, children, onClose: _oc }: any) =>
    open ? <div data-testid="Dialog">{children}</div> : null,
}));
jest.mock('@mui/material/DialogActions', () => ({ children }: any) => <div>{children}</div>);
jest.mock('@mui/material/DialogContent', () => ({ children, dividers: _d }: any) => <div>{children}</div>);
jest.mock('@mui/material/DialogTitle', () => ({ children }: any) => <h2>{children}</h2>);
jest.mock('@mui/material/Divider', () => ({ component: _c }: any) => <hr />);
jest.mock('@mui/material/IconButton', () => ({
  __esModule: true,
  default: ({ children, onClick, disabled, 'aria-label': ariaLabel }: any) => (
    <button onClick={onClick} disabled={disabled} aria-label={ariaLabel}>{children}</button>
  ),
}));
jest.mock('@mui/material/List', () => ({ children, dense: _d, disablePadding: _dp }: any) => <ul>{children}</ul>);
jest.mock('@mui/material/ListItem', () => ({ children, disableGutters: _dg, secondaryAction }: any) => (
  <li>{children}{secondaryAction}</li>
));
jest.mock('@mui/material/ListItemText', () => ({
  __esModule: true,
  default: ({ primary, secondary }: any) => (
    <span>
      <span data-testid="group-name">{primary}</span>
      <span data-testid="group-member-count">{secondary}</span>
    </span>
  ),
}));
jest.mock('@mui/material/Stack', () => ({ children }: any) => <div>{children}</div>);
jest.mock('@mui/material/TextField', () => ({
  __esModule: true,
  default: ({ label, value, onChange, autoFocus: _af, size: _s, fullWidth: _fw, required: _req, ...p }: any) => (
    <input
      aria-label={label}
      data-testid={`textfield-${label}`}
      value={value ?? ''}
      onChange={onChange ?? (() => {})}
      {...p}
    />
  ),
}));
jest.mock('@mui/material/Typography', () => ({
  __esModule: true,
  default: ({ children, variant: _v, gutterBottom: _gb, color: _col, ...p }: any) => (
    <span {...p}>{children}</span>
  ),
}));

jest.mock('@mui/icons-material/Add', () => ({ __esModule: true, default: () => <span /> }));
jest.mock('@mui/icons-material/Delete', () => ({ __esModule: true, default: () => <span data-testid="delete-icon" /> }));
jest.mock('@mui/icons-material/Edit', () => ({ __esModule: true, default: () => <span data-testid="edit-icon" /> }));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const GROUP_1: MessageGroup = { id: 'g1', name: 'Team Alpha', memberCount: 3 };
const GROUP_2: MessageGroup = { id: 'g2', name: 'Team Beta', memberCount: 1 };

const USER_A: User = { id: 'u1', fullName: 'Anna Schmidt' };
const USER_B: User = { id: 'u2', fullName: 'Ben Müller' };

const defaultProps = {
  open: true,
  onClose: jest.fn(),
  groups: [GROUP_1, GROUP_2],
  users: [USER_A, USER_B],
  onCreate: jest.fn(),
  onUpdate: jest.fn(),
  onDelete: jest.fn(),
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GroupManagerPane – Sichtbarkeit', () => {
  it('rendert nicht wenn open=false', () => {
    render(<GroupManagerPane {...defaultProps} open={false} />);
    expect(screen.queryByTestId('Dialog')).not.toBeInTheDocument();
  });

  it('rendert Dialog wenn open=true', () => {
    render(<GroupManagerPane {...defaultProps} />);
    expect(screen.getByTestId('Dialog')).toBeInTheDocument();
    expect(screen.getByText('Empfängergruppen verwalten')).toBeInTheDocument();
  });
});

describe('GroupManagerPane – Gruppenlist', () => {
  beforeEach(() => jest.clearAllMocks());

  it('zeigt alle Gruppen in der Liste', () => {
    render(<GroupManagerPane {...defaultProps} />);
    const names = screen.getAllByTestId('group-name').map((el) => el.textContent);
    expect(names).toContain('Team Alpha');
    expect(names).toContain('Team Beta');
  });

  it('zeigt Mitgliederzahl für jede Gruppe', () => {
    render(<GroupManagerPane {...defaultProps} />);
    const counts = screen.getAllByTestId('group-member-count').map((el) => el.textContent);
    expect(counts).toContain('3 Mitglieder');
    expect(counts).toContain('1 Mitglied');
  });

  it('zeigt Platzhaltertext wenn keine Gruppen vorhanden', () => {
    render(<GroupManagerPane {...defaultProps} groups={[]} />);
    expect(screen.getByText('Noch keine Gruppen vorhanden.')).toBeInTheDocument();
  });

  it('zeigt Bearbeiten- und Löschen-Buttons für jede Gruppe', () => {
    render(<GroupManagerPane {...defaultProps} />);
    expect(screen.getByLabelText('Team Alpha bearbeiten')).toBeInTheDocument();
    expect(screen.getByLabelText('Team Alpha löschen')).toBeInTheDocument();
    expect(screen.getByLabelText('Team Beta bearbeiten')).toBeInTheDocument();
    expect(screen.getByLabelText('Team Beta löschen')).toBeInTheDocument();
  });
});

describe('GroupManagerPane – Neue Gruppe erstellen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('zeigt Formular nach Klick auf Neue Gruppe', () => {
    render(<GroupManagerPane {...defaultProps} />);
    fireEvent.click(screen.getByTestId('btn-Neue Gruppe'));
    expect(screen.getByTestId('textfield-Gruppenname')).toBeInTheDocument();
  });

  it('zeigt Validierungsfehler wenn Name leer beim Speichern', async () => {
    render(<GroupManagerPane {...defaultProps} />);
    fireEvent.click(screen.getByTestId('btn-Neue Gruppe'));
    fireEvent.click(screen.getByTestId('btn-Speichern'));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('alert').textContent).toContain('Gruppenname');
  });

  it('ruft apiJson POST und onCreate auf beim Speichern', async () => {
    const newGroup: MessageGroup = { id: 'g3', name: 'Neue Gruppe', memberCount: 0, members: [] };
    (apiJson as jest.Mock).mockResolvedValue({ group: newGroup });

    const onCreate = jest.fn();
    render(<GroupManagerPane {...defaultProps} onCreate={onCreate} />);

    fireEvent.click(screen.getByTestId('btn-Neue Gruppe'));
    fireEvent.change(screen.getByTestId('textfield-Gruppenname'), { target: { value: 'Neue Gruppe' } });

    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-Speichern'));
    });

    expect(apiJson).toHaveBeenCalledWith('/api/message-groups', expect.objectContaining({ method: 'POST' }));
    expect(onCreate).toHaveBeenCalledWith(newGroup);
  });

  it('schließt Formular nach erfolgreichem Speichern', async () => {
    const newGroup: MessageGroup = { id: 'g3', name: 'X', memberCount: 0, members: [] };
    (apiJson as jest.Mock).mockResolvedValue({ group: newGroup });

    render(<GroupManagerPane {...defaultProps} />);
    fireEvent.click(screen.getByTestId('btn-Neue Gruppe'));
    fireEvent.change(screen.getByTestId('textfield-Gruppenname'), { target: { value: 'X' } });

    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-Speichern'));
    });

    await waitFor(() => {
      expect(screen.queryByTestId('textfield-Gruppenname')).not.toBeInTheDocument();
    });
  });

  it('schließt Formular bei Klick auf Abbrechen', () => {
    render(<GroupManagerPane {...defaultProps} />);
    fireEvent.click(screen.getByTestId('btn-Neue Gruppe'));
    expect(screen.getByTestId('textfield-Gruppenname')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('btn-Abbrechen'));
    expect(screen.queryByTestId('textfield-Gruppenname')).not.toBeInTheDocument();
  });

  it('zeigt Fehler-Alert bei API-Fehler beim Speichern', async () => {
    (apiJson as jest.Mock).mockRejectedValue(new Error('network'));

    render(<GroupManagerPane {...defaultProps} />);
    fireEvent.click(screen.getByTestId('btn-Neue Gruppe'));
    fireEvent.change(screen.getByTestId('textfield-Gruppenname'), { target: { value: 'Fehler-Gruppe' } });

    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-Speichern'));
    });

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('alert').textContent).toContain('Fehler beim Speichern');
  });
});

describe('GroupManagerPane – Gruppe bearbeiten', () => {
  beforeEach(() => jest.clearAllMocks());

  it('lädt Gruppendetails und öffnet Formular bei Klick auf Bearbeiten', async () => {
    const fullGroup: MessageGroup = {
      ...GROUP_1,
      members: [USER_A],
    };
    (apiJson as jest.Mock).mockResolvedValue({ group: fullGroup });

    render(<GroupManagerPane {...defaultProps} />);

    await act(async () => {
      fireEvent.click(screen.getByLabelText('Team Alpha bearbeiten'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('textfield-Gruppenname')).toBeInTheDocument();
    });
    expect(screen.getByTestId('textfield-Gruppenname')).toHaveValue('Team Alpha');
    expect(apiJson).toHaveBeenCalledWith('/api/message-groups/g1');
  });

  it('ruft apiJson PUT und onUpdate auf beim Speichern nach Bearbeiten', async () => {
    const fullGroup: MessageGroup = { ...GROUP_1, members: [] };
    const updatedGroup: MessageGroup = { ...GROUP_1, name: 'Geänderter Name', members: [] };
    (apiJson as jest.Mock)
      .mockResolvedValueOnce({ group: fullGroup })   // GET
      .mockResolvedValueOnce({ group: updatedGroup }); // PUT

    const onUpdate = jest.fn();
    render(<GroupManagerPane {...defaultProps} onUpdate={onUpdate} />);

    await act(async () => {
      fireEvent.click(screen.getByLabelText('Team Alpha bearbeiten'));
    });

    await waitFor(() => screen.getByTestId('textfield-Gruppenname'));

    fireEvent.change(screen.getByTestId('textfield-Gruppenname'), { target: { value: 'Geänderter Name' } });

    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-Speichern'));
    });

    expect(apiJson).toHaveBeenCalledWith(
      '/api/message-groups/g1',
      expect.objectContaining({ method: 'PUT' })
    );
    expect(onUpdate).toHaveBeenCalledWith(updatedGroup);
  });

  it('zeigt Fehler wenn Gruppendetails nicht geladen werden können', async () => {
    (apiJson as jest.Mock).mockRejectedValue(new Error('network'));

    render(<GroupManagerPane {...defaultProps} />);

    await act(async () => {
      fireEvent.click(screen.getByLabelText('Team Alpha bearbeiten'));
    });

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('alert').textContent).toContain('Fehler beim Laden');
  });
});

describe('GroupManagerPane – Gruppe löschen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('ruft apiJson DELETE und onDelete auf beim Löschen', async () => {
    (apiJson as jest.Mock).mockResolvedValue({});

    const onDelete = jest.fn();
    render(<GroupManagerPane {...defaultProps} onDelete={onDelete} />);

    await act(async () => {
      fireEvent.click(screen.getByLabelText('Team Alpha löschen'));
    });

    expect(apiJson).toHaveBeenCalledWith(
      '/api/message-groups/g1',
      expect.objectContaining({ method: 'DELETE' })
    );
    expect(onDelete).toHaveBeenCalledWith('g1');
  });

  it('zeigt Fehler wenn Löschen fehlschlägt', async () => {
    (apiJson as jest.Mock).mockRejectedValue(new Error('network'));

    render(<GroupManagerPane {...defaultProps} />);

    await act(async () => {
      fireEvent.click(screen.getByLabelText('Team Alpha löschen'));
    });

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('alert').textContent).toContain('Fehler beim Löschen');
  });
});

describe('GroupManagerPane – Schließen', () => {
  it('ruft onClose beim Klick auf Schließen auf', () => {
    const onClose = jest.fn();
    render(<GroupManagerPane {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('btn-Schließen'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
