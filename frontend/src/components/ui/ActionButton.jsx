const ActionButton = ({
  state = 'inactive', // 'active', 'inactive', 'loading', 'error', 'success'
  onClick,
  text = 'Добавить',
  loadingText = 'Загрузка...',
  successText = 'Успешно!',
  errorText = 'Повторить',
  disabled = false
}) => {
  const handleClick = () => {
    if (disabled || state === 'inactive' || state === 'loading') return;
    onClick?.();
  };

  const getButtonClass = () => {
    switch (state) {
      case 'active':
        return 'bg-orange-400 text-white shadow-orange-200 hover:bg-orange-500 hover:shadow-orange-300 hover:transform hover:-translate-y-1 active:translate-y-0';
      case 'error':
        return 'bg-red-600 text-white shadow-red-200 hover:bg-red-700 hover:shadow-red-300 hover:transform hover:-translate-y-1 active:translate-y-0';
      case 'success':
        return 'bg-green-600 text-white shadow-green-200 hover:bg-green-700 hover:shadow-green-300 hover:transform hover:-translate-y-1 active:translate-y-0';
      case 'loading':
        return 'bg-gray-400 text-white cursor-wait';
      default: // inactive
        return 'bg-gray-300 text-gray-500 cursor-not-allowed';
    }
  };

  const getButtonText = () => {
    switch (state) {
      case 'loading':
        return loadingText;
      case 'success':
        return successText;
      case 'error':
        return errorText;
      default:
        return text;
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || state === 'inactive' || state === 'loading'}
      className={`${getButtonClass()} rounded-3xl transition-all duration-300 flex items-center justify-center shadow-lg focus:outline-none focus:ring-4 focus:ring-opacity-50`}
      style={{
        width: '176px',
        height: '48px',
        borderRadius: '12px',
        fontSize: '16px',
        fontWeight: '500',
        fontFamily: '"Noto Sans Devanagari", sans-serif'
      }}
    >
      {state === 'loading' && (
        <svg
          className="animate-spin -ml-1 mr-3 h-8 w-8 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {getButtonText()}
    </button>
  );
};

export default ActionButton;