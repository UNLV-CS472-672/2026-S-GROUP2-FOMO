import { openDirections } from '@/features/map/utils/directions';
import { useAppTheme } from '@/lib/use-app-theme';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';

type NavigateButtonProps = {
  latitude: number;
  longitude: number;
  label: string;
};

export function NavigateButton({ latitude, longitude, label }: NavigateButtonProps) {
  const theme = useAppTheme();

  return (
    <TouchableOpacity
      className="h-12 w-12 items-center justify-center rounded-full border border-border bg-background"
      activeOpacity={0.75}
      onPress={() => void openDirections(latitude, longitude, label)}
      accessibilityRole="button"
      accessibilityLabel="Get directions"
    >
      <Ionicons name="navigate" size={24} color={theme.mutedText} />
    </TouchableOpacity>
  );
}
