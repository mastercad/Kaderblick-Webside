import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MessageComposePane } from '../messages/MessageComposePane';
import { ComposeForm, User } from '../messages/types';

// ── MUI-Mocks ────────────────────────────────────────────────────────────────

jest.mock('@mui/material/Alert',            () => ({ children, severity, ...p }: any) => <div role="alert" data-severity={severity} {...p}>{children}</div>);
jest.mock('@mui/material/Autocomplete',     () => ({ renderInput, options: _o, disabled, getOptionLabel: _gl, renderOption: _ro, isOptionEqualToValue: _ioe, filterOptions: _fo, freeSolo: _fs, fullWidth: _fw, multiple: _m, value: _v, onChange: _oc, loading: _l, sx: _sx, ...p }: any) => (
  <div data-testid="autocomplete" data-disabled={disabled ? 'true' : 'false'} {...p}>
    {renderInput({ InputProps: { startAdornment: null }, inputProps: {}, disabled })}
  </div>
));
jest.mock('@mui/material/Avatar',           () => ({ children, sx: _sx, ...p }: any) => <span {...p}>{children}</span>);
jest.mock('@mui/material/Box',              () => ({ children, sx: _sx, component, ...p }: any) => <div {...p}>{children}</div>);
jest.mock('@mui/material/Button',           () => ({ children, disabled, startIcon, onClick, ...p }: any) => (
  <button onClick={onClick} disabled={disabled} data-testid={typeof children === 'string' ? children : undefined} {...p}>
    {startIcon}{children}
  </button>
));
jest.mock('@mui/material/Chip',             () => ({ label, ...p }: any) => <span data-testid="chip" {...p}>{label}</span>);
jest.mock('@mui/material/CircularProgress', () => () => <span data-testid="spinner" />);
jest.mock('@mui/material/IconButton',       () => ({ children, onClick, ...p }: any) => <button onClick={onClick} {...p}>{children}</button>);
jest.mock('@mui/material/InputLabel',       () => ({ children, shrink: _s, sx: _sx, ...p }: any) => <label {...p}>{children}</label>);
// Strip JSX children to avoid invalid <option><div> nesting (React 18 throws on this)
jest.mock('@mui/material/MenuItem',         () => ({ children: _c, value, ...p }: any) => <option value={value} {...p} />);
jest.mock('@mui/material/Stack',            () => ({ children, ...p }: any) => <div {...p}>{children}</div>);
jest.mock('@mui/material/TextField',        () => ({ label, disabled, value, onChange, multiline: _ml, InputProps: _IP, inputProps: _ip, InputLabelProps: _ILP, fullWidth: _fw, margin: _m, variant: _v, size: _s, sx: _sx, select, helperText: _ht, children, ...p }: any) => (
  select ? (
    <select
      aria-label={label}
      data-testid={`textfield-${label}`}
      disabled={disabled}
      value={value || ''}
      onChange={onChange ?? (() => {})}
    >
      {children}
    </select>
  ) : (
    <input
      aria-label={label}
      data-testid={`textfield-${label}`}
      disabled={disabled}
      value={value || ''}
      onChange={onChange ?? (() => {})}
      {...p}
    />
  )
));
jest.mock('@mui/material/Typography',       () => ({ children, sx: _sx, variant: _v, gutterBottom: _gb, component: _c, color: _col, ...p }: any) => <span {...p}>{children}</span>);

jest.mock('@mui/icons-material/ArrowBack',       () => () => <span />);
jest.mock('@mui/icons-material/Close',           () => () => <span />);
jest.mock('@mui/icons-material/Delete',          () => () => <span />);
jest.mock('@mui/icons-material/Edit',            () => () => <span />);
jest.mock('@mui/icons-material/Group',           () => () => <span />);
jest.mock('@mui/icons-material/Groups',          () => () => <span />);
jest.mock('@mui/icons-material/Lock',            () => () => <span data-testid="lock-icon" />);
jest.mock('@mui/icons-material/Person',          () => () => <span />);
jest.mock('@mui/icons-material/Send',            () => () => <span />);
jest.mock('@mui/icons-material/Settings',        () => () => <span />);
jest.mock('@mui/icons-material/SportsSoccer',    () => () => <span />);
jest.mock('@mui/icons-material/WarningAmber',    () => () => <span data-testid="warning-icon" />);

