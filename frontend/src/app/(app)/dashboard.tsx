import { useCallback, useState } from "react";
import { Image, RefreshControl, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Box } from "@/components/ui/gluestack/box";
import { AddVisitButton } from "@/components/visits/AddVisitButton";
import { LatestVisitCard } from "@/components/visits/LatestVisitCard";
import { PageLoadingIndicator } from "@/components/feedback/PageLoadingIndicator";
import {
  Button,
  ButtonText,
} from "@/components/ui/gluestack/button";
import { Text } from "@/components/ui/gluestack/text";
import { useAuth } from "@/context/AuthContext";
import { useHomeVisits } from "@/hooks/visits";
import type { MeResponse } from "@/lib/types";

function getFirstName(displayName: string | null | undefined): string | null {
  const first = displayName?.trim().split(/\s+/)[0];
  return first || null;
}

function getDisplayName(user: MeResponse | null): string {
  if (!user) return "Fan";
  return getFirstName(user.display_name) || user.email || "Fan";
}

function getInitials(user: MeResponse | null): string {
  if (!user) return "?";
  const name = user.display_name?.trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (user.email) {
    return user.email.slice(0, 2).toUpperCase();
  }
  return "?";
}

function StatItem({ value, label }: { value: number | string; label: string }) {
  return (
    <Box className="flex-1 items-center gap-1">
      <Text className="text-2xl font-bold tabular-nums">{value}</Text>
      <Text size="xs" className="text-center text-typography-500">
        {label}
      </Text>
    </Box>
  );
}

function ProfileAvatar({ user }: { user: MeResponse | null }) {
  const initials = getInitials(user);
  const photoUrl = user?.photo_url?.trim();

  if (photoUrl) {
    return (
      <Image
        source={{ uri: photoUrl }}
        className="h-24 w-24 rounded-full bg-muted"
        accessibilityLabel="Profile photo"
      />
    );
  }

  return (
    <Box
      className="h-24 w-24 items-center justify-center rounded-full bg-primary"
      accessibilityLabel="Profile avatar placeholder"
    >
      <Text size="2xl" className="font-bold text-primary-foreground">
        {initials}
      </Text>
    </Box>
  );
}

export default function DashboardScreen() {
  const { user, refreshUser, logout } = useAuth();
  const { stats, latestVisit, loading, fetching, error, refetch } =
    useHomeVisits();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetch(), refreshUser()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetch, refreshUser]);

  const showInitialLoader = loading && !error;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <ScrollView
        contentContainerClassName="grow px-6 pb-28 pt-6"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Box className="items-center gap-3 pb-8">
          <ProfileAvatar user={user} />
          <Text size="2xl" className="text-center font-semibold">
            {"Welcome back, " + getDisplayName(user) + "!"}
          </Text>
        </Box>

        {showInitialLoader ? (
          <PageLoadingIndicator
            message="Loading your stats…"
            description="This may take a moment if the server is waking up."
          />
        ) : (
          <>
            {error ? (
              <Text className="mb-4 text-center text-sm text-destructive">
                {error}
              </Text>
            ) : null}

            <Box className="flex-row rounded-xl border border-border bg-card px-2 py-6">
              <StatItem value={stats?.teams_seen ?? 0} label="Teams seen" />
              <Box className="w-px self-stretch bg-border" />
              <StatItem
                value={stats?.arenas_visited ?? 0}
                label="Arenas visited"
              />
              <Box className="w-px self-stretch bg-border" />
              <StatItem value={stats?.total_visits ?? 0} label="Total visits" />
            </Box>

            <LatestVisitCard
              visit={latestVisit}
              loading={fetching && !latestVisit}
            />
          </>
        )}

        <Button
          variant="outline"
          action="primary"
          size="md"
          className="mt-10 w-full"
          onPress={() => logout()}
          accessibilityLabel="Sign out"
        >
          <ButtonText>Sign out</ButtonText>
        </Button>
      </ScrollView>

      <AddVisitButton />
    </SafeAreaView>
  );
}
