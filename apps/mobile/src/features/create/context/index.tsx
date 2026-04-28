import { useCreateDrawer } from '@/features/create/hooks/use-create-drawer';
import { useCreateForm } from '@/features/create/hooks/use-create-form';
import { useCreateMode } from '@/features/create/hooks/use-create-mode';
import { createContext, useContext, type ReactNode } from 'react';

type CreateContextValue = ReturnType<typeof useCreateMode> &
  ReturnType<typeof useCreateDrawer> &
  ReturnType<typeof useCreateForm>;

const CreateContext = createContext<CreateContextValue | null>(null);

export default function CreateProvider({ children }: { children: ReactNode }) {
  const mode = useCreateMode();
  const drawer = useCreateDrawer();
  const form = useCreateForm(mode.selectedMode);

  return (
    <CreateContext.Provider value={{ ...mode, ...drawer, ...form }}>
      {children}
    </CreateContext.Provider>
  );
}

export function useCreateContext() {
  const ctx = useContext(CreateContext);
  if (!ctx) throw new Error('useCreateContext must be used within CreateProvider');
  return ctx;
}
