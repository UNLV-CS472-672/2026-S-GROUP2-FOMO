import { Button, ButtonText } from '@/components/ui/button';
import { DrawerModal } from '@/components/ui/drawer';
import { useAppTheme } from '@/lib/use-app-theme';
import {
  BottomSheetFooter,
  type BottomSheetFooterProps,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DELETE_ACCOUNT_CONFIRMATION = 'Delete account';

type DeleteAccountDrawerProps = {
  open: boolean;
  isDeletingAccount: boolean;
  onClose: () => void;
  onDeleteAccount: () => void;
};

export function DeleteAccountDrawer({
  open,
  isDeletingAccount,
  onClose,
  onDeleteAccount,
}: DeleteAccountDrawerProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  useEffect(() => {
    if (!open && deleteConfirmation) {
      setDeleteConfirmation('');
    }
  }, [deleteConfirmation, open]);

  const canDeleteAccount = deleteConfirmation.trim() === DELETE_ACCOUNT_CONFIRMATION;

  function handleClose() {
    setDeleteConfirmation('');
    onClose();
  }

  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) => (
      <BottomSheetFooter {...props}>
        <View className="gap-3 border-t border-border bg-surface px-6 py-3">
          <Button
            variant="destructive"
            disabled={!canDeleteAccount || isDeletingAccount}
            onPress={onDeleteAccount}
          >
            <ButtonText variant="destructive">
              {isDeletingAccount ? 'Deleting account...' : 'Delete account permanently'}
            </ButtonText>
          </Button>

          <Button variant="secondary" disabled={isDeletingAccount} onPress={handleClose}>
            <ButtonText variant="secondary">Cancel</ButtonText>
          </Button>
        </View>
      </BottomSheetFooter>
    ),
    [canDeleteAccount, handleClose, insets.bottom, isDeletingAccount, onDeleteAccount]
  );

  return (
    <DrawerModal
      open={open}
      onClose={() => {
        if (isDeletingAccount) return;
        handleClose();
      }}
      snapPoints={['40%']}
      enablePanDownToClose={!isDeletingAccount}
      backdropAppearsOnIndex={0}
      backdropDisappearsOnIndex={-1}
      keyboardBehavior="interactive"
      footerComponent={renderFooter}
    >
      <BottomSheetScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 8,
          gap: 20,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View>
          <Text className="text-[17px] font-bold text-foreground">Delete account</Text>
          <Text className="mt-2 text-sm leading-6 text-muted-foreground">
            This permanently deletes your Fomo account. Your posts and comments will remain visible
            as <Text className="font-semibold text-foreground">Deleted account</Text>. To confirm,
            type{' '}
            <Text className="font-semibold text-foreground">{DELETE_ACCOUNT_CONFIRMATION}</Text>{' '}
            below.
          </Text>
        </View>

        <View>
          <Text className="text-sm font-semibold text-foreground">Confirmation</Text>
          <View className="mt-2 rounded-xl border border-muted-foreground/30 bg-background px-4">
            <BottomSheetTextInput
              value={deleteConfirmation}
              onChangeText={setDeleteConfirmation}
              placeholder={DELETE_ACCOUNT_CONFIRMATION}
              placeholderTextColor={theme.mutedText}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isDeletingAccount}
              className="py-3 text-base text-foreground"
            />
          </View>
        </View>
      </BottomSheetScrollView>
    </DrawerModal>
  );
}
