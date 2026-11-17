import { useMemo } from "react";
import { RefreshControl, SectionList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AddVisitButton } from "@/components/visits/AddVisitButton";
import { Box } from "@/components/ui/gluestack/box";
import { PageLoadingIndicator } from "@/components/feedback/PageLoadingIndicator";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { Spinner } from "@/components/ui/gluestack/spinner";
import { Text } from "@/components/ui/text";
import { VisitRow } from "@/components/visits/VisitRow";
import { usePaginatedVisits } from "@/hooks/visits";
import type { VisitResponse } from "@/lib/types";
import { groupVisitsBySeason, type VisitSeasonSection } from "@/lib/visits";

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
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
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
          renderSectionHeader={({ section: { title, data } }) => (
            <Box
              className="bg-background pb-2 pt-4"
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text variant="large">{title}</Text>
              <Text variant="small">{data.length} visits</Text>
            </Box>
          )}
          stickySectionHeadersEnabled
          contentContainerClassName="grow pb-24 pt-1"
          contentContainerStyle={{ paddingHorizontal: 24 }}
          ListEmptyComponent={
            !error ? (
              <Box className="py-16">
                <Text variant="muted" className="text-center">
                  No visits yet. Tap the + button to log your first arena visit.
                </Text>
              </Box>
            ) : undefined
          }
          ListFooterComponent={
            loadingMore ? (
              <Box className="py-6">
                <Spinner />
              </Box>
            ) : undefined
          }
          ListHeaderComponent={
            error ? (
              <Text className="py-3 text-center text-sm text-destructive">
                {error}
              </Text>
            ) : undefined
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
