import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useToastStore } from '@/lib/toast-store';

export function ToastBanner() {
  const { visible, message, type, hide } = useToastStore();
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 9,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -80,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const isSuccess = type === 'success';
  const isError = type === 'error';

  const iconName = isSuccess
    ? 'checkmark-circle'
    : isError
    ? 'alert-circle'
    : 'information-circle';

  const iconColor = isSuccess
    ? '#16a34a'
    : isError
    ? '#dc2626'
    : '#2563eb';

  const bgColor = isSuccess
    ? '#f0fdf4'
    : isError
    ? '#fef2f2'
    : '#eff6ff';

  const borderColor = isSuccess
    ? '#bbf7d0'
    : isError
    ? '#fecaca'
    : '#bfdbfe';

  const textColor = isSuccess
    ? '#14532d'
    : isError
    ? '#7f1d1d'
    : '#1e3a8a';

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
      pointerEvents="box-none"
    >
      <Pressable
        style={[
          styles.toastCard,
          { backgroundColor: bgColor, borderColor },
        ]}
        onPress={hide}
      >
        <Ionicons name={iconName} size={20} color={iconColor} style={styles.toastIcon} />
        <Text style={[styles.toastText, { color: textColor }]} numberOfLines={2}>
          {message}
        </Text>
        <Pressable onPress={hide} hitSlop={8} style={styles.closeBtn}>
          <Ionicons name="close" size={16} color={iconColor} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 99999,
    alignItems: 'center',
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
    maxWidth: 500,
    width: '100%',
  },
  toastIcon: {
    marginRight: 10,
    flexShrink: 0,
  },
  toastText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  closeBtn: {
    padding: 2,
    marginLeft: 8,
  },
});
