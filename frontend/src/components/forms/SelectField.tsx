import { ChevronDown } from "lucide-react-native";

import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/gluestack/form-control";
import {
  Select,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicator,
  SelectDragIndicatorWrapper,
  SelectIcon,
  SelectInput,
  SelectItem,
  SelectPortal,
  SelectTrigger,
} from "@/components/ui/gluestack/select";

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

export function SelectField({
  label,
  nativeID,
  value,
  onChange,
  options,
  placeholder = "Select…",
  error,
  disabled = false,
}: SelectFieldProps) {
  const selected = options.find((option) => option.value === value);

  return (
    <FormControl
      className="gap-2"
      isInvalid={Boolean(error)}
      isDisabled={disabled}
    >
      <FormControlLabel nativeID={`${nativeID}-label`}>
        <FormControlLabelText>{label}</FormControlLabelText>
      </FormControlLabel>
      <Select
        key={value}
        selectedValue={value || null}
        selectedLabel={selected?.label}
        initialLabel={selected?.label}
        placeholder={placeholder}
        onValueChange={onChange}
        isDisabled={disabled}
        isInvalid={Boolean(error)}
      >
        <SelectTrigger
          nativeID={nativeID}
          accessibilityLabel={`${label}: ${selected?.label ?? placeholder}`}
          variant="outline"
          size="md"
        >
          <SelectInput placeholder={placeholder} className="flex-1" />
          <SelectIcon as={ChevronDown} className="mr-3" />
        </SelectTrigger>
        <SelectPortal>
          <SelectBackdrop />
          <SelectContent>
            <SelectDragIndicatorWrapper>
              <SelectDragIndicator />
            </SelectDragIndicatorWrapper>
            {options.map((option) => (
              <SelectItem
                key={option.value}
                label={option.label}
                value={option.value}
              />
            ))}
          </SelectContent>
        </SelectPortal>
      </Select>
      {error ? (
        <FormControlError>
          <FormControlErrorText
            nativeID={`${nativeID}-error`}
            accessibilityLiveRegion="polite"
          >
            {error}
          </FormControlErrorText>
        </FormControlError>
      ) : null}
    </FormControl>
  );
}
