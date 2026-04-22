import { openDirections } from '@/features/map/utils/directions';
import { useAppTheme } from '@/lib/use-app-theme';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';

type NavigateButtonProps = {
  latitude: number;
  longitude: number;
  label: string;
};

export function NavigateButton({ latitude, longitude, label }: NavigateButtonProps) {
  const theme = useAppTheme();

  return (
    <Pressable
      className="h-12 w-12 items-center justify-center rounded-2xl"
      onPress={() => void openDirections(latitude, longitude, label)}
      accessibilityRole="button"
      accessibilityLabel="Get directions"
      style={{
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: theme.tint,
      }}
    >
      <Ionicons name="navigate" size={22} color={theme.tint} />
    </Pressable>
  );
}