// Stub out BulkTargetPicker so we can test that it's rendered with the right props
jest.mock('../messages/BulkTargetPicker', () => ({
  BulkTargetPicker: ({ label, orgs, targets, onChange }: any) => (
    <div data-testid={`bulk-picker-${label}`} data-orgs={orgs.length} data-targets={targets.length}>
      <button
        data-testid={`bulk-add-${label}`}
        onClick={() => onChange([...targets, { orgId: orgs[0]?.id ?? 'x', roles: ['all'] }])}
      >
        add
      </button>
    </div>
  ),
}));

// Stub GroupManagerPane
jest.mock('../messages/GroupManagerPane', () => ({
  GroupManagerPane: ({ open, onClose }: any) =>
    open ? <div data-testid="GroupManagerPane"><button onClick={onClose}>close</button></div> : null,
}));

// ── Fixtures ─────────────────────────────────────────────────────────────────

const ADMIN_USER: User = { id: '1', fullName: 'Admin Max' };
const REGULAR_USER: User = { id: '2', fullName: 'Anna Schmidt' };

const EMPTY_FORM: ComposeForm = {
  recipients: [],
  groupId: '',
  subject: '',
  content: '',
  teamTargets: [],
  clubTargets: [],
};

const defaultProps = {
  groups:          [],
  teams:           [],
  clubs:           [],
  form:            EMPTY_FORM,
  onChange:        jest.fn(),
  isMobile:        false,
  loading:         false,
  contactsLoading: false,
  error:           null,
  success:         false,
  onSend:          jest.fn(),
  onDiscard:       jest.fn(),
  onGoToSent:      jest.fn(),
  onGroupCreate:   jest.fn(),
  onGroupUpdate:   jest.fn(),
  onGroupDelete:   jest.fn(),
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('MessageComposePane – noContacts-Logik', () => {
  beforeEach(() => jest.clearAllMocks());

  it('deaktiviert Formular wenn users leer und recipientsLocked=false (kein Kontakt)', () => {
    render(<MessageComposePane {...defaultProps} users={[]} recipientsLocked={false} />);

    const betreffInput    = screen.getByPlaceholderText('Betreff eingeben…');
    const nachrichtInput  = screen.getByPlaceholderText('Nachricht schreiben…');

    expect(betreffInput).toBeDisabled();
    expect(nachrichtInput).toBeDisabled();
  });

  it('zeigt Warnung wenn users leer und recipientsLocked=false', () => {
    render(<MessageComposePane {...defaultProps} users={[]} recipientsLocked={false} />);

    // Die Alert-Komponente sollte die Warnung anzeigen
    const alerts = screen.getAllByRole('alert');
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts.some(a => a.getAttribute('data-severity') === 'warning')).toBe(true);
  });

  it('deaktiviert Senden-Button wenn users leer und recipientsLocked=false', () => {
    render(<MessageComposePane {...defaultProps} users={[]} recipientsLocked={false} />);
    const sendenBtn = screen.getByTestId('Senden');
    expect(sendenBtn).toBeDisabled();
  });

  it('aktiviert Formular wenn recipientsLocked=true, auch wenn users leer', () => {
    const lockedForm: ComposeForm = {
      recipients: [ADMIN_USER],
      groupId: '',
      subject: 'Re: Test',
      content: '',
      teamTargets: [],
      clubTargets: [],
    };

    render(<MessageComposePane {...defaultProps} users={[]} recipientsLocked={true} form={lockedForm} />);

    const betreffInput    = screen.getByPlaceholderText('Betreff eingeben…');
    const nachrichtInput  = screen.getByPlaceholderText('Nachricht schreiben…');

    expect(betreffInput).not.toBeDisabled();
    expect(nachrichtInput).not.toBeDisabled();
  });

  it('aktiviert Senden-Button wenn recipientsLocked=true, auch wenn users leer', () => {
    const lockedForm: ComposeForm = { recipients: [ADMIN_USER], groupId: '', subject: 'Re: Test', content: '', teamTargets: [], clubTargets: [] };
    render(<MessageComposePane {...defaultProps} users={[]} recipientsLocked={true} form={lockedForm} />);
    const sendenBtn = screen.getByTestId('Senden');
    expect(sendenBtn).not.toBeDisabled();
  });

  it('zeigt keine Warnung wenn recipientsLocked=true', () => {
    const lockedForm: ComposeForm = { recipients: [ADMIN_USER], groupId: '', subject: '', content: '', teamTargets: [], clubTargets: [] };
    render(<MessageComposePane {...defaultProps} users={[]} recipientsLocked={true} form={lockedForm} />);

    const alerts = screen.queryAllByRole('alert');
    const hasWarning = alerts.some(a => a.getAttribute('data-severity') === 'warning');
    expect(hasWarning).toBe(false);
  });
});

