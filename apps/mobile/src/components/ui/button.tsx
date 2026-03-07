import { ReactNode } from 'react';
import { Pressable, PressableProps, Text, TextProps } from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'icon';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = PressableProps & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
};

type ButtonTextProps = TextProps & {
  variant?: ButtonVariant;
  className?: string;
};

const joinClassNames = (...classNames: (string | false | null | undefined)[]) =>
  classNames.filter(Boolean).join(' ');

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-app-tint',
  secondary: 'border border-app-icon/30 bg-app-background',
  ghost: 'bg-transparent',
  icon: 'bg-transparent',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'rounded-lg px-3 py-2',
  md: 'rounded-xl px-4 py-3',
  lg: 'rounded-xl px-4 py-4',
};

const iconSizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 w-9 rounded-lg',
  md: 'h-10 w-10 rounded-xl',
  lg: 'h-12 w-12 rounded-xl',
};

const textVariantClasses: Record<ButtonVariant, string> = {
  primary: 'text-app-background',
  secondary: 'text-app-text',
  ghost: 'text-app-tint',
  icon: '',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  children,
  accessibilityRole = 'button',
  hitSlop,
  ...props
}: ButtonProps) {
  const isIcon = variant === 'icon';

  return (
    <Pressable
      className={joinClassNames(
        'items-center justify-center',
        variantClasses[variant],
        isIcon ? iconSizeClasses[size] : sizeClasses[size],
        disabled && 'opacity-50',
        className
      )}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      hitSlop={hitSlop ?? (isIcon ? 8 : undefined)}
      {...props}
    >
      {children}
    </Pressable>
  );
}

export function ButtonText({ variant = 'primary', className, ...props }: ButtonTextProps) {
  if (variant === 'icon') return null;

  return (
    <Text
      className={joinClassNames('font-semibold', textVariantClasses[variant], className)}
      {...props}
    />
  );
}
