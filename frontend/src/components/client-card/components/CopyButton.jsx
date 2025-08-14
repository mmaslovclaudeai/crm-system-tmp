// src/components/client-card/components/CopyButton.jsx
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

const CopyButton = ({
  text,
  fieldName,
  className = "p-1 text-gray-400 hover:text-gray-600 transition-colors",
  title = "Копировать",
  size = 4, // размер иконки
  showAnimation = true, // показывать анимацию успеха
  animationDuration = 2000 // длительность анимации в мс
}) => {
  const [copiedField, setCopiedField] = useState(null);

  // Если нет текста для копирования, не показываем кнопку
  if (!text) return null;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(text);

      if (showAnimation) {
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), animationDuration);
      }
    } catch (err) {
      console.error('Не удалось скопировать:', err);
    }
  };

  const iconClass = `w-${size} h-${size}`;
  const isShowingSuccess = showAnimation && copiedField === fieldName;

  return (
    <button
      onClick={copyToClipboard}
      className={className}
      title={isShowingSuccess ? "Скопировано!" : title}
    >
      {isShowingSuccess ? (
        <Check className={`${iconClass} text-green-500`} />
      ) : (
        <Copy className={iconClass} />
      )}
    </button>
  );
};

export default CopyButton;