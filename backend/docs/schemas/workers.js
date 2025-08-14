// backend/docs/schemas/workers.js - Схемы для модуля сотрудников

/**
 * @swagger
 * components:
 *   schemas:
 *     # ===== ОСНОВНАЯ СХЕМА СОТРУДНИКА =====
 *     Worker:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Уникальный идентификатор сотрудника
 *           example: 1
 *         full_name:
 *           type: string
 *           description: Полное имя сотрудника
 *           example: Анна Смирнова
 *         position:
 *           type: string
 *           description: Должность сотрудника
 *           example: Куратор курсов
 *         email:
 *           type: string
 *           format: email
 *           description: Email адрес сотрудника
 *           example: anna@company.com
 *         phone:
 *           type: string
 *           description: Номер телефона
 *           example: +7 (999) 123-45-67
 *         telegram:
 *           type: string
 *           description: Telegram handle
 *           example: '@anna_curator'
 *         hire_date:
 *           type: string
 *           format: date
 *           description: Дата приема на работу
 *           example: 2023-01-15
 *         salary:
 *           type: number
 *           format: float
 *           description: Оклад сотрудника
 *           example: 80000.00
 *         is_active:
 *           type: boolean
 *           description: Активен ли сотрудник
 *           example: true
 *         department:
 *           type: string
 *           description: Отдел/департамент
 *           example: Образовательный отдел
 *         role:
 *           type: string
 *           enum: [admin, manager, curator, assistant, accountant]
 *           description: Роль сотрудника в системе
 *           example: curator
 *         permissions:
 *           type: array
 *           items:
 *             type: string
 *           description: Права доступа сотрудника
 *           example: ['clients.read', 'clients.update', 'finances.read']
 *         notes:
 *           type: string
 *           description: Дополнительные заметки о сотруднике
 *           example: Отвечает за курсы по программированию
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Дата создания записи
 *           example: 2023-01-15T09:00:00.000Z
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Дата последнего обновления
 *           example: 2024-01-15T14:30:00.000Z
 *         # Статистика по сотруднику
 *         clients_count:
 *           type: integer
 *           description: Количество клиентов под кураторством
 *           example: 25
 *         active_clients_count:
 *           type: integer
 *           description: Количество активных клиентов
 *           example: 18
 *         total_revenue:
 *           type: number
 *           format: float
 *           description: Общая выручка по клиентам сотрудника
 *           example: 450000.00
 *         last_activity_date:
 *           type: string
 *           format: date-time
 *           description: Дата последней активности
 *           example: 2024-01-20T16:45:00.000Z
 *       example:
 *         id: 1
 *         full_name: Анна Смирнова
 *         position: Куратор курсов
 *         email: anna@company.com
 *         phone: +7 (999) 123-45-67
 *         telegram: '@anna_curator'
 *         hire_date: 2023-01-15
 *         salary: 80000.00
 *         is_active: true
 *         department: Образовательный отдел
 *         role: curator
 *         permissions: ['clients.read', 'clients.update', 'finances.read']
 *         notes: Отвечает за курсы по программированию
 *         created_at: 2023-01-15T09:00:00.000Z
 *         updated_at: 2024-01-15T14:30:00.000Z
 *         clients_count: 25
 *         active_clients_count: 18
 *         total_revenue: 450000.00
 *         last_activity_date: 2024-01-20T16:45:00.000Z
 *
 *     # ===== ЗАПРОСЫ НА СОЗДАНИЕ/ОБНОВЛЕНИЕ =====
 *     WorkerCreateRequest:
 *       type: object
 *       required:
 *         - full_name
 *         - position
 *         - email
 *       properties:
 *         full_name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           description: Полное имя сотрудника
 *           example: Анна Смирнова
 *         position:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           description: Должность сотрудника
 *           example: Куратор курсов
 *         email:
 *           type: string
 *           format: email
 *           description: Email адрес сотрудника
 *           example: anna@company.com
 *         phone:
 *           type: string
 *           pattern: '^\\+?[1-9]\\d{1,14}$'
 *           description: Номер телефона
 *           example: +7 (999) 123-45-67
 *         telegram:
 *           type: string
 *           pattern: '^@[a-zA-Z0-9_]+$'
 *           description: Telegram handle
 *           example: '@anna_curator'
 *         hire_date:
 *           type: string
 *           format: date
 *           description: Дата приема на работу
 *           example: 2023-01-15
 *         salary:
 *           type: number
 *           format: float
 *           minimum: 0
 *           description: Оклад сотрудника
 *           example: 80000.00
 *         is_active:
 *           type: boolean
 *           default: true
 *           description: Активен ли сотрудник
 *           example: true
 *         department:
 *           type: string
 *           maxLength: 100
 *           description: Отдел/департамент
 *           example: Образовательный отдел
 *         role:
 *           type: string
 *           enum: [admin, manager, curator, assistant, accountant]
 *           default: assistant
 *           description: Роль сотрудника в системе
 *           example: curator
 *         permissions:
 *           type: array
 *           items:
 *             type: string
 *           description: Права доступа сотрудника
 *           example: ['clients.read', 'clients.update']
 *         notes:
 *           type: string
 *           maxLength: 1000
 *           description: Дополнительные заметки
 *           example: Отвечает за курсы по программированию
 *       example:
 *         full_name: Анна Смирнова
 *         position: Куратор курсов
 *         email: anna@company.com
 *         phone: +7 (999) 123-45-67
 *         telegram: '@anna_curator'
 *         hire_date: 2023-01-15
 *         salary: 80000.00
 *         is_active: true
 *         department: Образовательный отдел
 *         role: curator
 *         permissions: ['clients.read', 'clients.update', 'finances.read']
 *
 *     WorkerUpdateRequest:
 *       type: object
 *       properties:
 *         full_name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           description: Полное имя сотрудника
 *         position:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           description: Должность сотрудника
 *         email:
 *           type: string
 *           format: email
 *           description: Email адрес сотрудника
 *         phone:
 *           type: string
 *           pattern: '^\\+?[1-9]\\d{1,14}$'
 *           description: Номер телефона
 *         telegram:
 *           type: string
 *           pattern: '^@[a-zA-Z0-9_]+$'
 *           description: Telegram handle
 *         hire_date:
 *           type: string
 *           format: date
 *           description: Дата приема на работу
 *         salary:
 *           type: number
 *           format: float
 *           minimum: 0
 *           description: Оклад сотрудника
 *         is_active:
 *           type: boolean
 *           description: Активен ли сотрудник
 *         department:
 *           type: string
 *           maxLength: 100
 *           description: Отдел/департамент
 *         role:
 *           type: string
 *           enum: [admin, manager, curator, assistant, accountant]
 *           description: Роль сотрудника в системе
 *         permissions:
 *           type: array
 *           items:
 *             type: string
 *           description: Права доступа сотрудника
 *         notes:
 *           type: string
 *           maxLength: 1000
 *           description: Дополнительные заметки
 *
 *     # ===== СТАТИСТИКА СОТРУДНИКА =====
 *     WorkerStats:
 *       type: object
 *       properties:
 *         worker_id:
 *           type: integer
 *           description: ID сотрудника
 *           example: 1
 *         worker_name:
 *           type: string
 *           description: Имя сотрудника
 *           example: Анна Смирнова
 *         period_start:
 *           type: string
 *           format: date
 *           description: Начало периода анализа
 *           example: 2024-01-01
 *         period_end:
 *           type: string
 *           format: date
 *           description: Конец периода анализа
 *           example: 2024-01-31
 *         clients_total:
 *           type: integer
 *           description: Общее количество клиентов
 *           example: 25
 *         clients_active:
 *           type: integer
 *           description: Количество активных клиентов
 *           example: 18
 *         clients_new:
 *           type: integer
 *           description: Новых клиентов за период
 *           example: 5
 *         revenue_total:
 *           type: number
 *           format: float
 *           description: Общая выручка за период
 *           example: 125000.00
 *         revenue_average_per_client:
 *           type: number
 *           format: float
 *           description: Средняя выручка на клиента
 *           example: 6944.44
 *         conversion_rate:
 *           type: number
 *           format: float
 *           description: Коэффициент конверсии в %
 *           example: 75.5
 *         performance_rating:
 *           type: string
 *           enum: [excellent, good, average, below_average, poor]
 *           description: Оценка эффективности
 *           example: good
 *
 *     # ===== ФИНАНСОВЫЕ ОПЕРАЦИИ СОТРУДНИКА =====
 *     WorkerFinances:
 *       type: object
 *       properties:
 *         worker_id:
 *           type: integer
 *           description: ID сотрудника
 *           example: 1
 *         finances:
 *           type: array
 *           items:
 *             allOf:
 *               - $ref: '#/components/schemas/Finance'
 *               - type: object
 *                 properties:
 *                   client_name:
 *                     type: string
 *                     description: Имя клиента по операции
 *                     example: Иван Петров
 *         summary:
 *           type: object
 *           properties:
 *             total_operations:
 *               type: integer
 *               description: Общее количество операций
 *               example: 45
 *             total_revenue:
 *               type: number
 *               format: float
 *               description: Общая выручка
 *               example: 350000.00
 *             average_deal_size:
 *               type: number
 *               format: float
 *               description: Средний размер сделки
 *               example: 7777.78
 *
 *     # ===== ОТВЕТЫ =====
 *     WorkerResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/Worker'
 *
 *     WorkerListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Worker'
 *         pagination:
 *           $ref: '#/components/schemas/Pagination'
 *
 *     WorkerStatsResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/WorkerStats'
 *
 *     WorkerFinancesResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/WorkerFinances'
 *
 *     # ===== ОБЩАЯ СТАТИСТИКА ПО СОТРУДНИКАМ =====
 *     WorkersOverallStats:
 *       type: object
 *       properties:
 *         total_workers:
 *           type: integer
 *           description: Общее количество сотрудников
 *           example: 12
 *         active_workers:
 *           type: integer
 *           description: Количество активных сотрудников
 *           example: 10
 *         by_department:
 *           type: object
 *           additionalProperties:
 *             type: integer
 *           description: Распределение по отделам
 *           example:
 *             "Образовательный отдел": 6
 *             "Административный отдел": 3
 *             "Финансовый отдел": 1
 *         by_role:
 *           type: object
 *           additionalProperties:
 *             type: integer
 *           description: Распределение по ролям
 *           example:
 *             "curator": 6
 *             "manager": 2
 *             "admin": 1
 *             "accountant": 1
 *         top_performers:
 *           type: array
 *           description: Топ сотрудников по выручке
 *           items:
 *             type: object
 *             properties:
 *               worker_id:
 *                 type: integer
 *                 example: 1
 *               full_name:
 *                 type: string
 *                 example: Анна Смирнова
 *               total_revenue:
 *                 type: number
 *                 format: float
 *                 example: 450000.00
 *               clients_count:
 *                 type: integer
 *                 example: 25
 *         average_salary:
 *           type: number
 *           format: float
 *           description: Средний оклад
 *           example: 67500.00
 *         total_payroll:
 *           type: number
 *           format: float
 *           description: Общий фонд заработной платы
 *           example: 810000.00
 *
 *     WorkersOverallStatsResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/WorkersOverallStats'
 *
 *     # ===== ПРАВА И РОЛИ =====
 *     Permission:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Идентификатор права
 *           example: clients.read
 *         name:
 *           type: string
 *           description: Название права
 *           example: Просмотр клиентов
 *         description:
 *           type: string
 *           description: Описание права
 *           example: Позволяет просматривать список и карточки клиентов
 *         category:
 *           type: string
 *           description: Категория права
 *           example: clients
 *
 *     Role:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Идентификатор роли
 *           example: curator
 *         name:
 *           type: string
 *           description: Название роли
 *           example: Куратор
 *         description:
 *           type: string
 *           description: Описание роли
 *           example: Сотрудник, курирующий клиентов и их обучение
 *         permissions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Permission'
 *           description: Права, включенные в роль
 *
 *     PermissionsResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             permissions:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Permission'
 *             roles:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Role'
 *
 *     # ===== СПЕЦИАЛЬНЫЕ ОШИБКИ ДЛЯ СОТРУДНИКОВ =====
 *     WorkerInactiveError:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           example: Сотрудник неактивен и не может выполнять операции
 *
 *     InsufficientPermissionsError:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           example: Недостаточно прав доступа для выполнения операции
 *
 *     WorkerHasClientsError:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           example: Невозможно удалить сотрудника. За ним закреплены клиенты
 */