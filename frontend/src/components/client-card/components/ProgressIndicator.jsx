// src/components/client-card/components/ProgressIndicator.jsx
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const ProgressIndicator = ({
  current,
  total,
  label,
  showIcon = true,
  showFraction = true,
  size = "sm", // xs, sm, md, lg
  variant = "default", // default, success, warning, danger
  className = ""
}) => {
  // Вычисляем процент заполнения
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  const isComplete = current === total && total > 0;
  const isEmpty = current === 0;

  // Размеры компонента
  const sizes = {
    xs: {
      icon: "w-3 h-3",
      text: "text-xs",
      fraction: "text-xs"
    },
    sm: {
      icon: "w-4 h-4",
      text: "text-sm",
      fraction: "text-xs"
    },
    md: {
      icon: "w-5 h-5",
      text: "text-base",
      fraction: "text-sm"
    },
    lg: {
      icon: "w-6 h-6",
      text: "text-lg",
      fraction: "text-base"
    }
  };

  // Цветовые схемы
  const getVariantStyles = () => {
    if (variant !== "default") {
      // Принудительные цвета
      const variants = {
        success: {
          icon: "text-green-500",
          text: "text-green-600"
        },
        warning: {
          icon: "text-yellow-500",
          text: "text-yellow-600"
        },
        danger: {
          icon: "text-red-500",
          text: "text-red-600"
        }
      };
      return variants[variant];
    }

    // Автоматическое определение по заполненности
    if (isComplete) {
      return {
        icon: "text-green-500",
        text: "text-green-600"
      };
    } else if (isEmpty) {
      return {
        icon: "text-red-500",
        text: "text-red-600"
      };
    } else {
      return {
        icon: "text-yellow-500",
        text: "text-yellow-600"
      };
    }
  };

  // Получаем иконку
  const getIcon = () => {
    if (variant === "success" || isComplete) {
      return CheckCircle;
    } else if (variant === "danger" || isEmpty) {
      return XCircle;
    } else {
      return AlertCircle;
    }
  };

  const sizeStyles = sizes[size] || sizes.sm;
  const variantStyles = getVariantStyles();
  const IconComponent = getIcon();

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center space-x-2">
        {showIcon && (
          <IconComponent className={`${sizeStyles.icon} ${variantStyles.icon}`} />
        )}

        {label && (
          <span className={`${sizeStyles.text} text-gray-600`}>
            {label}
          </span>
        )}
      </div>

      <div className="flex items-center space-x-2">
        {showFraction && (
          <span className={`${sizeStyles.fraction} text-gray-500`}>
            {current}/{total}
          </span>
        )}

        {/* Процент заполнения - опционально */}
        <span className={`${sizeStyles.fraction} font-medium ${variantStyles.text}`}>
          {percentage}%
        </span>
      </div>
    </div>
  );
};

export default ProgressIndicator;