import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
  show: (message: string, type?: ToastType, duration?: number) => void;
  hide: () => void;
}

let timeoutId: any = null;

export const useToastStore = create<ToastState>((set) => ({
  visible: false,
  message: '',
  type: 'success',
  show: (message: string, type: ToastType = 'success', duration: number = 3000) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    set({ visible: true, message, type });

    timeoutId = setTimeout(() => {
      set({ visible: false });
      timeoutId = null;
    }, duration);
  },
  hide: () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    set({ visible: false });
  },
}));

export const showToast = (
  message: string,
  type: ToastType = 'success',
  duration: number = 3000,
) => {
  useToastStore.getState().show(message, type, duration);
};
