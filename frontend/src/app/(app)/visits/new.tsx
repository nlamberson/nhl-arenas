import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { PRIMARY_BUTTON_SPINNER_COLOR } from '@/constants/theme';
import { DatePickerField } from '@/components/DatePickerField';
import { FormTextField } from '@/components/FormTextField';
import { PageLoadingIndicator } from '@/components/PageLoadingIndicator';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SelectField, type SelectFieldOption } from '@/components/SelectField';
import { useCreateVisit } from '@/hooks/visits';
import { useReferenceData } from '@/hooks/reference';
import { todayIsoDate } from '@/lib/date';
import { getErrorMessage } from '@/lib/errors';
import type { VisitCreate } from '@/lib/types';

type LogVisitForm = {
  home_team_id: string;
  away_team_id: string;
  visit_date: string;
  seating_location: string;
};

function toSelectOptions<T extends { id: string; name: string }>(
  items: T[],
  formatLabel?: (item: T) => string,
  getExtra?: (item: T) => Pick<SelectFieldOption, 'abbreviation'>,
): SelectFieldOption[] {
  return [...items]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((item) => ({
      value: item.id,
      label: formatLabel ? formatLabel(item) : item.name,
      ...getExtra?.(item),
    }));
}

export default function LogVisitScreen() {
  const { teams, loading: referenceLoading, error: referenceError } = useReferenceData();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createVisitMutation = useCreateVisit({
    onSuccess: (created) => router.replace(`/visits/${created.id}`),
  });

  const teamOptions = useMemo(
    () =>
      toSelectOptions(
        teams,
        (t) => {
          const place = t.city ? `${t.city} — ` : '';
          return `${place}${t.name} (${t.abbreviation})`;
        },
        (t) => ({ abbreviation: t.abbreviation }),
      ),
    [teams],
  );

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting: isFormSubmitting },
  } = useForm<LogVisitForm>({
    defaultValues: {
      home_team_id: '',
      away_team_id: '',
      visit_date: todayIsoDate(),
      seating_location: '',
    },
  });

  const homeTeamId = watch('home_team_id');
  const awayTeamId = watch('away_team_id');

  const teamsById = useMemo(() => {
    return new Map(teams.map((t) => [t.id, t]));
  }, [teams]);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);

    const homeTeam = teamsById.get(values.home_team_id);
    const arenaId = homeTeam?.arena_id;
    if (!arenaId) {
      const message = 'Selected home team has no arena on file';
      setSubmitError(message);
      Alert.alert('Could not log visit', message);
      return;
    }

    const payload: VisitCreate = {
      arena_id: arenaId,
      home_team_id: values.home_team_id,
      away_team_id: values.away_team_id,
      visit_date: values.visit_date.trim(),
      seating_location: values.seating_location.trim() || null,
    };

    try {
      await createVisitMutation.mutateAsync(payload);
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to log visit');
      setSubmitError(message);
      Alert.alert('Could not log visit', message);
    }
  });

  const isSubmitting = isFormSubmitting || createVisitMutation.isPending;
  const referenceReady = !referenceLoading && !referenceError;

  useEffect(() => {
    if (homeTeamId && awayTeamId === homeTeamId) {
      setValue('away_team_id', '', { shouldDirty: true, shouldValidate: true });
    }
  }, [homeTeamId, awayTeamId, setValue]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <ScreenHeader title="Log a visit" backAccessibilityLabel="Cancel" trailingSpacerWidth="md" />

      {referenceLoading ? (
        <PageLoadingIndicator
          message="Loading teams and arenas…"
          description="This may take a moment if the server is waking up."
        />
      ) : referenceError ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-destructive">{referenceError}</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerClassName="gap-5 px-4 py-6 pb-10"
            keyboardShouldPersistTaps="handled"
          >
            <Controller
              control={control}
              name="home_team_id"
              rules={{
                required: 'Home team is required',
                validate: (v, formValues) => {
                  if (v === formValues.away_team_id) {
                    return 'Home and away teams must be different';
                  }
                  if (!teamsById.get(v)?.arena_id) {
                    return 'This team has no home arena on file';
                  }
                  return true;
                },
              }}
              render={({ field: { value, onChange }, fieldState: { error } }) => (
                <SelectField
                  label="Home team"
                  nativeID="home-team"
                  value={value}
                  onChange={onChange}
                  options={teamOptions.filter((o) => o.value !== awayTeamId)}
                  placeholder="Select home team"
                  error={error?.message}
                  disabled={!referenceReady}
                />
              )}
            />

            <Controller
              control={control}
              name="away_team_id"
              rules={{
                required: 'Away team is required',
                validate: (v, formValues) =>
                  v !== formValues.home_team_id || 'Home and away teams must be different',
              }}
              render={({ field: { value, onChange }, fieldState: { error } }) => (
                <SelectField
                  label="Away team"
                  nativeID="away-team"
                  value={value}
                  onChange={onChange}
                  options={teamOptions.filter((o) => o.value !== homeTeamId)}
                  placeholder="Select away team"
                  error={error?.message}
                  disabled={!referenceReady}
                />
              )}
            />

            <Controller
              control={control}
              name="visit_date"
              rules={{ required: 'Date is required' }}
              render={({ field: { value, onChange }, fieldState: { error } }) => (
                <DatePickerField
                  label="Date"
                  nativeID="visit-date"
                  value={value}
                  onChange={onChange}
                  placeholder="Select date"
                  error={error?.message}
                  disabled={!referenceReady}
                />
              )}
            />

            <FormTextField
              control={control}
              name="seating_location"
              label="Seating (optional)"
              fieldId="seating"
              inputProps={{
                placeholder: 'Section 112, Row 5',
              }}
            />

            {submitError ? (
              <Text className="text-center text-sm text-destructive">{submitError}</Text>
            ) : null}

            <Button className="mt-2" onPress={onSubmit} disabled={isSubmitting || !referenceReady}>
              {isSubmitting ? (
                <ActivityIndicator color={PRIMARY_BUTTON_SPINNER_COLOR} />
              ) : (
                <Text>Save visit</Text>
              )}
            </Button>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}
