// src/hooks/useToast.js
import { useState } from 'react';
import { TOAST_TYPES } from '../constants';

export const useToast = () => {
  const [toast, setToast] = useState({
    isVisible: false,
    message: '',
    type: TOAST_TYPES.INFO
  });

  const showToast = (message, type = TOAST_TYPES.INFO) => {
    setToast({
      isVisible: true,
      message,
      type
    });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  const showSuccess = (message) => showToast(message, TOAST_TYPES.SUCCESS);
  const showError = (message) => showToast(message, TOAST_TYPES.ERROR);
  const showInfo = (message) => showToast(message, TOAST_TYPES.INFO);

  return {
    toast,
    showToast,
    hideToast,
    showSuccess,
    showError,
    showInfo
  };
};