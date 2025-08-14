// src/components/charts/CashDeskChart.jsx - ФИНАЛЬНАЯ УЛУЧШЕННАЯ ВЕРСИЯ
import { useState, useEffect, useRef } from 'react';
import { useCashDesks } from '../../hooks/useCashDesks';
import ChartPeriodSelector from './ChartPeriodSelector';
import ChartStats from './ChartStats';
import { BarChart3 } from 'lucide-react';

const CashDeskChart = ({ cashDeskId, cashDeskName }) => {
  const [chartData, setChartData] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const canvasRef = useRef(null);

  const { fetchCashDeskBalanceHistory } = useCashDesks();

  // Загрузка данных графика
  const loadChartData = async (period = selectedPeriod) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchCashDeskBalanceHistory(cashDeskId, { period });

      if (response?.balance_history && response?.statistics) {
        const formattedData = response.balance_history.map(day => ({
          date: day.date,
          balance: day.balance,
          dailyChange: day.daily_change,
          transactionsCount: day.transactions_count,
          displayDate: new Date(day.date).toLocaleDateString('ru-RU', {
            month: 'short',
            day: 'numeric'
          })
        }));

        setChartData(formattedData);
        setStatistics(response.statistics);
      } else {
        throw new Error('Неверный формат данных');
      }
    } catch (err) {
      console.error('Ошибка загрузки данных графика:', err);
      setError(err.message || 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  // Загружаем данные при монтировании и изменении периода
  useEffect(() => {
    if (cashDeskId) {
      loadChartData(selectedPeriod);
    }
  }, [cashDeskId, selectedPeriod]);

  // Рисуем график
  useEffect(() => {
    if (chartData.length > 0 && canvasRef.current) {
      drawChart();
    }
  }, [chartData, hoveredPoint]);

  // Обработка смены периода
  const handlePeriodChange = (newPeriod) => {
    setSelectedPeriod(newPeriod);
  };

  // Определяем цвет линии графика в зависимости от тренда
  const getLineColor = () => {
    if (!statistics) return '#007aff';

    switch (statistics.trend) {
      case 'growing': return '#30d158';
      case 'declining': return '#ff3b30';
      default: return '#007aff';
    }
  };

  // Функция рисования графика
  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    // Устанавливаем размеры с учетом device pixel ratio для четкости
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Очищаем canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartWidth = rect.width - padding.left - padding.right;
    const chartHeight = rect.height - padding.top - padding.bottom;

    if (chartData.length === 0) return;

    // Находим минимум и максимум
    const values = chartData.map(d => d.balance);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue || 1;

    // Функции для преобразования координат
    const getX = (index) => padding.left + (index / (chartData.length - 1)) * chartWidth;
    const getY = (value) => padding.top + ((maxValue - value) / valueRange) * chartHeight;

    // Рисуем сетку
    ctx.strokeStyle = '#f2f2f7';
    ctx.lineWidth = 1;
    ctx.beginPath();

    // Горизонтальные линии сетки
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (i / 5) * chartHeight;
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartWidth, y);
    }
    ctx.stroke();

    // Рисуем градиентную область под графиком
    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
    const lineColor = getLineColor();
    gradient.addColorStop(0, lineColor + '33'); // 20% прозрачность
    gradient.addColorStop(1, lineColor + '05'); // 2% прозрачность

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(getX(0), getY(chartData[0].balance));

    chartData.forEach((point, index) => {
      ctx.lineTo(getX(index), getY(point.balance));
    });

    ctx.lineTo(getX(chartData.length - 1), padding.top + chartHeight);
    ctx.lineTo(getX(0), padding.top + chartHeight);
    ctx.closePath();
    ctx.fill();

    // 🆕 Добавляем тень под линией для глубины
    ctx.shadowColor = lineColor + '40';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 3;

    // Рисуем основную линию
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();

    chartData.forEach((point, index) => {
      const x = getX(index);
      const y = getY(point.balance);

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // 🆕 Рисуем маленькие точки на линии
    chartData.forEach((point, index) => {
      const x = getX(index);
      const y = getY(point.balance);

      // Обычные точки (маленькие)
      if (hoveredPoint !== index) {
        ctx.fillStyle = lineColor;
        ctx.shadowColor = 'transparent';
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, 2 * Math.PI);
        ctx.fill();
      }
    });

    // Убираем тень для следующих элементов
    ctx.shadowColor = 'transparent';

    // Рисуем активную точку при hover
    if (hoveredPoint !== null) {
      const x = getX(hoveredPoint);
      const y = getY(chartData[hoveredPoint].balance);

      // Внешний круг (белый)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.fill();

      // Внутренний круг (цветной)
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // Рисуем подписи осей
    ctx.fillStyle = '#8e8e93';
    ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';

    // Подписи дат (показываем каждую 3-ю для читабельности)
    chartData.forEach((point, index) => {
      if (index % Math.max(1, Math.floor(chartData.length / 5)) === 0 || index === chartData.length - 1) {
        const x = getX(index);
        ctx.fillText(point.displayDate, x, rect.height - 10);
      }
    });

    // Подписи значений по Y
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const value = maxValue - (i / 5) * valueRange;
      const y = padding.top + (i / 5) * chartHeight + 4;
      let formattedValue;

      if (value >= 1000000) {
        formattedValue = `${(value / 1000000).toFixed(1)}M`;
      } else if (value >= 1000) {
        formattedValue = `${(value / 1000).toFixed(0)}K`;
      } else {
        formattedValue = value.toFixed(0);
      }

      ctx.fillText(formattedValue + ' ₽', padding.left - 10, y);
    }
  };

  // 🆕 Улучшенная обработка движения мыши для tooltip
  const handleMouseMove = (event) => {
    if (!canvasRef.current || chartData.length === 0) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const padding = { left: 60, right: 20, top: 20, bottom: 40 };
    const chartWidth = rect.width - padding.left - padding.right;
    const chartHeight = rect.height - padding.top - padding.bottom;

    // Проверяем, что мышь внутри области графика
    if (x < padding.left || x > rect.width - padding.right ||
        y < padding.top || y > rect.height - padding.bottom) {
      setHoveredPoint(null);
      return;
    }

    const relativeX = (x - padding.left) / chartWidth;
    const pointIndex = Math.round(relativeX * (chartData.length - 1));

    if (pointIndex >= 0 && pointIndex < chartData.length) {
      setHoveredPoint(pointIndex);
    } else {
      setHoveredPoint(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-sm font-medium mb-2">
          Ошибка загрузки графика
        </div>
        <div className="text-gray-500 text-xs mb-4">{error}</div>
        <button
          onClick={() => loadChartData(selectedPeriod)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
        >
          Повторить
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Селектор периода */}
      <ChartPeriodSelector
        selectedPeriod={selectedPeriod}
        onPeriodChange={handlePeriodChange}
        loading={loading}
      />

      {/* График */}
      <div className="relative">
        {/* Индикатор загрузки */}
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10 rounded-xl backdrop-blur-sm">
            <div className="flex items-center space-x-3 text-gray-600">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-medium">Обновление графика...</span>
            </div>
          </div>
        )}

        {/* Контейнер графика */}
        <div className={`
          bg-white rounded-xl p-3 md:p-5 border border-gray-100 shadow-sm relative
          transition-all duration-300
          ${loading ? 'opacity-50' : 'opacity-100'}
        `} style={{ height: window.innerWidth < 640 ? '200px' : '280px' }}>
          {chartData.length > 0 ? (
            <>
              <canvas
                ref={canvasRef}
                className="w-full h-full cursor-crosshair"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{ width: '100%', height: '100%' }}
              />

              {/* 🆕 Улучшенный Tooltip */}
              {hoveredPoint !== null && (
                <div
                  className="absolute bg-black bg-opacity-90 text-white p-3 rounded-xl text-sm font-medium backdrop-blur-sm border border-gray-600 shadow-lg pointer-events-none z-10 max-w-xs"
                  style={{
                    left: `${Math.min(Math.max(((hoveredPoint / (chartData.length - 1)) * 100), 10), 90)}%`,
                    top: '10px',
                    transform: 'translateX(-50%)'
                  }}
                >
                  <div className="font-semibold mb-1 text-base">
                    {chartData[hoveredPoint]?.balance?.toLocaleString('ru-RU')} ₽
                  </div>
                  <div className="text-gray-300 text-xs mb-2">
                    {new Date(chartData[hoveredPoint]?.date).toLocaleDateString('ru-RU', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  {chartData[hoveredPoint]?.dailyChange !== 0 && (
                    <div className={`text-xs flex items-center ${
                      chartData[hoveredPoint]?.dailyChange > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {chartData[hoveredPoint]?.dailyChange > 0 ? '↗' : '↘'}
                      {chartData[hoveredPoint]?.dailyChange > 0 ? '+' : ''}
                      {chartData[hoveredPoint]?.dailyChange?.toLocaleString('ru-RU')} ₽
                    </div>
                  )}
                  {chartData[hoveredPoint]?.transactionsCount > 0 && (
                    <div className="text-xs text-gray-400 mt-1">
                      {chartData[hoveredPoint]?.transactionsCount} операц{chartData[hoveredPoint]?.transactionsCount === 1 ? 'ия' : 'ий'}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : !loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <div className="w-12 md:w-16 h-12 md:h-16 mx-auto mb-4 opacity-30">
                  <BarChart3 className="w-full h-full" />
                </div>
                <p className="text-sm font-medium">Нет данных для отображения</p>
                <p className="text-xs mt-1">Выберите другой период или проверьте операции</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Статистика */}
      {statistics && (
        <ChartStats
          statistics={statistics}
          cashDeskName={cashDeskName}
        />
      )}
    </div>
  );
};

export default CashDeskChart;