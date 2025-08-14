// backend/docs/schemas/clients.js - Схемы для модуля клиентов

/**
 * @swagger
 * components:
 *   schemas:
 *     # ===== ОСНОВНАЯ СХЕМА КЛИЕНТА =====
 *     Client:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Уникальный идентификатор клиента
 *           example: 1
 *         name:
 *           type: string
 *           description: Имя клиента
 *           example: Иван Петров
 *         phone:
 *           type: string
 *           description: Номер телефона
 *           example: +7 (999) 123-45-67
 *         email:
 *           type: string
 *           format: email
 *           description: Email адрес
 *           example: ivan@example.com
 *         status:
 *           type: string
 *           enum: [new, contacted, qualified, proposal, negotiation, closed_won, closed_lost, on_hold]
 *           description: Статус клиента в воронке продаж
 *           example: qualified
 *         source:
 *           type: string
 *           description: Источник привлечения клиента
 *           example: Реклама ВК
 *         notes:
 *           type: string
 *           description: Заметки о клиенте
 *           example: Заинтересован в корпоративном обучении
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Дата создания записи
 *           example: 2024-01-15T10:30:00.000Z
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Дата последнего обновления
 *           example: 2024-01-20T14:45:00.000Z
 *         # Документы клиента
 *         documents:
 *           $ref: '#/components/schemas/ClientDocuments'
 *         # Telegram данные
 *         telegram:
 *           type: string
 *           description: Telegram handle клиента
 *           example: '@ivanov_ivan'
 *         # Куратор
 *         curator_name:
 *           type: string
 *           description: Имя куратора
 *           example: Анна Смирнова
 *         curator_telegram:
 *           type: string
 *           description: Telegram куратора
 *           example: '@anna_curator'
 *         # Образовательные данные
 *         education_data:
 *           $ref: '#/components/schemas/EducationData'
 *       example:
 *         id: 1
 *         name: Иван Петров
 *         phone: +7 (999) 123-45-67
 *         email: ivan@example.com
 *         status: qualified
 *         source: Реклама ВК
 *         notes: Заинтересован в корпоративном обучении
 *         created_at: 2024-01-15T10:30:00.000Z
 *         updated_at: 2024-01-20T14:45:00.000Z
 *         telegram: '@ivanov_ivan'
 *         curator_name: Анна Смирнова
 *         curator_telegram: '@anna_curator'
 *
 *     # ===== ДОКУМЕНТЫ КЛИЕНТА =====
 *     ClientDocuments:
 *       type: object
 *       properties:
 *         passport_series:
 *           type: string
 *           description: Серия паспорта
 *           example: 1234
 *         passport_number:
 *           type: string
 *           description: Номер паспорта
 *           example: 567890
 *         passport_issued_by:
 *           type: string
 *           description: Кем выдан паспорт
 *           example: УМВД России по г. Москве
 *         passport_issued_date:
 *           type: string
 *           format: date
 *           description: Дата выдачи паспорта
 *           example: 2015-03-15
 *         passport_department_code:
 *           type: string
 *           description: Код подразделения
 *           example: 770-001
 *         birth_date:
 *           type: string
 *           format: date
 *           description: Дата рождения
 *           example: 1985-07-22
 *         birth_place:
 *           type: string
 *           description: Место рождения
 *           example: г. Москва
 *         registration_address:
 *           type: string
 *           description: Адрес регистрации
 *           example: г. Москва, ул. Тверская, д. 1, кв. 10
 *         inn:
 *           type: string
 *           description: ИНН
 *           example: 123456789012
 *         snils:
 *           type: string
 *           description: СНИЛС
 *           example: 123-456-789 01
 *       example:
 *         passport_series: 1234
 *         passport_number: 567890
 *         passport_issued_by: УМВД России по г. Москве
 *         passport_issued_date: 2015-03-15
 *         passport_department_code: 770-001
 *         birth_date: 1985-07-22
 *         birth_place: г. Москва
 *         registration_address: г. Москва, ул. Тверская, д. 1, кв. 10
 *         inn: 123456789012
 *         snils: 123-456-789 01
 *
 *     # ===== ОБРАЗОВАТЕЛЬНЫЕ ДАННЫЕ =====
 *     EducationData:
 *       type: object
 *       properties:
 *         education_level:
 *           type: string
 *           enum: [secondary, specialized_secondary, incomplete_higher, higher, postgraduate]
 *           description: Уровень образования
 *           example: higher
 *         institution_name:
 *           type: string
 *           description: Название учебного заведения
 *           example: МГУ им. М.В. Ломоносова
 *         graduation_year:
 *           type: integer
 *           description: Год окончания
 *           example: 2007
 *         specialization:
 *           type: string
 *           description: Специализация/факультет
 *           example: Экономический факультет
 *         diploma_series:
 *           type: string
 *           description: Серия диплома
 *           example: АВВ
 *         diploma_number:
 *           type: string
 *           description: Номер диплома
 *           example: 1234567
 *       example:
 *         education_level: higher
 *         institution_name: МГУ им. М.В. Ломоносова
 *         graduation_year: 2007
 *         specialization: Экономический факультет
 *         diploma_series: АВВ
 *         diploma_number: 1234567
 *
 *     # ===== ЗАПРОСЫ НА СОЗДАНИЕ/ОБНОВЛЕНИЕ =====
 *     ClientCreateRequest:
 *       type: object
 *       required:
 *         - name
 *         - phone
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           description: Имя клиента
 *           example: Иванов Иван Иванович
 *         phone:
 *           type: string
 *           pattern: '^\\+?[1-9]\\d{1,14}$'
 *           description: Номер телефона
 *           example: 79780000002
 *         email:
 *           type: string
 *           format: email
 *           description: Email адрес
 *           example: i.ivanov@email.com
 *         status:
 *           type: string
 *           enum: [CREATED, DISTRIBUTION, GIVE_ACCESS, IN_PROGRESS, SEARCH_OFFER, ACCEPT_OFFER, PAYING_OFFER, FINISH]
 *           default: new
 *           description: Статус клиента
 *           example: IN_PROGRESS
 *       example:
 *         name: Иванов Иван Иванович
 *         phone: 79780000002
 *         email: i.ivanov@email.com
 *         status: IN_PROGRESS
 *
 *     ClientUpdateRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           description: Имя клиента
 *         phone:
 *           type: string
 *           pattern: '^\\+?[1-9]\\d{1,14}$'
 *           description: Номер телефона
 *         email:
 *           type: string
 *           format: email
 *           description: Email адрес
 *         status:
 *           type: string
 *           enum: [new, contacted, qualified, proposal, negotiation, closed_won, closed_lost, on_hold]
 *           description: Статус клиента
 *         source:
 *           type: string
 *           maxLength: 255
 *           description: Источник привлечения
 *         notes:
 *           type: string
 *           maxLength: 1000
 *           description: Заметки о клиенте
 *         telegram:
 *           type: string
 *           description: Telegram handle
 *         curator_name:
 *           type: string
 *           maxLength: 100
 *           description: Имя куратора
 *         curator_telegram:
 *           type: string
 *           description: Telegram куратора
 *
 *     # ===== ОБНОВЛЕНИЕ ДОКУМЕНТОВ =====
 *     DocumentsUpdateRequest:
 *       type: object
 *       properties:
 *         passport_series:
 *           type: string
 *           pattern: '^[0-9]{4}$'
 *           description: Серия паспорта (4 цифры)
 *         passport_number:
 *           type: string
 *           pattern: '^[0-9]{6}$'
 *           description: Номер паспорта (6 цифр)
 *         passport_issued_by:
 *           type: string
 *           maxLength: 255
 *           description: Кем выдан паспорт
 *         passport_issued_date:
 *           type: string
 *           format: date
 *           description: Дата выдачи паспорта
 *         passport_department_code:
 *           type: string
 *           pattern: '^[0-9]{3}-[0-9]{3}$'
 *           description: Код подразделения (XXX-XXX)
 *         birth_date:
 *           type: string
 *           format: date
 *           description: Дата рождения
 *         birth_place:
 *           type: string
 *           maxLength: 255
 *           description: Место рождения
 *         registration_address:
 *           type: string
 *           maxLength: 500
 *           description: Адрес регистрации
 *         inn:
 *           type: string
 *           pattern: '^[0-9]{10,12}$'
 *           description: ИНН (10 или 12 цифр)
 *         snils:
 *           type: string
 *           pattern: '^[0-9]{3}-[0-9]{3}-[0-9]{3} [0-9]{2}$'
 *           description: СНИЛС (XXX-XXX-XXX XX)
 *
 *     # ===== ОБНОВЛЕНИЕ ОБРАЗОВАТЕЛЬНЫХ ДАННЫХ =====
 *     EducationUpdateRequest:
 *       type: object
 *       properties:
 *         education_level:
 *           type: string
 *           enum: [secondary, specialized_secondary, incomplete_higher, higher, postgraduate]
 *           description: Уровень образования
 *         institution_name:
 *           type: string
 *           maxLength: 255
 *           description: Название учебного заведения
 *         graduation_year:
 *           type: integer
 *           minimum: 1950
 *           maximum: 2030
 *           description: Год окончания
 *         specialization:
 *           type: string
 *           maxLength: 255
 *           description: Специализация/факультет
 *         diploma_series:
 *           type: string
 *           maxLength: 10
 *           description: Серия диплома
 *         diploma_number:
 *           type: string
 *           maxLength: 20
 *           description: Номер диплома
 *
 *     # ===== ОТВЕТЫ =====
 *     ClientResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/Client'
 *
 *     ClientListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Client'
 *         pagination:
 *           $ref: '#/components/schemas/Pagination'
 *
 *     # ===== СТАТИСТИКА КЛИЕНТОВ =====
 *     ClientStats:
 *       type: object
 *       properties:
 *         total_clients:
 *           type: integer
 *           description: Общее количество клиентов
 *           example: 150
 *         by_status:
 *           type: object
 *           properties:
 *             new:
 *               type: integer
 *               example: 25
 *             contacted:
 *               type: integer
 *               example: 30
 *             qualified:
 *               type: integer
 *               example: 40
 *             proposal:
 *               type: integer
 *               example: 20
 *             negotiation:
 *               type: integer
 *               example: 15
 *             closed_won:
 *               type: integer
 *               example: 15
 *             closed_lost:
 *               type: integer
 *               example: 5
 *             on_hold:
 *               type: integer
 *               example: 0
 *         conversion_rate:
 *           type: number
 *           format: float
 *           description: Коэффициент конверсии в %
 *           example: 75.5
 *
 *     ClientStatsResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/ClientStats'
 */