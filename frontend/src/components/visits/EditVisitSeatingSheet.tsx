import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Platform } from "react-native";

import {
  Button,
  ButtonSpinner,
  ButtonText,
} from "@/components/ui/gluestack/button";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/gluestack/form-control";
import {
  Input as GluestackInput,
  InputField,
} from "@/components/ui/gluestack/input";
import {
  Drawer,
  DrawerBackdrop,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
} from "@/components/ui/gluestack/drawer";
import { Text } from "@/components/ui/gluestack/text";
import { useSnackbar } from "@/context/SnackbarContext";
import { useUpdateVisit } from "@/hooks/visits";
import { getErrorMessage } from "@/lib/errors";

type SeatingForm = {
  seating_location: string;
};

interface EditVisitSeatingSheetProps {
  visitId: string;
  initialSeatingLocation: string | null;
  visible: boolean;
  onClose: () => void;
}

export function EditVisitSeatingSheet({
  visitId,
  initialSeatingLocation,
  visible,
  onClose,
}: EditVisitSeatingSheetProps) {
  const { showSnackbar } = useSnackbar();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const updateVisitMutation = useUpdateVisit({
    onSuccess: () => onClose(),
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting: isFormSubmitting },
  } = useForm<SeatingForm>({
    defaultValues: {
      seating_location: initialSeatingLocation ?? "",
    },
  });

  useEffect(() => {
    if (visible) {
      reset({ seating_location: initialSeatingLocation ?? "" });
      setSubmitError(null);
    }
  }, [visible, initialSeatingLocation, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);

    try {
      await updateVisitMutation.mutateAsync({
        id: visitId,
        payload: {
          seating_location: values.seating_location.trim() || null,
        },
      });
    } catch (err) {
      const message = getErrorMessage(err, "Failed to update seating");
      setSubmitError(message);
      showSnackbar({
        message: `Could not update seating. ${message}`,
        variant: "error",
      });
    }
  });

  const isSubmitting = isFormSubmitting || updateVisitMutation.isPending;

  return (
    <Drawer
      isOpen={visible}
      onClose={onClose}
      closeOnOverlayClick={!isSubmitting}
      anchor="bottom"
      size="md"
    >
      <DrawerBackdrop />
      <DrawerContent className="gap-5 bg-card px-5 py-5">
        <DrawerHeader className="border-b border-border">
          <Text size="lg" bold>
            Edit seating
          </Text>
        </DrawerHeader>

        <DrawerBody
          contentContainerClassName="gap-5"
          keyboardShouldPersistTaps="handled"
        >
          <FormControl className="gap-2">
            <FormControlLabel nativeID="edit-seating-label">
              <FormControlLabelText>Seating (optional)</FormControlLabelText>
            </FormControlLabel>
            <Controller
              control={control}
              name="seating_location"
              render={({ field: { value, onChange, onBlur } }) => (
                <GluestackInput variant="outline" size="lg">
                  <InputField
                    nativeID="edit-seating"
                    accessibilityLabelledBy="edit-seating-label"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Section 112, Row 5"
                    autoFocus
                    selectTextOnFocus
                    textAlignVertical="center"
                    style={Platform.select({
                      ios: { paddingTop: 13, paddingBottom: 13 },
                      default: undefined,
                    })}
                  />
                </GluestackInput>
              )}
            />
          </FormControl>

          {submitError ? (
            <Text size="sm" className="text-center text-error-500">
              {submitError}
            </Text>
          ) : null}
        </DrawerBody>

        <DrawerFooter className="gap-3">
          <Button
            action="primary"
            variant="outline"
            onPress={onClose}
            isDisabled={isSubmitting}
          >
            <ButtonText>Cancel</ButtonText>
          </Button>
          <Button
            action="primary"
            variant="solid"
            onPress={() => void onSubmit()}
            isDisabled={isSubmitting}
          >
            {isSubmitting ? <ButtonSpinner /> : <ButtonText>Save</ButtonText>}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
