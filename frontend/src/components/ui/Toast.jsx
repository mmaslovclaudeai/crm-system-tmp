// src/components/ui/Toast.jsx
import { useEffect } from 'react';
import { TrendingUp, X, User } from 'lucide-react';
import { TOAST_TYPES } from '../../constants';

const Toast = ({ message, type, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const getToastStyles = () => {
    const baseStyles = "fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 transform transition-all duration-300";

    switch (type) {
      case TOAST_TYPES.SUCCESS:
        return `${baseStyles} bg-green-500 text-white`;
      case TOAST_TYPES.ERROR:
        return `${baseStyles} bg-red-500 text-white`;
      case TOAST_TYPES.INFO:
        return `${baseStyles} bg-blue-500 text-white`;
      default:
        return `${baseStyles} bg-gray-500 text-white`;
    }
  };

  const getIcon = () => {
    switch (type) {
      case TOAST_TYPES.SUCCESS:
        return <TrendingUp className="w-5 h-5" />;
      case TOAST_TYPES.ERROR:
        return <X className="w-5 h-5" />;
      case TOAST_TYPES.INFO:
        return <User className="w-5 h-5" />;
      default:
        return <User className="w-5 h-5" />;
    }
  };

  return (
    <div className={getToastStyles()}>
      {getIcon()}
      <span className="font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 hover:bg-white hover:bg-opacity-20 rounded p-1 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;