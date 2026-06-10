import { useMemo } from 'react';
import { ActivityIndicator, RefreshControl, SectionList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { AddVisitButton } from '@/components/AddVisitButton';
import { PageLoadingIndicator } from '@/components/PageLoadingIndicator';
import { ScreenHeader } from '@/components/ScreenHeader';
import { VisitRow } from '@/components/VisitRow';
import { usePaginatedVisits } from '@/hooks/visits';
import type { VisitResponse } from '@/lib/types';
import { groupVisitsBySeason, type VisitSeasonSection } from '@/lib/visits';

export default function VisitsIndexScreen() {
  const {
    visits,
    loading,
    loadingMore,
    refreshing,
    error,
    hasMore,
    loadMore,
    refresh,
  } = usePaginatedVisits();

  const sections = useMemo(() => groupVisitsBySeason(visits), [visits]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <ScreenHeader title="Visit history" />

      {loading && visits.length === 0 ? (
        <PageLoadingIndicator
          message="Loading visit history…"
          description="This may take a moment if the server is waking up."
        />
      ) : (
        <SectionList<VisitResponse, VisitSeasonSection>
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <VisitRow visit={item} />}
          renderSectionHeader={({ section: { title } }) => (
            <View className="bg-background px-4 pb-2 pt-4">
              <Text variant="large">{title}</Text>
            </View>
          )}
          stickySectionHeadersEnabled
          contentContainerClassName="grow px-4 pb-24 pt-1"
          ListEmptyComponent={
            !error ? (
              <View className="px-6 py-16">
                <Text variant="muted" className="text-center">
                  No visits yet. Tap the + button to log your first arena visit.
                </Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            loadingMore ? (
              <View className="py-6">
                <ActivityIndicator />
              </View>
            ) : null
          }
          ListHeaderComponent={
            error ? (
              <Text className="px-4 py-3 text-center text-sm text-destructive">{error}</Text>
            ) : null
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} />
          }
          onEndReached={() => {
            if (hasMore) {
              void loadMore();
            }
          }}
          onEndReachedThreshold={0.3}
        />
      )}

      <AddVisitButton />
    </SafeAreaView>
  );
}
