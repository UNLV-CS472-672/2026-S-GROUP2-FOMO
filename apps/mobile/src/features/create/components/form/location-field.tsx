import type { GeocodingResult } from '@/components/autofill/mapbox_autofill';
import { Icon } from '@/components/icon';
import type { CreateFormValues, EventLocationValue } from '@/features/create/types';
import { useLocationSearch } from '@/features/map/hooks/use-location-search';
import { useMemo, useState } from 'react';
import { useController, type Control, type UseFormSetValue } from 'react-hook-form';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

type LocationFieldProps = {
  control: Control<CreateFormValues>;
  setValue: UseFormSetValue<CreateFormValues>;
  formActive: boolean;
  getCurrentLocation: () => Promise<{ latitude: number; longitude: number } | null>;
};

export function LocationField({
  control,
  setValue,
  formActive,
  getCurrentLocation,
}: LocationFieldProps) {
  const [search, setSearch] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isUsingCurrentLocation, setIsUsingCurrentLocation] = useState(false);
  const [resolvingPlaceId, setResolvingPlaceId] = useState<string | null>(null);

  const { field, fieldState } = useController({
    control,
    name: 'event.location',
    disabled: !formActive,
    rules: {
      validate: (value) => {
        if (value?.kind === 'current') return true;
        if (
          value?.kind === 'place' &&
          typeof value.latitude === 'number' &&
          typeof value.longitude === 'number'
        ) {
          return true;
        }
        return 'Pick a place or use your current location.';
      },
    },
  });

  const { results, isLoading, resolveCoordinates } = useLocationSearch(search);
  const selectedLocation = field.value as EventLocationValue | undefined;

  const filteredResults = useMemo(() => {
    if (selectedLocation?.kind || !isFocused) return [];
    return results.slice(0, 5);
  }, [isFocused, results, selectedLocation?.kind]);

  const applyLocation = (value: EventLocationValue) => {
    field.onChange(value);
    setValue('event.location', value, { shouldDirty: true, shouldValidate: true });
  };

  const clearLocation = () => {
    setSearch('');
    setIsFocused(false);
    applyLocation({ label: '' });
  };

  const selectCurrentLocation = async () => {
    if (field.disabled || isUsingCurrentLocation) return;
    setIsUsingCurrentLocation(true);
    try {
      const coords = await getCurrentLocation();
      if (!coords) {
        applyLocation({ label: '' });
        return;
      }
      setSearch('');
      setIsFocused(false);
      applyLocation({
        kind: 'current',
        label: 'Current location',
        address: 'Uses your current device location',
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
    } finally {
      setIsUsingCurrentLocation(false);
    }
  };

  const selectPlace = async (place: GeocodingResult) => {
    if (field.disabled || resolvingPlaceId) return;
    setResolvingPlaceId(place.mapbox_id);
    try {
      const coords = await resolveCoordinates(place.mapbox_id);
      if (!coords) return;
      setSearch('');
      setIsFocused(false);
      applyLocation({
        kind: 'place',
        label: place.name,
        address: place.full_address,
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
    } finally {
      setResolvingPlaceId(null);
    }
  };

  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <Text className="text-[13px] font-semibold tracking-wide text-muted-foreground">
          LOCATION
        </Text>
        <Pressable
          onPress={selectCurrentLocation}
          disabled={field.disabled || isUsingCurrentLocation}
          className="flex-row items-center gap-1"
          accessibilityRole="button"
          accessibilityLabel="Use current location"
        >
          {isUsingCurrentLocation ? (
            <ActivityIndicator size="small" color="#8B8B8B" />
          ) : (
            <Icon name="my-location" size={15} className="text-muted-foreground" />
          )}
          <Text className="text-[13px] font-semibold text-muted-foreground">
            Use current location
          </Text>
        </Pressable>
      </View>

      <View
        className={`overflow-hidden rounded-2xl border bg-surface shadow-md ${fieldState.error ? 'border-destructive' : 'border-muted'}`}
      >
        {selectedLocation?.kind ? (
          <View className="flex-row items-center gap-3 px-4 py-3">
            <View className="size-10 items-center justify-center rounded-full bg-primary/10">
              <Icon
                name={selectedLocation.kind === 'current' ? 'my-location' : 'place'}
                size={18}
                className="text-primary"
              />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-medium text-foreground" numberOfLines={1}>
                {selectedLocation.label}
              </Text>
              {selectedLocation.address ? (
                <Text className="mt-0.5 text-[12px] text-muted-foreground" numberOfLines={1}>
                  {selectedLocation.address}
                </Text>
              ) : null}
            </View>
            <Pressable
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Remove location"
              onPress={clearLocation}
            >
              <Icon name="close" size={18} className="text-muted-foreground" />
            </Pressable>
          </View>
        ) : (
          <View className="flex-row items-center gap-2 px-4 py-3">
            <Icon name="search" size={18} className="text-muted-foreground" />
            <TextInput
              placeholder="Search places..."
              value={search}
              editable={!field.disabled}
              onChangeText={setSearch}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="flex-1 text-[15px] text-foreground"
              placeholderTextColor="#8B8B8B"
              returnKeyType="search"
            />
            {search.length > 0 ? (
              <Pressable hitSlop={8} onPress={() => setSearch('')}>
                <Icon name="close" size={18} className="text-muted-foreground" />
              </Pressable>
            ) : null}
          </View>
        )}

        {filteredResults.length > 0 ? (
          <ScrollView
            style={{ maxHeight: 240 }}
            keyboardShouldPersistTaps="handled"
            className="border-t border-muted"
          >
            {filteredResults.map((place, index) => {
              const isResolving = resolvingPlaceId === place.mapbox_id;
              return (
                <Pressable
                  key={place.mapbox_id}
                  onPress={() => void selectPlace(place)}
                  disabled={!!resolvingPlaceId}
                  className={`flex-row items-center gap-3 px-4 py-3 ${index < filteredResults.length - 1 ? 'border-b border-muted' : ''}`}
                >
                  <View className="size-10 items-center justify-center rounded-full bg-primary/10">
                    {isResolving ? (
                      <ActivityIndicator size="small" color="#8B8B8B" />
                    ) : (
                      <Icon name="place" size={18} className="text-primary" />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-[15px] font-medium text-foreground" numberOfLines={1}>
                      {place.name}
                    </Text>
                    <Text className="mt-0.5 text-[12px] text-muted-foreground" numberOfLines={1}>
                      {place.full_address}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : !selectedLocation?.kind && isFocused && search.trim().length > 0 ? (
          <View className="border-t border-muted px-4 py-3">
            <Text className="text-[13px] text-muted-foreground">
              {isLoading ? 'Searching places...' : 'No places found.'}
            </Text>
          </View>
        ) : null}
      </View>

      {fieldState.error?.message ? (
        <Text className="text-[13px] text-destructive" accessibilityRole="alert">
          {fieldState.error.message}
        </Text>
      ) : null}
    </View>
  );
}
