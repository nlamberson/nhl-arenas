import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { PRIMARY_BUTTON_SPINNER_COLOR } from '@/constants/theme';
import { useUpdateVisit } from '@/hooks/visits';
import { getErrorMessage } from '@/lib/errors';

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
      seating_location: initialSeatingLocation ?? '',
    },
  });

  useEffect(() => {
    if (visible) {
      reset({ seating_location: initialSeatingLocation ?? '' });
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
      const message = getErrorMessage(err, 'Failed to update seating');
      setSubmitError(message);
      Alert.alert('Could not update seating', message);
    }
  });

  const isSubmitting = isFormSubmitting || updateVisitMutation.isPending;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/50" onPress={onClose}>
        <Pressable className="rounded-t-xl bg-card" onPress={(e) => e.stopPropagation()}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
              <Text variant="large">Edit seating</Text>
              <Button variant="ghost" size="sm" onPress={onClose} disabled={isSubmitting}>
                <Text>Cancel</Text>
              </Button>
            </View>

            <ScrollView
              contentContainerClassName="gap-5 px-4 py-6 pb-10"
              keyboardShouldPersistTaps="handled"
            >
              <View className="gap-2">
                <Label nativeID="edit-seating-label">Seating (optional)</Label>
                <View className="h-12 overflow-hidden rounded-md border-2 border-border bg-background">
                  <Controller
                    control={control}
                    name="seating_location"
                    render={({ field: { value, onChange, onBlur } }) => (
                      <Input
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
                        className="h-12 border-0 bg-transparent px-3 py-0 leading-none shadow-none dark:bg-transparent"
                      />
                    )}
                  />
                </View>
              </View>

              {submitError ? (
                <Text className="text-center text-sm text-destructive">{submitError}</Text>
              ) : null}

              <Button onPress={onSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <ActivityIndicator color={PRIMARY_BUTTON_SPINNER_COLOR} />
                ) : (
                  <Text>Save</Text>
                )}
              </Button>
            </ScrollView>
          </KeyboardAvoidingView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
