// src/pages/CrmFormPage.jsx
import { useEffect } from 'react';
import CrmForm from '../components/CrmForm';

const CrmFormPage = () => {
  useEffect(() => {
    // Устанавливаем заголовок страницы
    document.title = 'Запись на курсы QA/AQA тестирования | IT School';

    // Добавляем мета-теги для SEO
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content',
        'Записывайтесь на курсы QA/AQA тестирования. Изучите навыки тестирования, которые нужны IT-компаниям. Трудоустройство 87% выпускников.'
      );
    }

    // Удаляем базовые стили приложения для лендинга
    document.body.style.margin = '0';
    document.body.style.padding = '0';

    return () => {
      // Восстанавливаем заголовок при уходе со страницы
      document.title = 'CRM System';
      if (metaDescription) {
        metaDescription.setAttribute('content', 'CRM система для управления клиентами и финансами');
      }
    };
  }, []);

  return <CrmForm />;
};

export default CrmFormPage;