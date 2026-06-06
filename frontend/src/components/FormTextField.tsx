import type { ComponentProps } from 'react';
import { Controller, type Control, type FieldPath, type FieldValues, type RegisterOptions } from 'react-hook-form';
import { View } from 'react-native';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';

type InputProps = ComponentProps<typeof Input>;

interface FormTextFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  fieldId: string;
  rules?: RegisterOptions<T, FieldPath<T>>;
  inputProps?: Omit<InputProps, 'value' | 'onChangeText' | 'onBlur' | 'nativeID' | 'accessibilityLabelledBy'>;
}

export function FormTextField<T extends FieldValues>({
  control,
  name,
  label,
  fieldId,
  rules,
  inputProps,
}: FormTextFieldProps<T>) {
  const labelId = `${fieldId}-label`;

  return (
    <View className="gap-2">
      <Label nativeID={labelId}>{label}</Label>
      <Controller
        control={control}
        name={name}
        rules={rules}
        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
          <View className="gap-1.5">
            <Input
              nativeID={fieldId}
              accessibilityLabelledBy={labelId}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              aria-invalid={Boolean(error)}
              {...inputProps}
            />
            {error ? (
              <Text
                className="text-sm text-destructive"
                accessibilityLiveRegion="polite"
                nativeID={`${fieldId}-error`}
              >
                {error.message}
              </Text>
            ) : null}
          </View>
        )}
      />
    </View>
  );
}
