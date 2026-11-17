import { ChevronDown } from "lucide-react-native";
import { useState } from "react";
import { ScrollView } from "react-native";
import { TeamLogo } from "@/components/hockey/TeamLogo";
import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/gluestack/box";
import {
  Button,
  ButtonIcon,
  ButtonText,
} from "@/components/ui/gluestack/button";
import {
  Popover,
  PopoverBackdrop,
  PopoverBody,
  PopoverContent,
} from "@/components/ui/gluestack/popover";
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/gluestack/form-control";
import { Input, InputField } from "@/components/ui/gluestack/input";

export interface SelectTeamFieldOption {
  value: string;
  label: string;
  city?: string | null;
  abbreviation?: string;
}

interface SelectTeamFieldProps {
  label: string;
  nativeID: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectTeamFieldOption[];
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}

export function SelectTeamField({
  label,
  nativeID,
  value,
  onChange,
  options,
  placeholder = "Select…",
  error,
  disabled = false,
}: SelectTeamFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [triggerWidth, setTriggerWidth] = useState(0);
  const selected = options.find((option) => option.value === value);
  const searchTerm = search.trim().toLowerCase();
  const filteredOptions = options.filter((option) =>
    [option.label, option.city, option.abbreviation].some((term) =>
      term?.toLowerCase().includes(searchTerm),
    ),
  );

  return (
    <FormControl
      className="gap-2"
      isInvalid={Boolean(error)}
      isDisabled={disabled}
    >
      <FormControlLabel nativeID={`${nativeID}-label`}>
        <FormControlLabelText>{label}</FormControlLabelText>
      </FormControlLabel>
      <Popover
        isOpen={isOpen}
        placement="bottom"
        offset={4}
        shouldFlip
        focusScope={false}
        onOpen={() => {
          setSearch("");
          setIsOpen(true);
        }}
        onClose={() => setIsOpen(false)}
        trigger={(triggerProps, state) => (
          <Button
            {...triggerProps}
            nativeID={nativeID}
            accessibilityLabel={`${label}: ${selected?.label ?? placeholder}`}
            accessibilityState={{ disabled, expanded: state.open }}
            isDisabled={disabled}
            onLayout={(event) =>
              setTriggerWidth(event.nativeEvent.layout.width)
            }
            action={error ? "negative" : "default"}
            variant="outline"
            size="md"
            className={`w-full justify-between overflow-hidden px-3 ${
              error ? "border-error-600" : "border-outline-100"
            }`}
          >
            <Box className="min-w-0 flex-1 flex-row items-center gap-2">
              {selected?.abbreviation ? (
                <TeamLogo
                  abbreviation={selected.abbreviation}
                  size={24}
                  className="shrink-0"
                />
              ) : null}
              <ButtonText
                className={`flex-1 ${
                  selected ? "text-typography-900" : "text-typography-500"
                }`}
                numberOfLines={1}
              >
                {selected?.label ?? placeholder}
              </ButtonText>
            </Box>
            <ButtonIcon
              as={ChevronDown}
              size="md"
              className="text-typography-500"
            />
          </Button>
        )}
      >
        <PopoverBackdrop />
        <PopoverContent
          size="full"
          accessibilityLabel={`Choose ${label}`}
          className="p-2 shadow-hard-5"
          style={{
            width: triggerWidth || undefined,
            maxHeight: 320,
          }}
        >
          <Input className="w-full">
            <InputField
              accessibilityLabel={`Filter ${label} options`}
              placeholder="Type to filter..."
              value={search}
              onChangeText={setSearch}
            />
          </Input>
          <PopoverBody className="mt-1 w-full">
            <ScrollView
              className="w-full"
              style={{ maxHeight: 252 }}
              keyboardShouldPersistTaps="handled"
            >
              {filteredOptions.length ? (
                filteredOptions.map((option) => (
                  <Button
                    key={option.value}
                    accessibilityState={{ selected: option.value === value }}
                    action="default"
                    variant="solid"
                    size="sm"
                    className={`w-full h-auto min-h-9 justify-start rounded px-3 py-2 ${
                      option.value === value
                        ? "bg-background-100"
                        : "bg-transparent"
                    }`}
                    onPress={() => {
                      onChange(option.value);
                      setIsOpen(false);
                      setSearch("");
                    }}
                  >
                    <Box className="flex-row items-center gap-2">
                      {option.abbreviation ? (
                        <TeamLogo
                          abbreviation={option.abbreviation}
                          size={20}
                          className="shrink-0"
                        />
                      ) : null}
                      <ButtonText
                        className="text-typography-900 data-[hover=true]:text-typography-900 data-[active=true]:text-typography-900"
                      >
                        {option.label}
                      </ButtonText>
                    </Box>
                  </Button>
                ))
              ) : (
                <Text className="px-3 py-2 text-typography-500">
                  No options found
                </Text>
              )}
            </ScrollView>
          </PopoverBody>
        </PopoverContent>
      </Popover>
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
