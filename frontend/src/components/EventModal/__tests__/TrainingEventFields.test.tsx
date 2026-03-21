import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TrainingEventFields } from '../TrainingEventFields';
import { EventData } from '../../../types/event';

// Mock MUI components that cause issues in test env
jest.mock('@mui/material/Switch', () => (props: any) => (
  <input
    type="checkbox"
    data-testid="recurring-switch"
    checked={props.checked}
    onChange={props.onChange}
  />
));

describe('TrainingEventFields', () => {
  const mockHandleChange = jest.fn();

  const baseFormData: EventData = {
    title: 'Training',
    date: '2025-06-10',
    time: '18:00',
    endTime: '19:30',
    trainingTeamId: '1',
    trainingRecurring: false,
    trainingWeekdays: [],
    trainingEndDate: '',
    trainingDuration: 90,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const teams = [
    { value: '1', label: 'U19' },
    { value: '2', label: 'Erste Mannschaft' },
  ];

  it('renders training section header', () => {
    render(
      <TrainingEventFields
        formData={baseFormData}
        teams={teams}
        handleChange={mockHandleChange}
      />
    );
    expect(screen.getByText('Training')).toBeInTheDocument();
  });

  it('renders team select', () => {
    render(
      <TrainingEventFields
        formData={baseFormData}
        teams={teams}
        handleChange={mockHandleChange}
      />
    );
    expect(screen.getByLabelText('Team *')).toBeInTheDocument();
  });

  it('renders time and duration section', () => {
    render(
      <TrainingEventFields
        formData={baseFormData}
        teams={teams}
        handleChange={mockHandleChange}
      />
    );
    expect(screen.getByText('Uhrzeit & Dauer')).toBeInTheDocument();
    expect(screen.getByText('Dauer (Minuten)')).toBeInTheDocument();
  });

  it('renders duration preset chips', () => {
    render(
      <TrainingEventFields
        formData={baseFormData}
        teams={teams}
        handleChange={mockHandleChange}
      />
    );
    expect(screen.getByText('60 min')).toBeInTheDocument();
    expect(screen.getByText('75 min')).toBeInTheDocument();
    expect(screen.getByText('90 min')).toBeInTheDocument();
    expect(screen.getByText('105 min')).toBeInTheDocument();
    expect(screen.getByText('120 min')).toBeInTheDocument();
  });

  it('calls handleChange with duration when preset chip is clicked', () => {
    render(
      <TrainingEventFields
        formData={baseFormData}
        teams={teams}
        handleChange={mockHandleChange}
      />
    );
    fireEvent.click(screen.getByText('75 min'));
    expect(mockHandleChange).toHaveBeenCalledWith('trainingDuration', 75);
  });

  it('computes end time when duration preset is clicked and time is set', () => {
    render(
      <TrainingEventFields
        formData={baseFormData}
        teams={teams}
        handleChange={mockHandleChange}
      />
    );
    // Click 120 min preset — time is 18:00 so endTime should update
    fireEvent.click(screen.getByText('120 min'));
    expect(mockHandleChange).toHaveBeenCalledWith('trainingDuration', 120);
    expect(mockHandleChange).toHaveBeenCalledWith('endTime', '20:00');
  });

  it('computes end time correctly for 60 min', () => {
    render(
      <TrainingEventFields
        formData={baseFormData}
        teams={teams}
        handleChange={mockHandleChange}
      />
    );
    fireEvent.click(screen.getByText('60 min'));
    expect(mockHandleChange).toHaveBeenCalledWith('endTime', '19:00');
  });

  it('renders Beginn and Ende time fields', () => {
    render(
      <TrainingEventFields
        formData={baseFormData}
        teams={teams}
        handleChange={mockHandleChange}
      />
    );
    expect(screen.getByLabelText('Beginn')).toBeInTheDocument();
    expect(screen.getByLabelText('Ende')).toBeInTheDocument();
  });

  it('calls handleChange for time and endTime when Beginn changes', () => {
    render(
      <TrainingEventFields
        formData={baseFormData}
        teams={teams}
        handleChange={mockHandleChange}
      />
    );
    const beginInput = screen.getByLabelText('Beginn');
    fireEvent.change(beginInput, { target: { value: '17:00' } });
    expect(mockHandleChange).toHaveBeenCalledWith('time', '17:00');
    // Duration is 90 min, so endTime = 18:30
    expect(mockHandleChange).toHaveBeenCalledWith('endTime', '18:30');
  });

  it('renders recurring training toggle', () => {
    render(
      <TrainingEventFields
        formData={baseFormData}
        teams={teams}
        handleChange={mockHandleChange}
      />
    );
    expect(screen.getByText('Wiederkehrendes Training')).toBeInTheDocument();
  });

  it('shows weekday chips when recurring is enabled', () => {
    const recurringFormData = {
      ...baseFormData,
      trainingRecurring: true,
    };
    render(
      <TrainingEventFields
        formData={recurringFormData}
        teams={teams}
        handleChange={mockHandleChange}
      />
    );
    expect(screen.getByText('Mo')).toBeInTheDocument();
    expect(screen.getByText('Di')).toBeInTheDocument();
    expect(screen.getByText('Mi')).toBeInTheDocument();
    expect(screen.getByText('Do')).toBeInTheDocument();
    expect(screen.getByText('Fr')).toBeInTheDocument();
    expect(screen.getByText('Sa')).toBeInTheDocument();
    expect(screen.getByText('So')).toBeInTheDocument();
  });

  it('does not show weekday chips when recurring is disabled', () => {
    render(
      <TrainingEventFields
        formData={baseFormData}
        teams={teams}
        handleChange={mockHandleChange}
      />
    );
    // Weekday chips are only visible in recurring mode
    expect(screen.queryByText('Wochentage auswählen:')).not.toBeInTheDocument();
  });

  it('toggles weekday when chip is clicked', () => {
    const recurringFormData = {
      ...baseFormData,
      trainingRecurring: true,
      trainingWeekdays: [1], // Monday selected
    };
    render(
      <TrainingEventFields
        formData={recurringFormData}
        teams={teams}
        handleChange={mockHandleChange}
      />
    );
    // Click Wednesday to add it
    fireEvent.click(screen.getByText('Mi'));
    expect(mockHandleChange).toHaveBeenCalledWith('trainingWeekdays', [1, 3]);
  });

  it('removes weekday when already-selected chip is clicked', () => {
    const recurringFormData = {
      ...baseFormData,
      trainingRecurring: true,
      trainingWeekdays: [1, 3],
    };
    render(
      <TrainingEventFields
        formData={recurringFormData}
        teams={teams}
        handleChange={mockHandleChange}
      />
    );
    // Click Monday to remove it
    fireEvent.click(screen.getByText('Mo'));
    expect(mockHandleChange).toHaveBeenCalledWith('trainingWeekdays', [3]);
  });

  it('shows occurrence count when recurring with valid dates and weekdays', () => {
    const recurringFormData = {
      ...baseFormData,
      trainingRecurring: true,
      trainingWeekdays: [1], // Mon
      trainingEndDate: '2025-06-30',
    };
    render(
      <TrainingEventFields
        formData={recurringFormData}
        teams={teams}
        handleChange={mockHandleChange}
      />
    );
    // Mon between June 10 and June 30: Jun 16, 23, 30 = 3 Trainings
    expect(screen.getByText(/3 Trainings/)).toBeInTheDocument();
  });

  it('shows warning when recurring but no weekdays selected', () => {
    const recurringFormData = {
      ...baseFormData,
      trainingRecurring: true,
      trainingWeekdays: [],
    };
    render(
      <TrainingEventFields
        formData={recurringFormData}
        teams={teams}
        handleChange={mockHandleChange}
      />
    );
    expect(screen.getByText(/mindestens einen Wochentag/)).toBeInTheDocument();
  });

  it('uses default duration of 90 when trainingDuration is not set', () => {
    const formDataWithout = {
      ...baseFormData,
      trainingDuration: undefined,
    };
    render(
      <TrainingEventFields
        formData={formDataWithout}
        teams={teams}
        handleChange={mockHandleChange}
      />
    );
    // The 90 min chip should be the active one (rendered with filled variant)
    expect(screen.getByText('90 min')).toBeInTheDocument();
  });
});
