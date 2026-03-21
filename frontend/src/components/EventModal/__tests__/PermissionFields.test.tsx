import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PermissionFields } from '../PermissionFields';
import { EventData, User } from '../../../types/event';

// ────── MUI Mock (per-subpath, matching how PermissionFields.tsx imports) ─────
jest.mock('@mui/material/FormControl', () => (props: any) => <div>{props.children}</div>);
jest.mock('@mui/material/InputLabel', () => (props: any) => <label>{props.children}</label>);
jest.mock('@mui/material/Select', () => (props: any) => (
  <select
    data-testid="select-permission-type"
    value={props.value}
    onChange={(e) => props.onChange?.({ target: { value: e.target.value } })}
  >
    {props.children}
  </select>
));
jest.mock('@mui/material/MenuItem', () => (props: any) => <option value={props.value}>{props.children}</option>);
jest.mock('@mui/material/Autocomplete', () => (props: any) => (
  <div data-testid="autocomplete">
    {props.options?.map((option: any) => {
      const rendered = props.renderOption
        ? props.renderOption({ key: option.id }, option, { inputValue: '', selected: false })
        : <span>{props.getOptionLabel(option)}</span>;
      return (
        <div key={option.id ?? option.value} data-testid={`option-${option.id ?? option.value}`}>
          <div data-testid={`label-${option.id ?? option.value}`}>{props.getOptionLabel(option)}</div>
          <div data-testid={`render-${option.id ?? option.value}`}>{rendered}</div>
        </div>
      );
    })}
    {props.renderInput({ inputProps: {}, InputLabelProps: {} })}
  </div>
));
jest.mock('@mui/material/TextField', () => (props: any) => <input placeholder={props.label} />);
jest.mock('@mui/material/Box', () => (props: any) => <div>{props.children}</div>);
jest.mock('@mui/material/Typography', () => (props: any) => <span data-typography={props.variant}>{props.children}</span>);

// ────── Fixtures ──────────────────────────────────────────────────────────────
const teams = [
  { value: '1', label: 'U17' },
  { value: '2', label: '1. Mannschaft' },
];

const usersWithContext: User[] = [
  { id: '10', fullName: 'Max Mustermann', context: 'Spieler · U17' },
  { id: '20', fullName: 'Anna Schmidt', context: 'Trainer · 1. Mannschaft' },
];

const usersWithoutContext: User[] = [
  { id: '30', fullName: 'Klaus Ohnekontext' },
];

const noop = () => {};

// ────── Tests ─────────────────────────────────────────────────────────────────
describe('PermissionFields – user-Sichtbarkeit', () => {
  it('zeigt keinen Benutzer-Autocomplete wenn permissionType nicht "user"', () => {
    const formData: EventData = { permissionType: 'public' };
    render(
      <PermissionFields formData={formData} teams={teams} users={usersWithContext} handleChange={noop} />
    );
    expect(screen.queryByTestId('autocomplete')).not.toBeInTheDocument();
  });

  it('zeigt Benutzer-Autocomplete wenn permissionType "user"', () => {
    const formData: EventData = { permissionType: 'user' };
    render(
      <PermissionFields formData={formData} teams={teams} users={usersWithContext} handleChange={noop} />
    );
    expect(screen.getByTestId('autocomplete')).toBeInTheDocument();
  });

  it('getOptionLabel enthält fullName + context in Klammern', () => {
    const formData: EventData = { permissionType: 'user' };
    render(
      <PermissionFields formData={formData} teams={teams} users={usersWithContext} handleChange={noop} />
    );
    expect(screen.getByTestId('label-10')).toHaveTextContent('Max Mustermann (Spieler · U17)');
    expect(screen.getByTestId('label-20')).toHaveTextContent('Anna Schmidt (Trainer · 1. Mannschaft)');
  });

  it('getOptionLabel gibt nur fullName zurück wenn kein context', () => {
    const formData: EventData = { permissionType: 'user' };
    render(
      <PermissionFields formData={formData} teams={teams} users={usersWithoutContext} handleChange={noop} />
    );
    expect(screen.getByTestId('label-30')).toHaveTextContent('Klaus Ohnekontext');
    expect(screen.getByTestId('label-30')).not.toHaveTextContent('(');
  });

  it('renderOption zeigt fullName in body2-Typography', () => {
    const formData: EventData = { permissionType: 'user' };
    render(
      <PermissionFields formData={formData} teams={teams} users={usersWithContext} handleChange={noop} />
    );
    const renderedOption = screen.getByTestId('render-10');
    expect(renderedOption).toHaveTextContent('Max Mustermann');
  });

  it('renderOption zeigt context in caption-Typography', () => {
    const formData: EventData = { permissionType: 'user' };
    render(
      <PermissionFields formData={formData} teams={teams} users={usersWithContext} handleChange={noop} />
    );
    const renderedOption = screen.getByTestId('render-10');
    const captionEl = renderedOption.querySelector('[data-typography="caption"]');
    expect(captionEl).toBeInTheDocument();
    expect(captionEl).toHaveTextContent('Spieler · U17');
  });

  it('renderOption zeigt keine context-Typography wenn kein context', () => {
    const formData: EventData = { permissionType: 'user' };
    render(
      <PermissionFields formData={formData} teams={teams} users={usersWithoutContext} handleChange={noop} />
    );
    const renderedOption = screen.getByTestId('render-30');
    const captionEl = renderedOption.querySelector('[data-typography="caption"]');
    expect(captionEl).not.toBeInTheDocument();
  });
});