describe('MessageComposePane – recipientsLocked Anzeige', () => {
  beforeEach(() => jest.clearAllMocks());

  it('zeigt Schloss-Icon und Chips wenn recipientsLocked=true', () => {
    const lockedForm: ComposeForm = {
      recipients: [ADMIN_USER, REGULAR_USER],
      groupId: '',
      subject: 'Re: Hallo',
      content: '',
      teamTargets: [],
      clubTargets: [],
    };

    render(<MessageComposePane {...defaultProps} users={[]} recipientsLocked={true} form={lockedForm} />);

    expect(screen.getByTestId('lock-icon')).toBeInTheDocument();
    const chips = screen.getAllByTestId('chip');
    const chipLabels = chips.map(c => c.textContent);
    expect(chipLabels).toContain('Admin Max');
    expect(chipLabels).toContain('Anna Schmidt');
  });

  it('zeigt kein Autocomplete wenn recipientsLocked=true', () => {
    const lockedForm: ComposeForm = { recipients: [ADMIN_USER], groupId: '', subject: '', content: '', teamTargets: [], clubTargets: [] };
    render(<MessageComposePane {...defaultProps} users={[ADMIN_USER]} recipientsLocked={true} form={lockedForm} />);
    expect(screen.queryByTestId('autocomplete')).not.toBeInTheDocument();
  });

  it('zeigt Autocomplete wenn recipientsLocked=false', () => {
    render(<MessageComposePane {...defaultProps} users={[ADMIN_USER]} recipientsLocked={false} />);
    expect(screen.getByTestId('autocomplete')).toBeInTheDocument();
  });

  it('zeigt "Keine Empfänger" nur wenn Chip-Liste leer und locked', () => {
    const emptyForm: ComposeForm = { recipients: [], groupId: '', subject: '', content: '', teamTargets: [], clubTargets: [] };
    render(<MessageComposePane {...defaultProps} users={[]} recipientsLocked={true} form={emptyForm} />);
    expect(screen.getByText('Keine Empfänger')).toBeInTheDocument();
  });
});

describe('MessageComposePane – Lade-Zustand', () => {
  it('zeigt Spinner statt Senden-Text beim Senden', () => {
    render(<MessageComposePane {...defaultProps} users={[REGULAR_USER]} loading={true} />);
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
    expect(screen.getByText('Sende…')).toBeInTheDocument();
  });

  it('deaktiviert Senden-Button während des Sendens', () => {
    render(<MessageComposePane {...defaultProps} users={[REGULAR_USER]} loading={true} />);
    // Der Button enthält "Sende…" als Text
    const btn = screen.getByTestId('Sende…');
    expect(btn).toBeDisabled();
  });
});

// ── Bulk-Target-Picker ────────────────────────────────────────────────────────

import { fireEvent } from '@testing-library/react';
import { OrgRef } from '../messages/types';

