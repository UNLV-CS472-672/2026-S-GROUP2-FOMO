'use client';

import { useLocationSearch, type GeocodingResult } from '@/features/map/hooks/use-location-search';
import { coordsToH3Cell } from '@/features/map/utils/h3';
import { api } from '@fomo/backend/convex/_generated/api';
import type { Id } from '@fomo/backend/convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type FormEvent } from 'react';

import type { SelectedEventLocation } from '../types';
import { getDefaultEndDate, getDefaultStartDate } from '../utils/datetime';
import { roundGeographicCoordinate } from '../utils/location';

export function useCreateEventForm() {
  const router = useRouter();
  const queriedTags = useQuery(api.tags.getAllTags);
  const allTags = useMemo(() => queriedTags ?? [], [queriedTags]);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const createEvent = useMutation(api.events.mutations.createEvent);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(getDefaultStartDate);
  const [endDate, setEndDate] = useState(getDefaultEndDate);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<SelectedEventLocation | null>(null);
  const [resolvingPlaceId, setResolvingPlaceId] = useState<string | null>(null);
  const [usingCurrentLocation, setUsingCurrentLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { resolveCoordinates } = useLocationSearch('');

  useEffect(() => {
    if (!coverFile) {
      setCoverPreviewUrl('');
      return;
    }

    const nextUrl = URL.createObjectURL(coverFile);
    setCoverPreviewUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [coverFile]);

  const toggleTag = (tagName: string) => {
    setSelectedTags((current) =>
      current.includes(tagName) ? current.filter((name) => name !== tagName) : [...current, tagName]
    );
  };

  const clearCover = () => {
    setCoverFile(null);
  };

  const clearLocation = () => {
    setSelectedLocation(null);
  };

  const selectCurrentLocation = () => {
    if (usingCurrentLocation) return;
    setUsingCurrentLocation(true);
    setErrorMessage('');

    if (!navigator.geolocation) {
      setErrorMessage('Location is unavailable in this browser.');
      setUsingCurrentLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setSelectedLocation({
          kind: 'current',
          label: 'Current location',
          address: 'Uses your current device location',
          latitude: roundGeographicCoordinate(coords.latitude),
          longitude: roundGeographicCoordinate(coords.longitude),
        });
        setUsingCurrentLocation(false);
      },
      () => {
        setErrorMessage('Allow location access to use your current location, or choose a place.');
        setUsingCurrentLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  const selectPlace = async (place: GeocodingResult) => {
    if (resolvingPlaceId) return;
    setResolvingPlaceId(place.mapbox_id);
    setErrorMessage('');

    try {
      const coords = await resolveCoordinates(place.mapbox_id);
      if (!coords) {
        setErrorMessage('Could not resolve that place. Try another result.');
        return;
      }

      setSelectedLocation({
        kind: 'place',
        label: place.name,
        address: place.full_address,
        latitude: roundGeographicCoordinate(coords.latitude),
        longitude: roundGeographicCoordinate(coords.longitude),
      });
    } finally {
      setResolvingPlaceId(null);
    }
  };

  const uploadCover = async () => {
    if (!coverFile) return undefined;

    const uploadUrl = await generateUploadUrl();
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': coverFile.type || 'image/jpeg' },
      body: coverFile,
    });

    if (!uploadResponse.ok) {
      throw new Error('Could not upload the cover image.');
    }

    const { storageId } = (await uploadResponse.json()) as { storageId: Id<'_storage'> };
    return storageId;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setErrorMessage('');

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const startMs = new Date(startDate).getTime();
    const endMs = new Date(endDate).getTime();

    if (!coverFile) {
      setErrorMessage('Add a cover image for the event.');
      return;
    }

    if (!trimmedName) {
      setErrorMessage('Event name is required.');
      return;
    }

    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
      setErrorMessage('Choose an end time after the start time.');
      return;
    }

    if (!selectedLocation) {
      setErrorMessage('Pick a place or use your current location.');
      return;
    }

    setSubmitting(true);
    try {
      const mediaId = await uploadCover();
      const tagIds = selectedTags.flatMap((tagName) => {
        const tag = allTags.find((candidate) => candidate.name === tagName);
        return tag ? [tag.id as Id<'tags'>] : [];
      });

      const latitude = roundGeographicCoordinate(selectedLocation.latitude);
      const longitude = roundGeographicCoordinate(selectedLocation.longitude);
      const eventId = await createEvent({
        name: trimmedName,
        caption: trimmedDescription,
        startDate: startMs,
        endDate: endMs,
        location: {
          latitude,
          longitude,
          h3Index: coordsToH3Cell(longitude, latitude),
        },
        mediaId,
        tagIds,
      });

      router.push('/map');
      router.refresh();
      console.info('Created event', eventId);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return {
    allTags,
    clearCover,
    clearLocation,
    coverFile,
    coverPreviewUrl,
    description,
    endDate,
    errorMessage,
    handleSubmit,
    name,
    resolvingPlaceId,
    selectCurrentLocation,
    selectPlace,
    selectedLocation,
    selectedTags,
    setCoverFile,
    setDescription,
    setEndDate,
    setName,
    setStartDate,
    startDate,
    submitting,
    toggleTag,
    usingCurrentLocation,
  };
}
