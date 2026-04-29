import { Screen } from '@/components/ui/screen';
import { InterestsPicker } from '@/features/profile/components/interests-picker';
import { ScrollView } from 'react-native';

export default function InterestsOnboardingScreen() {
  return (
    <Screen>
      <ScrollView
        className="flex-1"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="grow"
        keyboardShouldPersistTaps="handled"
      >
        <InterestsPicker
          variant="page"
          eyebrow="Almost there"
          title="Pick your interests"
          subtitle="Choose the topics you want fomo to learn from. You can always update these later."
          saveLabel="Continue"
          savingLabel="Saving..."
        />
      </ScrollView>
    </Screen>
  );
}
