import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  Text,
  View,
} from 'react-native';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  title?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  textClassName?: string;
  children?: React.ReactNode;
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  textClassName = '',
  disabled,
  children,
  ...props
}: ButtonProps) {
  let variantStyle = 'bg-emerald-600 active:bg-emerald-700 border-transparent';
  let textStyle = 'text-white font-semibold';

  if (variant === 'secondary') {
    variantStyle = 'bg-zinc-800 active:bg-zinc-700 border border-zinc-700';
    textStyle = 'text-zinc-100 font-medium';
  } else if (variant === 'outline') {
    variantStyle = 'bg-transparent border border-emerald-600 active:bg-emerald-950/30';
    textStyle = 'text-emerald-400 font-semibold';
  } else if (variant === 'ghost') {
    variantStyle = 'bg-transparent active:bg-zinc-800/60';
    textStyle = 'text-zinc-300 font-medium';
  } else if (variant === 'danger') {
    variantStyle = 'bg-rose-600 active:bg-rose-700 border-transparent';
    textStyle = 'text-white font-semibold';
  }

  let sizeStyle = 'py-3.5 px-5 rounded-2xl';
  let textSizeStyle = 'text-base';

  if (size === 'sm') {
    sizeStyle = 'py-2 px-3.5 rounded-xl';
    textSizeStyle = 'text-sm';
  } else if (size === 'lg') {
    sizeStyle = 'py-4 px-6 rounded-2xl';
    textSizeStyle = 'text-lg';
  }

  const isDisabled = disabled || isLoading;

  return (
    <Pressable
      className={`flex-row items-center justify-center ${variantStyle} ${sizeStyle} ${
        isDisabled ? 'opacity-50' : 'opacity-100'
      } ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' ? '#10B981' : '#FFFFFF'}
        />
      ) : (
        <View className="flex-row items-center justify-center gap-2">
          {leftIcon && <View>{leftIcon}</View>}
          {title ? (
            <Text className={`${textStyle} ${textSizeStyle} ${textClassName}`}>
              {title}
            </Text>
          ) : (
            children
          )}
          {rightIcon && <View>{rightIcon}</View>}
        </View>
      )}
    </Pressable>
  );
}

export default Button;