describe('MessageComposePane – Bulk-Target-Picker', () => {
  beforeEach(() => jest.clearAllMocks());

  const TEAM_PICKER_ID = 'bulk-picker-Team hinzuf\u00fcgen\u2026';
  const CLUB_PICKER_ID = 'bulk-picker-Verein hinzuf\u00fcgen\u2026';
  const TEAM_ADD_ID    = 'bulk-add-Team hinzuf\u00fcgen\u2026';

  const TEAMS: OrgRef[] = [{ id: 't1', name: 'Team Blau' }, { id: 't2', name: 'Team Rot' }];
  const CLUBS: OrgRef[] = [{ id: 'c1', name: 'Verein Nord' }];

  it('zeigt BulkTargetPicker für Teams wenn + Team geklickt wird', () => {
    render(
      <MessageComposePane
        {...defaultProps}
        users={[REGULAR_USER]}
        teams={TEAMS}
        clubs={[]}
      />
    );
    fireEvent.click(screen.getByText('+ Team'));
    expect(screen.getByTestId(TEAM_PICKER_ID)).toBeInTheDocument();
    expect(screen.queryByTestId(CLUB_PICKER_ID)).not.toBeInTheDocument();
  });

  it('zeigt BulkTargetPicker für Vereine wenn + Verein geklickt wird', () => {
    render(
      <MessageComposePane
        {...defaultProps}
        users={[REGULAR_USER]}
        teams={[]}
        clubs={CLUBS}
      />
    );
    fireEvent.click(screen.getByText('+ Verein'));
    expect(screen.getByTestId(CLUB_PICKER_ID)).toBeInTheDocument();
    expect(screen.queryByTestId(TEAM_PICKER_ID)).not.toBeInTheDocument();
  });

  it('zeigt beide BulkTargetPicker nach Klick auf + Team und + Verein', () => {
    render(
      <MessageComposePane
        {...defaultProps}
        users={[REGULAR_USER]}
        teams={TEAMS}
        clubs={CLUBS}
      />
    );
    fireEvent.click(screen.getByText('+ Team'));
    fireEvent.click(screen.getByText('+ Verein'));
    expect(screen.getByTestId(TEAM_PICKER_ID)).toBeInTheDocument();
    expect(screen.getByTestId(CLUB_PICKER_ID)).toBeInTheDocument();
  });

  it('aktiviert Formular wenn kein Nutzer-Kontakt vorhanden aber teams nicht leer', () => {
    render(
      <MessageComposePane
        {...defaultProps}
        users={[]}
        teams={TEAMS}
        clubs={[]}
        recipientsLocked={false}
      />
    );
    // noContacts = false weil teams vorhanden → Felder aktiviert
    expect(screen.getByPlaceholderText('Betreff eingeben…')).not.toBeDisabled();
  });

  it('aktiviert Senden-Button wenn teamTargets nicht leer', () => {
    const formWithTeam: ComposeForm = {
      ...EMPTY_FORM,
      teamTargets: [{ teamId: 't1', roles: ['all'] }],
    };
    render(
      <MessageComposePane
        {...defaultProps}
        users={[]}
        teams={TEAMS}
        form={formWithTeam}
        recipientsLocked={false}
      />
    );
    const sendenBtn = screen.getByTestId('Senden');
    expect(sendenBtn).not.toBeDisabled();
  });

  it('übergibt orgs korrekt an BulkTargetPicker nach Öffnen der Sektionen', () => {
    render(
      <MessageComposePane
        {...defaultProps}
        users={[REGULAR_USER]}
        teams={TEAMS}
        clubs={CLUBS}
      />
    );
    fireEvent.click(screen.getByText('+ Team'));
    fireEvent.click(screen.getByText('+ Verein'));
    const teamPicker = screen.getByTestId(TEAM_PICKER_ID);
    expect(teamPicker).toHaveAttribute('data-orgs', String(TEAMS.length));
    const clubPicker = screen.getByTestId(CLUB_PICKER_ID);
    expect(clubPicker).toHaveAttribute('data-orgs', String(CLUBS.length));
  });

  it('ruft onChange auf wenn ein Team-Target hinzugefügt wird', () => {
    const onChange = jest.fn();
    render(
      <MessageComposePane
        {...defaultProps}
        users={[REGULAR_USER]}
        teams={TEAMS}
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByText('+ Team'));
    fireEvent.click(screen.getByTestId(TEAM_ADD_ID));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        teamTargets: expect.arrayContaining([expect.objectContaining({ teamId: 't1', roles: ['all'] })]),
      })
    );
  });
});

