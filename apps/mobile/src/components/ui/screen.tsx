import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import type { ViewProps } from 'react-native';
import { View } from 'react-native';

type ScreenProps = ViewProps & {
  children: ReactNode;
  className?: string;
};

export function Screen({ children, className, ...props }: ScreenProps) {
  return (
    <View className={cn('flex-1 bg-app-background', className)} {...props}>
      {children}
    </View>
  );
}
