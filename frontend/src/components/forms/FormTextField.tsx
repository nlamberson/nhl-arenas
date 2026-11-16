import type { ComponentProps } from "react";
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
  type RegisterOptions,
} from "react-hook-form";
import { View } from "react-native";

import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/gluestack/form-control";
import {
  Input as GluestackInput,
  InputField,
} from "@/components/ui/gluestack/input";

type InputFieldProps = ComponentProps<typeof InputField>;

interface FormTextFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  fieldId: string;
  rules?: RegisterOptions<T, FieldPath<T>>;
  disabled?: boolean;
  inputProps?: Omit<
    InputFieldProps,
    "value" | "onChangeText" | "onBlur" | "nativeID" | "accessibilityLabelledBy"
  >;
}

export function FormTextField<T extends FieldValues>({
  control,
  name,
  label,
  fieldId,
  rules,
  disabled = false,
  inputProps,
}: FormTextFieldProps<T>) {
  const labelId = `${fieldId}-label`;

  return (
    <FormControl className="gap-2">
      <FormControlLabel nativeID={labelId}>
        <FormControlLabelText>{label}</FormControlLabelText>
      </FormControlLabel>
      <Controller
        control={control}
        name={name}
        rules={rules}
        render={({
          field: { onChange, onBlur, value },
          fieldState: { error },
        }) => (
          <View className="gap-1.5">
            <GluestackInput
              variant="outline"
              size="md"
              isInvalid={Boolean(error)}
              isDisabled={disabled}
            >
              <InputField
                nativeID={fieldId}
                accessibilityLabelledBy={labelId}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                aria-invalid={Boolean(error)}
                {...inputProps}
              />
            </GluestackInput>
            {error ? (
              <FormControlError>
                <FormControlErrorText
                  accessibilityLiveRegion="polite"
                  nativeID={`${fieldId}-error`}
                >
                  {error.message}
                </FormControlErrorText>
              </FormControlError>
            ) : null}
          </View>
        )}
      />
    </FormControl>
  );
}