describe('MessageComposePane – Gruppen verwalten Button', () => {
  beforeEach(() => jest.clearAllMocks());

  it('öffnet GroupManagerPane bei Klick auf Gruppen verwalten', () => {
    render(
      <MessageComposePane
        {...defaultProps}
        users={[REGULAR_USER]}
        groups={[{ id: 'g1', name: 'Gruppe A', memberCount: 2 }]}
      />
    );
    // Gruppe-Sektion öffnen
    fireEvent.click(screen.getByText('+ Gruppe'));
    const btn = screen.getByText('Gruppen verwalten');
    expect(btn).toBeInTheDocument();
    // GroupManagerPane ist initial geschlossen
    expect(screen.queryByTestId('GroupManagerPane')).not.toBeInTheDocument();
    fireEvent.click(btn);
    expect(screen.getByTestId('GroupManagerPane')).toBeInTheDocument();
  });

  it('schließt GroupManagerPane bei Klick auf close', () => {
    render(
      <MessageComposePane
        {...defaultProps}
        users={[REGULAR_USER]}
        groups={[{ id: 'g1', name: 'Gruppe A', memberCount: 2 }]}
      />
    );
    fireEvent.click(screen.getByText('+ Gruppe'));
    fireEvent.click(screen.getByText('Gruppen verwalten'));
    fireEvent.click(screen.getByText('close'));
    expect(screen.queryByTestId('GroupManagerPane')).not.toBeInTheDocument();
  });
});

// ── setClubTargets ────────────────────────────────────────────────────────────

describe('MessageComposePane – setClubTargets', () => {
  beforeEach(() => jest.clearAllMocks());

  const CLUBS: OrgRef[] = [{ id: 'c1', name: 'Verein Nord' }];

  it('ruft onChange auf wenn ein Verein-Target hinzugefügt wird', () => {
    const onChange = jest.fn();
    render(
      <MessageComposePane
        {...defaultProps}
        users={[REGULAR_USER]}
        clubs={CLUBS}
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByText('+ Verein'));
    fireEvent.click(screen.getByTestId('bulk-add-Verein hinzuf\u00fcgen\u2026'));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        clubTargets: expect.arrayContaining([
          expect.objectContaining({ clubId: 'c1', roles: ['all'] }),
        ]),
      })
    );
  });
});

// ── isMobile ─────────────────────────────────────────────────────────────────

describe('MessageComposePane – isMobile', () => {
  beforeEach(() => jest.clearAllMocks());

  it('blendet Desktop-Close und Verwerfen aus, zeigt ArrowBack wenn isMobile=true', () => {
    render(<MessageComposePane {...defaultProps} users={[REGULAR_USER]} isMobile={true} />);
    expect(screen.queryByTestId('btn-compose-close')).not.toBeInTheDocument();
    expect(screen.queryByTestId('Verwerfen')).not.toBeInTheDocument();
    // ArrowBack button has no data-testid – it's the only such button
    const unlabeled = screen.getAllByRole('button').filter(b => !b.hasAttribute('data-testid'));
    expect(unlabeled.length).toBeGreaterThanOrEqual(1);
  });

  it('zeigt Desktop-Close-Button und Verwerfen-Button wenn isMobile=false', () => {
    render(<MessageComposePane {...defaultProps} users={[REGULAR_USER]} isMobile={false} />);
    expect(screen.getByTestId('btn-compose-close')).toBeInTheDocument();
    expect(screen.getByTestId('Verwerfen')).toBeInTheDocument();
  });

  it('ArrowBack-Button ruft onDiscard auf', () => {
    const onDiscard = jest.fn();
    render(
      <MessageComposePane {...defaultProps} users={[REGULAR_USER]} isMobile={true} onDiscard={onDiscard} />
    );
    const unlabeled = screen.getAllByRole('button').filter(b => !b.hasAttribute('data-testid'));
    fireEvent.click(unlabeled[0]);
    expect(onDiscard).toHaveBeenCalledTimes(1);
  });
});

// ── contactsLoading ───────────────────────────────────────────────────────────

describe('MessageComposePane – contactsLoading', () => {
  beforeEach(() => jest.clearAllMocks());

  it('zeigt keine Warnung wenn contactsLoading=true, auch wenn users leer', () => {
    render(
      <MessageComposePane
        {...defaultProps}
        users={[]}
        contactsLoading={true}
        recipientsLocked={false}
      />
    );
    const alerts = screen.queryAllByRole('alert');
    expect(alerts.some(a => a.getAttribute('data-severity') === 'warning')).toBe(false);
  });

  it('aktiviert Formular wenn contactsLoading=true', () => {
    render(
      <MessageComposePane
        {...defaultProps}
        users={[]}
        contactsLoading={true}
        recipientsLocked={false}
      />
    );
    expect(screen.getByPlaceholderText('Betreff eingeben\u2026')).not.toBeDisabled();
  });
});

