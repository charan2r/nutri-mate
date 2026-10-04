import React, { useState } from 'react';
import {
  Pressable,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  isPassword?: boolean;
  containerClassName?: string;
}

export function Input({
  label,
  error,
  leftIcon,
  isPassword = false,
  containerClassName = '',
  className = '',
  secureTextEntry,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isSecure = isPassword ? !showPassword : secureTextEntry;

  return (
    <View className={`w-full gap-1.5 ${containerClassName}`}>
      {label && (
        <Text className="text-sm font-semibold text-zinc-700 ml-0.5">{label}</Text>
      )}

      <View
        className={`flex-row items-center bg-zinc-50 border rounded-2xl px-4 py-3.5 ${
          error
            ? 'border-rose-400 bg-rose-50/50'
            : isFocused
            ? 'border-emerald-600 bg-white'
            : 'border-zinc-200'
        }`}
      >
        {leftIcon && <View className="mr-3">{leftIcon}</View>}

        <TextInput
          className={`flex-1 text-base text-zinc-900 placeholder:text-zinc-400 p-0 ${className}`}
          placeholderTextColor="#9CA3AF"
          secureTextEntry={isSecure}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />

        {isPassword && (
          <Pressable
            hitSlop={8}
            onPress={() => setShowPassword((prev) => !prev)}
            className="ml-2"
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#6B7280"
            />
          </Pressable>
        )}
      </View>

      {error && (
        <Text className="text-xs text-rose-500 font-medium ml-1">{error}</Text>
      )}
    </View>
  );
}

export default Input;
