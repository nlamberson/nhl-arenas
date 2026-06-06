import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { EditVisitSeatingSheet } from '@/components/EditVisitSeatingSheet';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ScoreBug } from '@/components/ScoreBug';
import { useVisit } from '@/hooks/visits';
import { formatVisitDate } from '@/lib/formatDate';

function resolveVisitId(id: string | string[] | undefined): string | undefined {
  if (typeof id === 'string') {
    return id;
  }
  if (Array.isArray(id)) {
    return id[0];
  }
  return undefined;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="gap-1">
      <Text variant="muted" className="text-xs uppercase tracking-wide">
        {label}
      </Text>
      <Text className="text-base">{value}</Text>
    </View>
  );
}

function SeatingDetailRow({
  value,
  onEdit,
}: {
  value: string;
  onEdit: () => void;
}) {
  return (
    <View className="gap-1">
      <View className="flex-row items-center justify-between gap-2">
        <Text variant="muted" className="text-xs uppercase tracking-wide">
          Seating
        </Text>
        <Button variant="ghost" size="sm" onPress={onEdit} accessibilityLabel="Edit seating">
          <Text>Edit</Text>
        </Button>
      </View>
      <Text className="text-base">{value}</Text>
    </View>
  );
}

function ImageGridStub() {
  return (
    <View className="gap-3">
      <Text variant="large">Photos</Text>
      <View className="flex-row flex-wrap gap-3">
        {[0, 1, 2, 3].map((slot) => (
          <View
            key={slot}
            className="aspect-square w-[47%] items-center justify-center rounded-lg border border-dashed border-border bg-muted/30"
          >
            <Text variant="muted" className="text-xs">
              Photo {slot + 1}
            </Text>
          </View>
        ))}
      </View>
      <Text variant="muted" className="text-center text-xs">
        Image uploads coming in a future release
      </Text>
    </View>
  );
}

export default function VisitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const visitId = resolveVisitId(id);
  const { visit, loading, error } = useVisit(visitId);
  const [editingSeating, setEditingSeating] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <ScreenHeader title="Visit" trailingSpacerWidth="md" />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      ) : error || !visit ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-destructive">
            {error ?? 'Visit not found'}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerClassName="gap-6 px-4 py-6 pb-10">
          <ScoreBug visit={visit} />

          <View className="gap-4 rounded-xl border border-border bg-card px-4 py-4">
            <DetailRow label="Arena" value={visit.arena.name} />
            {visit.arena.city ? (
              <DetailRow label="City" value={visit.arena.city} />
            ) : null}
            <DetailRow label="Date" value={formatVisitDate(visit.visit_date)} />
            <SeatingDetailRow
              value={visit.seating_location?.trim() || 'Not recorded'}
              onEdit={() => setEditingSeating(true)}
            />
          </View>

          <ImageGridStub />

          <EditVisitSeatingSheet
            visitId={visit.id}
            initialSeatingLocation={visit.seating_location}
            visible={editingSeating}
            onClose={() => setEditingSeating(false)}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
