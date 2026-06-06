import { memo, useCallback } from 'react';
import { FlatList, View } from 'react-native';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  type Option,
} from '@/components/ui/select';
import { Text } from '@/components/ui/text';
import { TeamLogo } from '@/components/TeamLogo';
import { cn } from '@/lib/utils';

export interface SelectFieldOption {
  value: string;
  label: string;
  /** When set, shows the NHL team logo beside the label. */
  abbreviation?: string;
}

interface SelectFieldProps {
  label: string;
  nativeID: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectFieldOption[];
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}

const TRIGGER_LOGO_SIZE = 22;
const LIST_LOGO_SIZE = 28;
const LIST_ITEM_HEIGHT = 52;
const LIST_MAX_HEIGHT = 384;

const OptionLabel = memo(function OptionLabel({
  label,
  abbreviation,
  emphasized,
  logoSize,
}: {
  label: string;
  abbreviation?: string;
  emphasized?: boolean;
  logoSize: number;
}) {
  return (
    <View className="min-w-0 flex-1 flex-row items-center gap-2.5">
      {abbreviation ? (
        <TeamLogo abbreviation={abbreviation} size={logoSize} />
      ) : null}
      <Text
        className={cn('flex-1', emphasized && 'font-semibold text-primary')}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
});

function toSelectValue(value: string, options: SelectFieldOption[]): Option {
  if (!value) {
    return undefined;
  }
  const match = options.find((o) => o.value === value);
  return match ? { value: match.value, label: match.label } : undefined;
}

export function SelectField({
  label,
  nativeID,
  value,
  onChange,
  options,
  placeholder = 'Select…',
  error,
  disabled = false,
}: SelectFieldProps) {
  const labelId = `${nativeID}-label`;
  const selected = options.find((o) => o.value === value);

  const renderOption = useCallback(
    ({ item }: { item: SelectFieldOption }) => (
      <SelectItem value={item.value} label={item.label} className="py-3">
        <OptionLabel
          label={item.label}
          abbreviation={item.abbreviation}
          emphasized={item.value === value}
          logoSize={LIST_LOGO_SIZE}
        />
      </SelectItem>
    ),
    [value],
  );

  const getItemLayout = useCallback(
    (_data: ArrayLike<SelectFieldOption> | null | undefined, index: number) => ({
      length: LIST_ITEM_HEIGHT,
      offset: LIST_ITEM_HEIGHT * index,
      index,
    }),
    [],
  );

  return (
    <View className="gap-2">
      <Label nativeID={labelId}>{label}</Label>
      <Select
        value={toSelectValue(value, options)}
        onValueChange={(option) => onChange(option?.value ?? '')}
        disabled={disabled}
      >
        <SelectTrigger
          nativeID={nativeID}
          accessibilityLabelledBy={labelId}
          className={cn('w-full', error && 'border-destructive')}
          aria-invalid={Boolean(error)}
        >
          {selected?.abbreviation ? (
            <OptionLabel
              label={selected.label}
              abbreviation={selected.abbreviation}
              logoSize={TRIGGER_LOGO_SIZE}
            />
          ) : (
            <SelectValue placeholder={placeholder} />
          )}
        </SelectTrigger>
        <SelectContent className="w-full" disableScrollWrapper>
          <FlatList
            data={options}
            keyExtractor={(item) => item.value}
            renderItem={renderOption}
            getItemLayout={getItemLayout}
            style={{ maxHeight: LIST_MAX_HEIGHT }}
            initialNumToRender={12}
            maxToRenderPerBatch={8}
            windowSize={5}
            keyboardShouldPersistTaps="handled"
          />
        </SelectContent>
      </Select>
      {error ? (
        <Text
          className="text-sm text-destructive"
          accessibilityLiveRegion="polite"
          nativeID={`${nativeID}-error`}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}
