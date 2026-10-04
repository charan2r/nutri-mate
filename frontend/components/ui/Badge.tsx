import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type BadgeVariant = 'verified' | 'partially_verified' | 'unverified' | 'rejected' | 'diet' | 'info';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({
  label,
  variant = 'info',
  size = 'sm',
  className = '',
}: BadgeProps) {
  let bgStyle = 'bg-zinc-800 border-zinc-700';
  let textStyle = 'text-zinc-300';
  let iconName: any = null;
  let iconColor = '#A1A1AA';

  if (variant === 'verified') {
    bgStyle = 'bg-emerald-950/80 border-emerald-600/50';
    textStyle = 'text-emerald-400 font-semibold';
    iconName = 'checkmark-circle';
    iconColor = '#34D399';
  } else if (variant === 'partially_verified') {
    bgStyle = 'bg-amber-950/80 border-amber-600/50';
    textStyle = 'text-amber-400 font-semibold';
    iconName = 'alert-circle';
    iconColor = '#FBBF24';
  } else if (variant === 'unverified') {
    bgStyle = 'bg-zinc-900/90 border-zinc-700/60';
    textStyle = 'text-zinc-400';
    iconName = 'help-circle-outline';
    iconColor = '#9CA3AF';
  } else if (variant === 'rejected') {
    bgStyle = 'bg-rose-950/80 border-rose-600/50';
    textStyle = 'text-rose-400 font-semibold';
    iconName = 'close-circle';
    iconColor = '#F87171';
  } else if (variant === 'diet') {
    bgStyle = 'bg-teal-950/60 border-teal-700/40';
    textStyle = 'text-teal-300 font-medium';
    iconName = 'leaf-outline';
    iconColor = '#5EEAD4';
  }

  const padding = size === 'sm' ? 'px-2.5 py-1' : 'px-3 py-1.5';
  const fontSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <View
      className={`flex-row items-center gap-1.5 rounded-full border self-start ${padding} ${bgStyle} ${className}`}
    >
      {iconName && <Ionicons name={iconName} size={size === 'sm' ? 12 : 14} color={iconColor} />}
      <Text className={`${fontSize} ${textStyle}`}>{label}</Text>
    </View>
  );
}

export default Badge;
