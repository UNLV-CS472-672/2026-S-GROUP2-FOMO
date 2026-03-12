import { cn } from '@/lib/utils';
import { Pressable, PressableProps, Text, TextProps } from 'react-native';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = PressableProps & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

type ButtonTextProps = TextProps & {
  variant?: ButtonVariant;
  className?: string;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-app-tint',
  secondary: 'border border-app-icon/30 bg-app-background',
  ghost: 'bg-transparent',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'rounded-lg px-3 py-2',
  md: 'rounded-xl px-4 py-3',
  lg: 'rounded-xl px-4 py-4',
};

const textVariantClasses: Record<ButtonVariant, string> = {
  primary: 'text-app-background',
  secondary: 'text-app-text',
  ghost: 'text-app-text',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <Pressable
      className={cn(
        'items-center justify-center rounded-3xl',
        variantClasses[variant],
        sizeClasses[size],
        disabled && 'opacity-50',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </Pressable>
  );
}

export function ButtonText({ variant = 'primary', className, ...props }: ButtonTextProps) {
  return (
    <Text className={cn('font-semibold', textVariantClasses[variant], className)} {...props} />
  );
}