// ── Abschnitte schließen ──────────────────────────────────────────────────────

describe('MessageComposePane – Abschnitte schließen', () => {
  beforeEach(() => jest.clearAllMocks());

  const TEAMS: OrgRef[] = [{ id: 't1', name: 'Team Blau' }];
  const CLUBS: OrgRef[] = [{ id: 'c1', name: 'Verein Nord' }];

  it('closeTeams: ruft onChange mit leeren teamTargets auf nach Klick auf X', () => {
    const onChange = jest.fn();
    render(
      <MessageComposePane
        {...defaultProps}
        users={[REGULAR_USER]}
        teams={TEAMS}
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByText('+ Team'));
    // The ComposeRow close button is the only button without a data-testid
    const closeBtn = screen.getAllByRole('button').find(b => !b.hasAttribute('data-testid'));
    expect(closeBtn).toBeDefined();
    fireEvent.click(closeBtn!);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ teamTargets: [] })
    );
  });

  it('closeClubs: ruft onChange mit leeren clubTargets auf nach Klick auf X', () => {
    const onChange = jest.fn();
    render(
      <MessageComposePane
        {...defaultProps}
        users={[REGULAR_USER]}
        clubs={CLUBS}
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByText('+ Verein'));
    const closeBtn = screen.getAllByRole('button').find(b => !b.hasAttribute('data-testid'));
    expect(closeBtn).toBeDefined();
    fireEvent.click(closeBtn!);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ clubTargets: [] })
    );
  });

  it('closeGroup: ruft onChange mit leerem groupId auf nach Klick auf X', () => {
    const onChange = jest.fn();
    render(
      <MessageComposePane
        {...defaultProps}
        users={[REGULAR_USER]}
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByText('+ Gruppe'));
    // btn-compose-close has data-testid, Gruppen verwalten has data-testid – only group row X has none
    const closeBtn = screen.getAllByRole('button').find(b => !b.hasAttribute('data-testid'));
    expect(closeBtn).toBeDefined();
    fireEvent.click(closeBtn!);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ groupId: '' })
    );
  });
});

// ── onChange-Callbacks für Eingabefelder ──────────────────────────────────────

describe('MessageComposePane – Eingabefelder onChange', () => {
  beforeEach(() => jest.clearAllMocks());

  it('ruft onChange mit neuem Betreff auf wenn Subject-Feld geändert wird', () => {
    const onChange = jest.fn();
    render(
      <MessageComposePane {...defaultProps} users={[REGULAR_USER]} onChange={onChange} />
    );
    const subjectInput = screen.getByPlaceholderText('Betreff eingeben\u2026');
    fireEvent.change(subjectInput, { target: { value: 'Neuer Betreff' } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'Neuer Betreff' })
    );
  });

  it('ruft onChange mit neuem Inhalt auf wenn Nachrichtenfeld geändert wird', () => {
    const onChange = jest.fn();
    render(
      <MessageComposePane {...defaultProps} users={[REGULAR_USER]} onChange={onChange} />
    );
    const contentInput = screen.getByPlaceholderText('Nachricht schreiben\u2026');
    fireEvent.change(contentInput, { target: { value: 'Meine Nachricht' } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ content: 'Meine Nachricht' })
    );
  });

  it('ruft onChange mit neuer Gruppen-Id auf wenn Gruppen-Select geändert wird', () => {
    const onChange = jest.fn();
    render(
      <MessageComposePane
        {...defaultProps}
        users={[REGULAR_USER]}
        groups={[{ id: 'g1', name: 'Gruppe A', memberCount: 3 }]}
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByText('+ Gruppe'));
    const groupSelect = screen.getByTestId('textfield-Gruppe w\u00e4hlen');
    fireEvent.change(groupSelect, { target: { value: 'g1' } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ groupId: 'g1' })
    );
  });
});
