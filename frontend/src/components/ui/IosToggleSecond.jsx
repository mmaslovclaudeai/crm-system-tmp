const IosToggleSecond = ({
  value = false,
  onChange,
  disabled = false
}) => {
  const handleToggle = () => {
    if (disabled) return;
    onChange?.(!value);
  };

  return (
    <div className="flex items-center gap-16">
      <label className={`relative inline-block cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <input
          type="checkbox"
          checked={value}
          onChange={handleToggle}
          disabled={disabled}
          className="opacity-0 w-0 h-0"
        />
        <span
          className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 transition-colors duration-400 ${
            value ? 'bg-blue-600' : 'bg-gray-300'
          }`}
          style={{
            width: '51px',
            height: '31px',
            borderRadius: '34px'
          }}
        >
          <span
            className={`absolute bg-white transition-transform duration-400 shadow-md ${
              value ? 'transform translate-x-5' : ''
            }`}
            style={{
              height: '27px',
              width: '27px',
              left: '2px',
              bottom: '2px',
              borderRadius: '50%',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
            }}
          />
        </span>
      </label>

      <span
        className="text-lg font-medium mt-1"
        style={{
          fontFamily: '"Noto Sans Devanagari", sans-serif',
          fontSize: '16px',
          fontWeight: '500',
          color: '#374151'
        }}
      >
        Зарплата
      </span>
    </div>
  );
};

export default IosToggleSecond;