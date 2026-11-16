import { AlertDialog } from "@/components/ui/gluestack/alert-dialog";
import {
  Button,
  ButtonSpinner,
  ButtonText,
} from "@/components/ui/gluestack/button";
import { Text } from "@/components/ui/gluestack/text";
import { useSnackbar } from "@/context/SnackbarContext";
import { useDeleteVisit } from "@/hooks/visits";
import { getErrorMessage } from "@/lib/errors";

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
  const { showSnackbar } = useSnackbar();
  const deleteVisitMutation = useDeleteVisit({
    onSuccess: onDeleted,
  });

  const handleDelete = async () => {
    try {
      await deleteVisitMutation.mutateAsync(visitId);
    } catch (err) {
      const message = getErrorMessage(err, "Failed to delete visit");
      showSnackbar({
        message: `Could not delete visit. ${message}`,
        variant: "error",
      });
    }
  };

  const isDeleting = deleteVisitMutation.isPending;

  return (
    <AlertDialog
      isOpen={visible}
      onClose={onClose}
      closeOnOverlayClick={!isDeleting}
    >
      <AlertDialog.Backdrop className="absolute inset-0 bg-black/50" />
      <AlertDialog.Content className="w-full max-w-sm gap-5 rounded-xl border border-border bg-background px-5 py-6">
        <AlertDialog.Body className="gap-2">
          <Text size="md" bold className="text-center">
            Are you sure you want to delete this visit?
          </Text>
          <Text size="sm" className="text-center text-typography-500">
            Deleting a visit is permanent and will remove it from your visit
            history and stats.
          </Text>
        </AlertDialog.Body>
        <AlertDialog.Footer className="gap-3">
          <Button
            action="negative"
            variant="solid"
            onPress={handleDelete}
            isDisabled={isDeleting}
          >
            {isDeleting ? <ButtonSpinner /> : <ButtonText>Delete visit</ButtonText>}
          </Button>
          <Button
            action="primary"
            variant="outline"
            onPress={onClose}
            isDisabled={isDeleting}
          >
            <ButtonText>Cancel</ButtonText>
          </Button>
        </AlertDialog.Footer>
      </AlertDialog.Content>
    </AlertDialog>
  );
}
