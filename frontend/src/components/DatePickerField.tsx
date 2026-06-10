import DateTimePicker, {
    type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { APP_COLOR_SCHEME } from '@/constants/theme';
import { dateFromIsoDate, isoDateFromDate } from '@/lib/date';
import { formatVisitDate } from '@/lib/formatDate';

/** Matches app `--primary` (hsl 199 89% 48%). */
const PICKER_ACCENT = '#0ea5e9';

/** Slightly above dark `card` (17.5% L) so the calendar reads as its own surface. */
const DARK_PICKER_SURFACE = 'hsl(217, 33%, 22%)';

function iosPickerThemeProps(colorScheme: 'light' | 'dark') {
  return {
    themeVariant: colorScheme === 'dark' ? ('dark' as const) : ('light' as const),
    accentColor: PICKER_ACCENT,
  };
}

interface DatePickerFieldProps {
  label: string;
  nativeID: string;
  /** ISO date string (YYYY-MM-DD) for the API. */
  value: string;
  onChange: (isoDate: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  minimumDate?: Date;
  maximumDate?: Date;
}

function handlePickerChange(
  event: DateTimePickerEvent,
  selectedDate: Date | undefined,
  onChange: (isoDate: string) => void,
  onClose: () => void,
) {
  if (event.type === 'dismissed') {
    onClose();
    return;
  }
  if (selectedDate) {
    onChange(isoDateFromDate(selectedDate));
  }
  if (Platform.OS === 'android') {
    onClose();
  }
}

/**
 * Web uses native HTML only — RN Pressable/hidden inputs block iOS mobile browsers.
 */
function WebDatePickerField({
  label,
  nativeID,
  value,
  onChange,
  error,
  disabled = false,
  minimumDate,
  maximumDate,
}: DatePickerFieldProps) {
  const isDark = APP_COLOR_SCHEME === 'dark';
  const labelId = `${nativeID}-label`;
  const inputId = `${nativeID}-input`;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} id={labelId} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        id={inputId}
        name={nativeID}
        type="date"
        role="textbox"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        min={minimumDate ? isoDateFromDate(minimumDate) : undefined}
        max={maximumDate ? isoDateFromDate(maximumDate) : undefined}
        aria-labelledby={labelId}
        aria-invalid={Boolean(error)}
        className={[
          'box-border min-h-11 w-full rounded-md border border-input bg-background px-3 text-foreground',
          'outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
          error ? 'border-destructive' : '',
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          colorScheme: isDark ? 'dark' : 'auto',
          fontSize: 16,
          lineHeight: '1.25rem',
          touchAction: 'manipulation',
        }}
      />
      {error ? (
        <span className="text-sm text-destructive" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

export function DatePickerField(props: DatePickerFieldProps) {
  if (Platform.OS === 'web') {
    return <WebDatePickerField {...props} />;
  }

  return <NativeDatePickerField {...props} />;
}

function NativeDatePickerField({
  label,
  nativeID,
  value,
  onChange,
  placeholder = 'Select date',
  error,
  disabled = false,
  minimumDate,
  maximumDate,
}: DatePickerFieldProps) {
  const isDark = APP_COLOR_SCHEME === 'dark';
  const labelId = `${nativeID}-label`;
  const [open, setOpen] = useState(false);
  const [pickerDate, setPickerDate] = useState(() => dateFromIsoDate(value));

  useEffect(() => {
    if (open) {
      setPickerDate(dateFromIsoDate(value));
    }
  }, [open, value]);

  const displayLabel = value ? formatVisitDate(value) : placeholder;
  const pickerValue = open ? pickerDate : dateFromIsoDate(value);

  const openPicker = () => {
    if (disabled) {
      return;
    }
    setOpen(true);
  };

  return (
    <View className="gap-2">
      <Label nativeID={labelId}>{label}</Label>
      <Pressable
        nativeID={nativeID}
        accessibilityLabelledBy={labelId}
        disabled={disabled}
        onPress={openPicker}
        className={`flex h-10 flex-row items-center rounded-md border border-input bg-background px-3 ${
          disabled ? 'opacity-50' : 'active:opacity-80'
        } ${error ? 'border-destructive' : ''}`}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ expanded: open }}
      >
        <Text className={value ? '' : 'text-muted-foreground'}>{displayLabel}</Text>
      </Pressable>
      {error ? (
        <Text className="text-sm text-destructive" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
          <Pressable
            className="flex-1 justify-end bg-black/50"
            onPress={() => setOpen(false)}
          >
            <Pressable className="rounded-t-xl bg-card pb-8" onPress={(e) => e.stopPropagation()}>
              <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
                <Text variant="large">{label}</Text>
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => {
                    onChange(isoDateFromDate(pickerDate));
                    setOpen(false);
                  }}
                >
                  <Text>Done</Text>
                </Button>
              </View>
              <View
                className={
                  isDark
                    ? 'mx-4 overflow-hidden rounded-xl'
                    : 'items-center'
                }
                style={isDark ? { backgroundColor: DARK_PICKER_SURFACE } : undefined}
              >
                <DateTimePicker
                  value={pickerValue}
                  mode="date"
                  display="inline"
                  minimumDate={minimumDate}
                  maximumDate={maximumDate}
                  onChange={(_event, selectedDate) => {
                    if (selectedDate) {
                      setPickerDate(selectedDate);
                    }
                  }}
                  style={{
                    alignSelf: 'center',
                    backgroundColor: isDark ? DARK_PICKER_SURFACE : undefined,
                  }}
                  {...iosPickerThemeProps(APP_COLOR_SCHEME)}
                />
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}

      {Platform.OS === 'android' && open ? (
        <DateTimePicker
          value={pickerValue}
          mode="date"
          display="calendar"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={(event, selectedDate) =>
            handlePickerChange(event, selectedDate, onChange, () => setOpen(false))
          }
        />
      ) : null}
    </View>
  );
}
