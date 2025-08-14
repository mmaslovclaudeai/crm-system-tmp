// backend/middleware/validation/index.js - ОБНОВЛЕН С НОВЫМИ ВАЛИДАТОРАМИ

// Утилиты
const { validateINN } = require('./utils/validators');
const { documentsSchema, validate } = require('./utils/schemas');

// Общие схемы
const { idParamSchema, clientIdParamSchema, validateIdParam, validateClientIdParam } = require('./common/paramSchemas');
const { loginSchema, validateLogin } = require('./common/authSchemas');
const { searchSchema, validateSearch } = require('./common/searchSchemas');

// Клиенты (обновлено с новыми валидаторами)
const {
  clientSchema,
  clientUpdateSchema,
  documentsUpdateSchema,
  telegramUpdateSchema,
  curatorUpdateSchema,
  educationDataUpdateSchema,
  educationDataSchema,
  validateClient,
  validateClientUpdate,
  validateDocumentsUpdate,
  validateTelegramUpdate,
  validateCuratorUpdate,
  validateEducationDataUpdate
} = require('./clients/clientSchemas');

// Финансы
const {
  financeSchema,
  transferPairSchema,
  validateFinance,
  validateTransferPair
} = require('./finances/financeSchemas');

// Работники
const {
  workerSchema,
  workerUpdateSchema,
  validateWorker,
  validateWorkerUpdate
} = require('./workers/workerSchemas');

// Кассы
const {
  cashDeskSchema,
  validateCashDesk
} = require('./cashDesks/cashDeskSchemas');

module.exports = {
  // Утилиты
  validateINN,

  // Схемы
  clientSchema,
  clientUpdateSchema,
  documentsSchema,
  documentsUpdateSchema,
  telegramUpdateSchema,
  curatorUpdateSchema,          // 🆕 НОВАЯ СХЕМА
  educationDataUpdateSchema,    // 🆕 НОВАЯ СХЕМА
  educationDataSchema,          // 🆕 НОВАЯ СХЕМА
  financeSchema,
  transferPairSchema,
  cashDeskSchema,
  loginSchema,
  searchSchema,
  idParamSchema,
  clientIdParamSchema,
  workerSchema,
  workerUpdateSchema,

  // Middleware
  validate,
  validateClient,
  validateClientUpdate,
  validateDocumentsUpdate,
  validateTelegramUpdate,
  validateCuratorUpdate,        // 🆕 НОВЫЙ ВАЛИДАТОР
  validateEducationDataUpdate,  // 🆕 НОВЫЙ ВАЛИДАТОР
  validateFinance,
  validateTransferPair,
  validateCashDesk,
  validateLogin,
  validateSearch,
  validateIdParam,
  validateClientIdParam,
  validateWorker,
  validateWorkerUpdate
};