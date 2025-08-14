// backend/docs/schemas/finances.js - Схемы для модуля финансов

/**
 * @swagger
 * components:
 *   schemas:
 *     # ===== ОСНОВНАЯ СХЕМА ФИНАНСОВОЙ ОПЕРАЦИИ =====
 *     Finance:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Уникальный идентификатор операции
 *           example: 1
 *         type:
 *           type: string
 *           enum: [income, expense, transfer]
 *           description: Тип операции
 *           example: income
 *         status:
 *           type: string
 *           enum: [actual, planned]
 *           description: Статус операции (факт или план)
 *           example: actual
 *         amount:
 *           type: number
 *           format: float
 *           minimum: 0
 *           description: Сумма операции
 *           example: 50000.00
 *         description:
 *           type: string
 *           description: Описание операции
 *           example: Оплата за курс JavaScript
 *         date:
 *           type: string
 *           format: date
 *           description: Дата операции
 *           example: 2024-01-15
 *         category:
 *           type: string
 *           description: Категория операции
 *           example: Обучение
 *         client_id:
 *           type: integer
 *           description: ID связанного клиента
 *           example: 1
 *         client_name:
 *           type: string
 *           description: Имя клиента
 *           example: Иван Петров
 *         client_phone:
 *           type: string
 *           description: Телефон клиента
 *           example: +7 (999) 123-45-67
 *         cash_desk_id:
 *           type: integer
 *           description: ID кассы
 *           example: 1
 *         cash_desk_name:
 *           type: string
 *           description: Название кассы
 *           example: Основная касса
 *         payment_method:
 *           type: string
 *           enum: [cash, card, bank_transfer, online, other]
 *           description: Способ оплаты
 *           example: card
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Дата создания записи
 *           example: 2024-01-15T10:30:00.000Z
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Дата последнего обновления
 *           example: 2024-01-15T10:30:00.000Z
 *         # Для трансферных операций
 *         from_cash_desk_id:
 *           type: integer
 *           description: ID кассы-источника (для переводов)
 *           example: 1
 *         to_cash_desk_id:
 *           type: integer
 *           description: ID кассы-получателя (для переводов)
 *           example: 2
 *         transfer_pair_id:
 *           type: string
 *           description: UUID пары для трансферной операции
 *           example: 550e8400-e29b-41d4-a716-446655440000
 *       example:
 *         id: 1
 *         type: income
 *         status: actual
 *         amount: 50000.00
 *         description: Оплата за курс JavaScript
 *         date: 2024-01-15
 *         category: Обучение
 *         client_id: 1
 *         client_name: Иван Петров
 *         client_phone: +7 (999) 123-45-67
 *         cash_desk_id: 1
 *         cash_desk_name: Основная касса
 *         payment_method: card
 *         created_at: 2024-01-15T10:30:00.000Z
 *         updated_at: 2024-01-15T10:30:00.000Z
 *
 *     # ===== ЗАПРОСЫ НА СОЗДАНИЕ/ОБНОВЛЕНИЕ =====
 *     FinanceCreateRequest:
 *       type: object
 *       required:
 *         - type
 *         - amount
 *         - description
 *         - date
 *       properties:
 *         type:
 *           type: string
 *           enum: [income, expense, transfer]
 *           description: Тип операции
 *           example: income
 *         status:
 *           type: string
 *           enum: [actual, planned]
 *           default: actual
 *           description: Статус операции
 *           example: actual
 *         amount:
 *           type: number
 *           format: float
 *           minimum: 0.01
 *           description: Сумма операции
 *           example: 50000.00
 *         description:
 *           type: string
 *           minLength: 1
 *           maxLength: 500
 *           description: Описание операции
 *           example: Оплата за курс JavaScript
 *         date:
 *           type: string
 *           format: date
 *           description: Дата операции
 *           example: 2024-01-15
 *         category:
 *           type: string
 *           maxLength: 100
 *           description: Категория операции
 *           example: Обучение
 *         client_id:
 *           type: integer
 *           minimum: 1
 *           description: ID связанного клиента
 *           example: 1
 *         cash_desk_id:
 *           type: integer
 *           minimum: 1
 *           description: ID кассы
 *           example: 1
 *         payment_method:
 *           type: string
 *           enum: [cash, card, bank_transfer, online, other]
 *           default: cash
 *           description: Способ оплаты
 *           example: card
 *       example:
 *         type: income
 *         status: actual
 *         amount: 50000.00
 *         description: Оплата за курс JavaScript
 *         date: 2024-01-15
 *         category: Обучение
 *         client_id: 1
 *         cash_desk_id: 1
 *         payment_method: card
 *
 *     FinanceUpdateRequest:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           enum: [income, expense, transfer]
 *           description: Тип операции
 *         status:
 *           type: string
 *           enum: [actual, planned]
 *           description: Статус операции
 *         amount:
 *           type: number
 *           format: float
 *           minimum: 0.01
 *           description: Сумма операции
 *         description:
 *           type: string
 *           minLength: 1
 *           maxLength: 500
 *           description: Описание операции
 *         date:
 *           type: string
 *           format: date
 *           description: Дата операции
 *         category:
 *           type: string
 *           maxLength: 100
 *           description: Категория операции
 *         client_id:
 *           type: integer
 *           minimum: 1
 *           description: ID связанного клиента
 *         cash_desk_id:
 *           type: integer
 *           minimum: 1
 *           description: ID кассы
 *         payment_method:
 *           type: string
 *           enum: [cash, card, bank_transfer, online, other]
 *           description: Способ оплаты
 *
 *     # ===== ТРАНСФЕРНЫЕ ОПЕРАЦИИ =====
 *     TransferPairRequest:
 *       type: object
 *       required:
 *         - amount
 *         - description
 *         - date
 *         - from_cash_desk_id
 *         - to_cash_desk_id
 *       properties:
 *         amount:
 *           type: number
 *           format: float
 *           minimum: 0.01
 *           description: Сумма перевода
 *           example: 10000.00
 *         description:
 *           type: string
 *           minLength: 1
 *           maxLength: 500
 *           description: Описание перевода
 *           example: Перевод между кассами
 *         date:
 *           type: string
 *           format: date
 *           description: Дата перевода
 *           example: 2024-01-15
 *         from_cash_desk_id:
 *           type: integer
 *           minimum: 1
 *           description: ID кассы-источника
 *           example: 1
 *         to_cash_desk_id:
 *           type: integer
 *           minimum: 1
 *           description: ID кассы-получателя
 *           example: 2
 *         status:
 *           type: string
 *           enum: [actual, planned]
 *           default: actual
 *           description: Статус перевода
 *           example: actual
 *       example:
 *         amount: 10000.00
 *         description: Перевод между кассами
 *         date: 2024-01-15
 *         from_cash_desk_id: 1
 *         to_cash_desk_id: 2
 *         status: actual
 *
 *     TransferPairResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             transfer_pair_id:
 *               type: string
 *               description: UUID пары перевода
 *               example: 550e8400-e29b-41d4-a716-446655440000
 *             expense_operation:
 *               $ref: '#/components/schemas/Finance'
 *             income_operation:
 *               $ref: '#/components/schemas/Finance'
 *
 *     # ===== СТАТИСТИКА И СВОДКИ =====
 *     FinanceSummary:
 *       type: object
 *       properties:
 *         total_operations:
 *           type: integer
 *           description: Общее количество операций
 *           example: 150
 *         actual_operations:
 *           type: integer
 *           description: Количество фактических операций
 *           example: 120
 *         planned_operations:
 *           type: integer
 *           description: Количество плановых операций
 *           example: 30
 *         # Фактические данные
 *         actual_income:
 *           type: number
 *           format: float
 *           description: Фактический доход
 *           example: 500000.00
 *         actual_expense:
 *           type: number
 *           format: float
 *           description: Фактический расход
 *           example: 200000.00
 *         actual_balance:
 *           type: number
 *           format: float
 *           description: Фактический баланс (доходы - расходы)
 *           example: 300000.00
 *         # Плановые данные
 *         planned_income:
 *           type: number
 *           format: float
 *           description: Плановый доход
 *           example: 600000.00
 *         planned_expense:
 *           type: number
 *           format: float
 *           description: Плановый расход
 *           example: 250000.00
 *         planned_balance:
 *           type: number
 *           format: float
 *           description: Плановый баланс
 *           example: 350000.00
 *       example:
 *         total_operations: 150
 *         actual_operations: 120
 *         planned_operations: 30
 *         actual_income: 500000.00
 *         actual_expense: 200000.00
 *         actual_balance: 300000.00
 *         planned_income: 600000.00
 *         planned_expense: 250000.00
 *         planned_balance: 350000.00
 *
 *     # ===== ОТВЕТЫ =====
 *     FinanceResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/Finance'
 *
 *     FinanceListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Finance'
 *         pagination:
 *           $ref: '#/components/schemas/Pagination'
 *
 *     FinanceSummaryResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/FinanceSummary'
 *
 *     # ===== АНАЛИТИКА ПО КАТЕГОРИЯМ =====
 *     CategoryStats:
 *       type: object
 *       properties:
 *         category:
 *           type: string
 *           description: Название категории
 *           example: Обучение
 *         total_amount:
 *           type: number
 *           format: float
 *           description: Общая сумма по категории
 *           example: 150000.00
 *         operations_count:
 *           type: integer
 *           description: Количество операций в категории
 *           example: 25
 *         percentage:
 *           type: number
 *           format: float
 *           description: Процент от общей суммы
 *           example: 30.5
 *
 *     CategoryStatsResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CategoryStats'
 *
 *     # ===== ОШИБКИ СПЕЦИФИЧНЫЕ ДЛЯ ФИНАНСОВ =====
 *     InsufficientFundsError:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           example: Недостаточно средств в кассе для выполнения операции
 *
 *     InvalidTransferError:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           example: Нельзя переводить между одинаковыми кассами
 *
 *     CashDeskNotFoundError:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           example: Касса не найдена или неактивна
 */