const CancelButton = ({
  onClick,
  text = 'Отменить',
  disabled = false
}) => {
  const handleClick = () => {
    if (disabled) return;
    onClick?.();
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`bg-white text-gray-500 border-2 border-gray-300 rounded-3xl transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-gray-200 focus:ring-opacity-50 ${
        disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'hover:border-gray-400 hover:text-gray-600 hover:bg-gray-50 active:transform active:translate-y-1'
      }`}
      style={{
        width: '176px',
        height: '48px',
        borderRadius: '12px',
        border: '2px solid #E5E7EB',
        fontSize: '16px',
        fontWeight: '400',
        fontFamily: '"Noto Sans Devanagari", sans-serif',
        color: '#838791'
      }}
    >
      {text}
    </button>
  );
};

export default CancelButton;