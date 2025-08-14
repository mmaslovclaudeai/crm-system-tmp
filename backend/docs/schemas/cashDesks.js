// backend/docs/schemas/cashDesks.js - Схемы для модуля касс

/**
 * @swagger
 * components:
 *   schemas:
 *     # ===== ОСНОВНАЯ СХЕМА КАССЫ =====
 *     CashDesk:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Уникальный идентификатор кассы
 *           example: 1
 *         name:
 *           type: string
 *           description: Название кассы
 *           example: Основная касса
 *         description:
 *           type: string
 *           description: Описание кассы
 *           example: Основная касса для приема платежей
 *         balance:
 *           type: number
 *           format: float
 *           description: Текущий баланс кассы
 *           example: 150000.50
 *         currency:
 *           type: string
 *           enum: [RUB, USD, EUR]
 *           default: RUB
 *           description: Валюта кассы
 *           example: RUB
 *         is_active:
 *           type: boolean
 *           description: Активна ли касса
 *           example: true
 *         is_main:
 *           type: boolean
 *           description: Является ли основной кассой
 *           example: false
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Дата создания кассы
 *           example: 2024-01-01T00:00:00.000Z
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Дата последнего обновления
 *           example: 2024-01-15T10:30:00.000Z
 *         # Статистика по кассе
 *         total_income:
 *           type: number
 *           format: float
 *           description: Общая сумма поступлений
 *           example: 500000.00
 *         total_expense:
 *           type: number
 *           format: float
 *           description: Общая сумма расходов
 *           example: 350000.00
 *         operations_count:
 *           type: integer
 *           description: Количество операций
 *           example: 45
 *         last_operation_date:
 *           type: string
 *           format: date-time
 *           description: Дата последней операции
 *           example: 2024-01-15T14:30:00.000Z
 *       example:
 *         id: 1
 *         name: Основная касса
 *         description: Основная касса для приема платежей
 *         balance: 150000.50
 *         currency: RUB
 *         is_active: true
 *         is_main: false
 *         created_at: 2024-01-01T00:00:00.000Z
 *         updated_at: 2024-01-15T10:30:00.000Z
 *         total_income: 500000.00
 *         total_expense: 350000.00
 *         operations_count: 45
 *         last_operation_date: 2024-01-15T14:30:00.000Z
 *
 *     # ===== ТРАНЗАКЦИЯ КАССЫ =====
 *     CashDeskTransaction:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID связанной финансовой операции
 *           example: 123
 *         type:
 *           type: string
 *           enum: [income, expense, transfer_in, transfer_out]
 *           description: Тип транзакции
 *           example: income
 *         amount:
 *           type: number
 *           format: float
 *           description: Сумма транзакции
 *           example: 25000.00
 *         description:
 *           type: string
 *           description: Описание транзакции
 *           example: Оплата за курс Python
 *         date:
 *           type: string
 *           format: date
 *           description: Дата транзакции
 *           example: 2024-01-15
 *         status:
 *           type: string
 *           enum: [actual, planned]
 *           description: Статус транзакции
 *           example: actual
 *         category:
 *           type: string
 *           description: Категория операции
 *           example: Обучение
 *         client_name:
 *           type: string
 *           description: Имя клиента (для доходных операций)
 *           example: Иван Петров
 *         client_phone:
 *           type: string
 *           description: Телефон клиента
 *           example: +7 (999) 123-45-67
 *         payment_method:
 *           type: string
 *           enum: [cash, card, bank_transfer, online, other]
 *           description: Способ оплаты
 *           example: card
 *         # Для трансферных операций
 *         related_cash_desk_id:
 *           type: integer
 *           description: ID связанной кассы (для переводов)
 *           example: 2
 *         related_cash_desk_name:
 *           type: string
 *           description: Название связанной кассы
 *           example: Дополнительная касса
 *         transfer_pair_id:
 *           type: string
 *           description: UUID пары перевода
 *           example: 550e8400-e29b-41d4-a716-446655440000
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Дата создания записи
 *           example: 2024-01-15T10:30:00.000Z
 *       example:
 *         id: 123
 *         type: income
 *         amount: 25000.00
 *         description: Оплата за курс Python
 *         date: 2024-01-15
 *         status: actual
 *         category: Обучение
 *         client_name: Иван Петров
 *         client_phone: +7 (999) 123-45-67
 *         payment_method: card
 *         created_at: 2024-01-15T10:30:00.000Z
 *
 *     # ===== ЗАПРОСЫ НА СОЗДАНИЕ/ОБНОВЛЕНИЕ =====
 *     CashDeskCreateRequest:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           description: Название кассы
 *           example: Основная касса
 *         description:
 *           type: string
 *           maxLength: 500
 *           description: Описание кассы
 *           example: Основная касса для приема платежей
 *         currency:
 *           type: string
 *           enum: [RUB, USD, EUR]
 *           default: RUB
 *           description: Валюта кассы
 *           example: RUB
 *         initial_balance:
 *           type: number
 *           format: float
 *           minimum: 0
 *           default: 0
 *           description: Начальный баланс кассы
 *           example: 10000.00
 *         is_active:
 *           type: boolean
 *           default: true
 *           description: Активна ли касса
 *           example: true
 *       example:
 *         name: Основная касса
 *         description: Основная касса для приема платежей
 *         currency: RUB
 *         initial_balance: 10000.00
 *         is_active: true
 *
 *     CashDeskUpdateRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           description: Название кассы
 *         description:
 *           type: string
 *           maxLength: 500
 *           description: Описание кассы
 *         currency:
 *           type: string
 *           enum: [RUB, USD, EUR]
 *           description: Валюта кассы
 *         is_active:
 *           type: boolean
 *           description: Активна ли касса
 *       example:
 *         name: Обновленная касса
 *         description: Обновленное описание
 *         is_active: true
 *
 *     # ===== ОПЕРАЦИИ С БАЛАНСОМ =====
 *     BalanceAdjustmentRequest:
 *       type: object
 *       required:
 *         - amount
 *         - description
 *         - type
 *       properties:
 *         type:
 *           type: string
 *           enum: [add, subtract, set]
 *           description: Тип корректировки баланса
 *           example: add
 *         amount:
 *           type: number
 *           format: float
 *           minimum: 0.01
 *           description: Сумма корректировки
 *           example: 5000.00
 *         description:
 *           type: string
 *           minLength: 1
 *           maxLength: 500
 *           description: Описание корректировки
 *           example: Корректировка баланса по результатам инвентаризации
 *         date:
 *           type: string
 *           format: date
 *           description: Дата корректировки (по умолчанию текущая дата)
 *           example: 2024-01-15
 *       example:
 *         type: add
 *         amount: 5000.00
 *         description: Корректировка баланса по результатам инвентаризации
 *         date: 2024-01-15
 *
 *     # ===== ОТВЕТЫ =====
 *     CashDeskResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/CashDesk'
 *
 *     CashDeskListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CashDesk'
 *
 *     CashDeskTransactionsResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             cash_desk:
 *               $ref: '#/components/schemas/CashDesk'
 *             transactions:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CashDeskTransaction'
 *             summary:
 *               type: object
 *               properties:
 *                 total_transactions:
 *                   type: integer
 *                   description: Общее количество транзакций
 *                   example: 156
 *                 total_income:
 *                   type: number
 *                   format: float
 *                   description: Общая сумма поступлений
 *                   example: 450000.00
 *                 total_expense:
 *                   type: number
 *                   format: float
 *                   description: Общая сумма расходов
 *                   example: 120000.00
 *                 net_flow:
 *                   type: number
 *                   format: float
 *                   description: Чистый денежный поток
 *                   example: 330000.00
 *
 *     # ===== СТАТИСТИКА КАСС =====
 *     CashDeskStats:
 *       type: object
 *       properties:
 *         total_cash_desks:
 *           type: integer
 *           description: Общее количество касс
 *           example: 5
 *         active_cash_desks:
 *           type: integer
 *           description: Количество активных касс
 *           example: 4
 *         total_balance:
 *           type: number
 *           format: float
 *           description: Общий баланс всех касс
 *           example: 850000.00
 *         total_operations:
 *           type: integer
 *           description: Общее количество операций
 *           example: 1250
 *         by_currency:
 *           type: object
 *           properties:
 *             RUB:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   example: 4
 *                 total_balance:
 *                   type: number
 *                   format: float
 *                   example: 800000.00
 *             USD:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   example: 1
 *                 total_balance:
 *                   type: number
 *                   format: float
 *                   example: 50000.00
 *         top_performing:
 *           type: array
 *           description: Топ касс по обороту
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 example: 1
 *               name:
 *                 type: string
 *                 example: Основная касса
 *               turnover:
 *                 type: number
 *                 format: float
 *                 example: 500000.00
 *               operations_count:
 *                 type: integer
 *                 example: 450
 *
 *     CashDeskStatsResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/CashDeskStats'
 *
 *     # ===== СПЕЦИАЛЬНЫЕ ОТВЕТЫ =====
 *     BalanceAdjustmentResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             cash_desk:
 *               $ref: '#/components/schemas/CashDesk'
 *             adjustment:
 *               type: object
 *               properties:
 *                 type:
 *                   type: string
 *                   example: add
 *                 amount:
 *                   type: number
 *                   format: float
 *                   example: 5000.00
 *                 previous_balance:
 *                   type: number
 *                   format: float
 *                   example: 145000.50
 *                 new_balance:
 *                   type: number
 *                   format: float
 *                   example: 150000.50
 *
 *     # ===== ОШИБКИ СПЕЦИФИЧНЫЕ ДЛЯ КАСС =====
 *     CashDeskInactiveError:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           example: Касса неактивна и не может использоваться для операций
 *
 *     MainCashDeskError:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           example: Основную кассу нельзя удалить или деактивировать
 *
 *     CashDeskBalanceError:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           example: Невозможно выполнить операцию. Недостаточный баланс кассы
 */