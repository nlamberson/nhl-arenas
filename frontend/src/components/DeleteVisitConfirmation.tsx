import { ActivityIndicator, Alert, Modal, Pressable, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { PRIMARY_BUTTON_SPINNER_COLOR } from '@/constants/theme';
import { useDeleteVisit } from '@/hooks/visits';
import { getErrorMessage } from '@/lib/errors';

interface DeleteVisitConfirmationProps {
  visitId: string;
  visible: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteVisitConfirmation({
  visitId,
  visible,
  onClose,
  onDeleted,
}: DeleteVisitConfirmationProps) {
  const deleteVisitMutation = useDeleteVisit({
    onSuccess: onDeleted,
  });

  const handleDelete = async () => {
    try {
      await deleteVisitMutation.mutateAsync(visitId);
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to delete visit');
      Alert.alert('Could not delete visit', message);
    }
  };

  const isDeleting = deleteVisitMutation.isPending;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable
        className="flex-1 items-center justify-center bg-black/50 px-6"
        onPress={onClose}
      >
        <Pressable
          className="w-full max-w-sm gap-5 rounded-xl border border-border bg-card px-5 py-6"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="gap-2">
            <Text className="text-center text-base font-bold">
              Are you sure you want to delete this visit?
            </Text>
            <Text variant="muted" className="text-center">
              Deleting a visit is permanent and will remove it from your visit history and stats.
            </Text>
          </View>

          <View className="gap-3">
            <Button
              variant="destructive"
              onPress={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator color={PRIMARY_BUTTON_SPINNER_COLOR} />
              ) : (
                <Text>Delete visit</Text>
              )}
            </Button>
            <Button variant="outline" onPress={onClose} disabled={isDeleting}>
              <Text>Cancel</Text>
            </Button>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
