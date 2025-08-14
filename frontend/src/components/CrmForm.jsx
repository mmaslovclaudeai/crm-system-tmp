// src/components/CrmForm.jsx
import { useState } from 'react';
import { BookOpen, User, Mail, Phone, MessageCircle, Send, CheckCircle, Calendar, Star, Award, AlertCircle, X } from 'lucide-react';

const CrmForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    telegram: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  // Состояние для Toast уведомлений
  const [toast, setToast] = useState({
    isVisible: false,
    message: '',
    type: 'info' // 'success', 'error', 'info'
  });

  // Функции для Toast
  const showToast = (message, type = 'info') => {
    setToast({
      isVisible: true,
      message,
      type
    });

    // Автоматически скрываем через 5 секунд
    setTimeout(() => {
      setToast(prev => ({ ...prev, isVisible: false }));
    }, 5000);
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  const showSuccess = (message) => showToast(message, 'success');
  const showError = (message) => showToast(message, 'error');
  const showInfo = (message) => showToast(message, 'info');

  // Функция для форматирования Telegram
  const formatTelegram = (value) => {
    if (!value) return '';

    // Убираем все лишнее и извлекаем username
    let username = value
      .replace(/https?:\/\/(t\.me\/|telegram\.me\/)/gi, '') // Убираем ссылки
      .replace(/^@/, '') // Убираем @ в начале если есть
      .replace(/[^a-zA-Z0-9_]/g, '') // Оставляем только буквы, цифры и подчеркивания
      .toLowerCase(); // Приводим к нижнему регистру

    // Если username пустой, возвращаем пустую строку
    if (!username) return '';

    // Ограничиваем длину (максимум 32 символа для Telegram username)
    username = username.slice(0, 32);

    // Добавляем @ в начало
    return `@${username}`;
  };

  // Функция для получения чистого Telegram username (для отправки в базу)
  const getCleanTelegram = (formattedTelegram) => {
    if (!formattedTelegram) return '';
    return formattedTelegram; // Уже в формате @username
  };

  // Функция для форматирования телефона
  const formatPhone = (value) => {
    // Убираем все символы кроме цифр
    const cleaned = value.replace(/\D/g, '');

    // Если строка пустая, возвращаем пустую строку
    if (!cleaned) return '';

    // Обрабатываем разные случаи ввода
    let normalizedNumber = cleaned;

    // Если начинается с 8, заменяем на 7
    if (normalizedNumber.startsWith('8')) {
      normalizedNumber = '7' + normalizedNumber.slice(1);
    }

    // Если не начинается с 7, добавляем 7
    if (!normalizedNumber.startsWith('7')) {
      normalizedNumber = '7' + normalizedNumber;
    }

    // Обрезаем до 11 цифр максимум
    normalizedNumber = normalizedNumber.slice(0, 11);

    // Форматируем визуально как +7 (XXX) XXX-XX-XX
    if (normalizedNumber.length >= 1) {
      const countryCode = normalizedNumber[0];
      const areaCode = normalizedNumber.slice(1, 4);
      const firstPart = normalizedNumber.slice(4, 7);
      const secondPart = normalizedNumber.slice(7, 9);
      const thirdPart = normalizedNumber.slice(9, 11);

      let formatted = `+${countryCode}`;

      if (areaCode.length > 0) {
        formatted += ` (${areaCode}`;
        if (areaCode.length === 3) {
          formatted += ')';

          if (firstPart.length > 0) {
            formatted += ` ${firstPart}`;

            if (secondPart.length > 0) {
              formatted += `-${secondPart}`;

              if (thirdPart.length > 0) {
                formatted += `-${thirdPart}`;
              }
            }
          }
        }
      }

      return formatted;
    }

    return normalizedNumber;
  };

  // Функция для получения чистого номера (только цифры для отправки в базу)
  const getCleanPhone = (formattedPhone) => {
    const cleaned = formattedPhone.replace(/\D/g, '');

    // Нормализуем номер
    let normalizedNumber = cleaned;

    if (normalizedNumber.startsWith('8')) {
      normalizedNumber = '7' + normalizedNumber.slice(1);
    }

    if (!normalizedNumber.startsWith('7')) {
      normalizedNumber = '7' + normalizedNumber;
    }

    return normalizedNumber.slice(0, 11);
  };

  const handleInputChange = (field, value) => {
    if (field === 'phone') {
      // Для телефона применяем форматирование
      const formatted = formatPhone(value);
      setFormData(prev => ({ ...prev, [field]: formatted }));
    } else if (field === 'telegram') {
      // Для Telegram применяем форматирование
      const formatted = formatTelegram(value);
      setFormData(prev => ({ ...prev, [field]: formatted }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Введите ваше имя';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Введите email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Некорректный email';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Введите номер телефона';
    } else {
      // Проверяем, что чистый номер имеет правильную длину
      const cleanPhone = getCleanPhone(formData.phone);
      if (cleanPhone.length !== 11 || !cleanPhone.startsWith('7')) {
        newErrors.phone = 'Введите корректный номер телефона';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Отправляем данные на backend
      const response = await fetch('/api/public/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: getCleanPhone(formData.phone), // Отправляем чистый номер
          telegram: getCleanTelegram(formData.telegram) // Отправляем отформатированный Telegram
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка отправки формы');
      }

      const result = await response.json();
      setIsSubmitted(true);
      showSuccess('Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.');
    } catch (error) {
      console.error('Ошибка отправки формы:', error);

      // Показываем конкретную ошибку пользователю
      if (error.message.includes('уже была отправлена')) {
        showError('Заявка уже была отправлена. Наш менеджер свяжется с вами в ближайшее время.');
      } else if (error.message.includes('Слишком много заявок')) {
        showError('Слишком много заявок с вашего IP. Попробуйте позже.');
      } else {
        showError('Произошла ошибка при отправке заявки. Попробуйте еще раз или свяжитесь с нами напрямую.');
      }

      setErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="mb-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Заявка отправлена!
            </h2>
            <p className="text-gray-600">
              Спасибо за интерес к нашим курсам. Мы свяжемся с вами в ближайшее время.
            </p>
          </div>
          <button
            onClick={() => {
              setIsSubmitted(false);
              setFormData({ name: '', email: '', phone: '', telegram: '' });
            }}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Отправить еще одну заявку
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
              Станьте QA/AQA тестировщиком
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Изучите навыки тестирования, которые нужны IT-компаниям.
              Трудоустройство 87% выпускников.
            </p>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                <div className="text-3xl font-bold text-blue-600 mb-2">87%</div>
                <div className="text-gray-600">Трудоустройство выпускников</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                <div className="text-3xl font-bold text-purple-600 mb-2">4 мес</div>
                <div className="text-gray-600">Продолжительность курса</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                <div className="text-3xl font-bold text-green-600 mb-2">80k₽</div>
                <div className="text-gray-600">Средняя зарплата</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Form */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8">
              <div className="text-center mb-8">
                <BookOpen className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Запишитесь на бесплатную консультацию
                </h2>
                <p className="text-gray-600">
                  Узнайте подробности о курсе и получите персональную программу обучения
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Field */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Ваше имя *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        errors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Введите ваше имя"
                    />
                  </div>
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="your@email.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Phone Field */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Телефон *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        errors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="+7 (999) 123-45-67"
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                  )}
                </div>

                {/* Telegram Field */}
                <div>
                  <label htmlFor="telegram" className="block text-sm font-medium text-gray-700 mb-2">
                    Telegram
                  </label>
                  <div className="relative">
                    <MessageCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      id="telegram"
                      value={formData.telegram}
                      onChange={(e) => handleInputChange('telegram', e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="@username или t.me/username"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Введите ваш username или ссылку на профиль
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Отправляем...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Send className="w-5 h-5 mr-2" />
                      Записаться на консультацию
                    </div>
                  )}
                </button>

                {errors.submit && (
                  <p className="text-red-500 text-sm text-center">{errors.submit}</p>
                )}
              </form>
            </div>

            {/* Features */}
            <div className="space-y-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                <Calendar className="w-10 h-10 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Гибкий график обучения
                </h3>
                <p className="text-gray-600">
                  Занятия в удобное время. Совмещайте обучение с работой или учебой.
                </p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                <Star className="w-10 h-10 text-purple-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Практический опыт
                </h3>
                <p className="text-gray-600">
                  Работа с реальными проектами и современными инструментами тестирования.
                </p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                <Award className="w-10 h-10 text-green-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Помощь в трудоустройстве
                </h3>
                <p className="text-gray-600">
                  Подготовка резюме, подготовка к собеседованиям и помощь в поиске работы.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast уведомления */}
      {toast.isVisible && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 transform transition-all duration-300 ${
          toast.type === 'success' ? 'bg-green-500 text-white' :
          toast.type === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          {toast.type === 'success' && <CheckCircle className="w-5 h-5" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5" />}
          {toast.type === 'info' && <MessageCircle className="w-5 h-5" />}

          <span className="font-medium">{toast.message}</span>

          <button
            onClick={hideToast}
            className="ml-2 hover:bg-white hover:bg-opacity-20 rounded p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default CrmForm;