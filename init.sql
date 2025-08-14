-- 🚀 ПОЛНОСТЬЮ АКТУАЛИЗИРОВАННЫЙ init.sql

-- Создание схемы
CREATE SCHEMA IF NOT EXISTS crm;

-- 🎯 ENUM типы
CREATE TYPE crm.client_status_enum AS ENUM (
    -- Статусы приемки
    'CREATED',       -- Создан
    'DISTRIBUTION',  -- Распределение
    'GIVE_ACCESS',   -- Выдача доступов
    -- Статусы учеников
    'IN_PROGRESS',   -- Обучается
    'SEARCH_OFFER',  -- Ищет работу
    'ACCEPT_OFFER',  -- Принимает оффер
    'PAYING_OFFER',  -- Выплачивает процент
    'FINISH'         -- Закончил обучение
);

-- 👤 Таблица пользователей системы
CREATE TABLE IF NOT EXISTS crm.users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'viewer' CHECK (role IN ('admin', 'manager', 'viewer')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 👥 Таблица сотрудников/работников
CREATE TABLE IF NOT EXISTS crm.workers (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    telegram_username VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    bank VARCHAR(100),
    card_number VARCHAR(19),
    salary DECIMAL(12,2),
    hire_date DATE NOT NULL,
    fire_date DATE,
    is_active BOOLEAN DEFAULT true,
    documents JSONB DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 🎯 Таблица клиентов (лиды + клиенты) - ОБНОВЛЕННАЯ
CREATE TABLE IF NOT EXISTS crm.clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    status crm.client_status_enum DEFAULT 'CREATED',
    telegram VARCHAR(100),
    worker_id INTEGER REFERENCES crm.workers(id), -- 🆕 СВЯЗЬ С КУРАТОРОМ
    documents JSONB DEFAULT '{}',
    data JSONB DEFAULT '{}', -- 🆕 ДОПОЛНИТЕЛЬНЫЕ ДАННЫЕ
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 💰 Таблица касс
CREATE TABLE IF NOT EXISTS crm.cash_desks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    current_balance DECIMAL(15,2) DEFAULT 0.00,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 💸 Таблица финансовых операций (обновленная с новыми полями)
CREATE TABLE IF NOT EXISTS crm.finances (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('income', 'expense', 'transfer')) NOT NULL,
    status VARCHAR(20) DEFAULT 'actual' CHECK (status IN ('actual', 'planned')) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    client_id INTEGER REFERENCES crm.clients(id),
    cash_desk_id INTEGER REFERENCES crm.cash_desks(id),
    worker_id INTEGER REFERENCES crm.workers(id),
    transfer_pair_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 📝 Таблица заметок клиентов
CREATE TABLE IF NOT EXISTS crm.client_notes (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES crm.clients(id),
    author_id INTEGER NOT NULL REFERENCES crm.users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 📚 ТАБЛИЦА ИСТОРИИ СТАТУСОВ КЛИЕНТОВ
CREATE TABLE IF NOT EXISTS crm.clients_status_history (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES crm.clients(id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by INTEGER REFERENCES crm.users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reason TEXT, -- Причина изменения статуса
    notes TEXT   -- Дополнительные заметки
);

-- 🔍 ИНДЕКСЫ для оптимизации производительности

-- Индексы для users
CREATE INDEX IF NOT EXISTS idx_users_email ON crm.users(email);

-- Индексы для workers
CREATE INDEX IF NOT EXISTS idx_workers_full_name ON crm.workers(full_name);
CREATE INDEX IF NOT EXISTS idx_workers_position ON crm.workers(position);
CREATE INDEX IF NOT EXISTS idx_workers_is_active ON crm.workers(is_active);
CREATE INDEX IF NOT EXISTS idx_workers_telegram ON crm.workers(telegram_username);
CREATE INDEX IF NOT EXISTS idx_workers_email ON crm.workers(email);
CREATE INDEX IF NOT EXISTS idx_workers_hire_date ON crm.workers(hire_date);

-- Индексы для clients - ОБНОВЛЕННЫЕ
CREATE INDEX IF NOT EXISTS idx_clients_email ON crm.clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_name ON crm.clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_status ON crm.clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_telegram ON crm.clients(telegram);
CREATE INDEX IF NOT EXISTS idx_clients_worker_id ON crm.clients(worker_id); -- 🆕 ИНДЕКС ДЛЯ КУРАТОРА
CREATE INDEX IF NOT EXISTS idx_clients_documents_gin ON crm.clients USING GIN (documents);
CREATE INDEX IF NOT EXISTS idx_clients_data_gin ON crm.clients USING GIN (data); -- 🆕 ИНДЕКС ДЛЯ DATA
CREATE INDEX IF NOT EXISTS idx_clients_documents_inn ON crm.clients USING GIN ((documents->'inn'));
CREATE INDEX IF NOT EXISTS idx_clients_documents_passport ON crm.clients USING GIN ((documents->'passport'));
CREATE INDEX IF NOT EXISTS idx_clients_notes_text ON crm.clients USING GIN (to_tsvector('russian', notes));

-- Индексы для cash_desks
CREATE INDEX IF NOT EXISTS idx_cash_desks_name ON crm.cash_desks(name);
CREATE INDEX IF NOT EXISTS idx_cash_desks_active ON crm.cash_desks(is_active);

-- Индексы для finances
CREATE INDEX IF NOT EXISTS idx_finances_date ON crm.finances(date);
CREATE INDEX IF NOT EXISTS idx_finances_type ON crm.finances(type);
CREATE INDEX IF NOT EXISTS idx_finances_status ON crm.finances(status);
CREATE INDEX IF NOT EXISTS idx_finances_client_id ON crm.finances(client_id);
CREATE INDEX IF NOT EXISTS idx_finances_cash_desk_id ON crm.finances(cash_desk_id);
CREATE INDEX IF NOT EXISTS idx_finances_worker_id ON crm.finances(worker_id);
CREATE INDEX IF NOT EXISTS idx_finances_transfer_pair_id ON crm.finances(transfer_pair_id);

-- Индексы для client_notes
CREATE INDEX IF NOT EXISTS idx_client_notes_client_id ON crm.client_notes(client_id);
CREATE INDEX IF NOT EXISTS idx_client_notes_author_id ON crm.client_notes(author_id);
CREATE INDEX IF NOT EXISTS idx_client_notes_created_at ON crm.client_notes(created_at);

-- Индексы для clients_status_history
CREATE INDEX IF NOT EXISTS idx_clients_status_history_client_id ON crm.clients_status_history(client_id);
CREATE INDEX IF NOT EXISTS idx_clients_status_history_changed_at ON crm.clients_status_history(changed_at);
CREATE INDEX IF NOT EXISTS idx_clients_status_history_new_status ON crm.clients_status_history(new_status);

-- ⚡ ТРИГГЕРЫ для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION crm.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры для всех таблиц
CREATE OR REPLACE TRIGGER update_users_modtime
    BEFORE UPDATE ON crm.users
    FOR EACH ROW EXECUTE FUNCTION crm.update_modified_column();

CREATE OR REPLACE TRIGGER update_workers_modtime
    BEFORE UPDATE ON crm.workers
    FOR EACH ROW EXECUTE FUNCTION crm.update_modified_column();

CREATE OR REPLACE TRIGGER update_clients_modtime
    BEFORE UPDATE ON crm.clients
    FOR EACH ROW EXECUTE FUNCTION crm.update_modified_column();

CREATE OR REPLACE TRIGGER update_cash_desks_modtime
    BEFORE UPDATE ON crm.cash_desks
    FOR EACH ROW EXECUTE FUNCTION crm.update_modified_column();

CREATE OR REPLACE TRIGGER update_finances_modtime
    BEFORE UPDATE ON crm.finances
    FOR EACH ROW EXECUTE FUNCTION crm.update_modified_column();

CREATE OR REPLACE TRIGGER update_client_notes_modtime
    BEFORE UPDATE ON crm.client_notes
    FOR EACH ROW EXECUTE FUNCTION crm.update_modified_column();

-- Триггер для clients_status_history
CREATE OR REPLACE FUNCTION crm.log_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Логируем только если статус действительно изменился
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO crm.clients_status_history (
            client_id,
            old_status,
            new_status,
            reason
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            'Изменение статуса'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Применяем триггер к таблице клиентов
CREATE OR REPLACE TRIGGER trigger_log_status_change
    AFTER UPDATE ON crm.clients
    FOR EACH ROW EXECUTE FUNCTION crm.log_status_change();

-- 📊 ПРЕДСТАВЛЕНИЯ (VIEWS) для аналитики

-- Представление лидов
CREATE OR REPLACE VIEW crm.leads_view AS
SELECT
    c.*,
    w.full_name as curator_name,
    w.position as curator_position,
    CASE
        WHEN c.status = 'CREATED' THEN 'Создан'
        WHEN c.status = 'DISTRIBUTION' THEN 'Распределение'
        WHEN c.status = 'GIVE_ACCESS' THEN 'Выдача доступов'
        ELSE 'Неизвестный статус'
    END as status_name
FROM crm.clients c
LEFT JOIN crm.workers w ON c.worker_id = w.id
WHERE c.status IN ('CREATED', 'DISTRIBUTION', 'GIVE_ACCESS');

-- Представление клиентов
CREATE OR REPLACE VIEW crm.clients_view AS
SELECT
    c.*,
    w.full_name as curator_name,
    w.position as curator_position,
    CASE
        WHEN c.status = 'IN_PROGRESS' THEN 'Обучается'
        WHEN c.status = 'SEARCH_OFFER' THEN 'Ищет работу'
        WHEN c.status = 'ACCEPT_OFFER' THEN 'Принимает оффер'
        WHEN c.status = 'PAYING_OFFER' THEN 'Выплачивает процент'
        WHEN c.status = 'FINISH' THEN 'Закончил обучение'
        ELSE 'Неизвестный статус'
    END as status_name
FROM crm.clients c
LEFT JOIN crm.workers w ON c.worker_id = w.id
WHERE c.status IN ('IN_PROGRESS', 'SEARCH_OFFER', 'ACCEPT_OFFER', 'PAYING_OFFER', 'FINISH');

-- Сводка по клиентам с финансами - ОБНОВЛЕННАЯ
CREATE OR REPLACE VIEW crm.client_summary AS
SELECT
    c.id,
    c.name,
    c.email,
    c.phone,
    c.telegram,
    c.worker_id, -- 🆕 ID куратора
    w.full_name as curator_name, -- 🆕 Имя куратора
    w.position as curator_position, -- 🆕 Должность куратора
    c.documents,
    c.data, -- 🆕 Дополнительные данные
    c.status,
    CASE
        WHEN c.status = 'CREATED' THEN 'Создан'
        WHEN c.status = 'DISTRIBUTION' THEN 'Распределение'
        WHEN c.status = 'GIVE_ACCESS' THEN 'Выдача доступов'
        WHEN c.status = 'IN_PROGRESS' THEN 'Обучается'
        WHEN c.status = 'SEARCH_OFFER' THEN 'Ищет работу'
        WHEN c.status = 'ACCEPT_OFFER' THEN 'Принимает оффер'
        WHEN c.status = 'PAYING_OFFER' THEN 'Выплачивает процент'
        WHEN c.status = 'FINISH' THEN 'Закончил обучение'
        ELSE 'Неизвестный статус'
    END as status_name,
    CASE
        WHEN c.status IN ('CREATED', 'DISTRIBUTION', 'GIVE_ACCESS') THEN 'lead'
        WHEN c.status IN ('IN_PROGRESS', 'SEARCH_OFFER', 'ACCEPT_OFFER', 'PAYING_OFFER', 'FINISH') THEN 'client'
        ELSE 'unknown'
    END as record_type,
    COUNT(f.id) as transactions_count,
    COALESCE(SUM(CASE WHEN f.type = 'income' THEN f.amount ELSE 0 END), 0) as total_income,
    COALESCE(SUM(CASE WHEN f.type = 'expense' THEN f.amount ELSE 0 END), 0) as total_expense,
    COALESCE(SUM(f.amount), 0) as net_amount,
    c.created_at,
    c.updated_at
FROM crm.clients c
LEFT JOIN crm.workers w ON c.worker_id = w.id
LEFT JOIN crm.finances f ON c.id = f.client_id
GROUP BY c.id, c.name, c.email, c.phone, c.telegram, c.worker_id, w.full_name, w.position, c.documents, c.data, c.status, c.created_at, c.updated_at;

-- Сводка по финансам
CREATE OR REPLACE VIEW crm.finance_summary AS
SELECT
    DATE_TRUNC('month', date) as month,
    status,
    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as monthly_income,
    SUM(CASE WHEN type = 'expense' THEN ABS(amount) ELSE 0 END) as monthly_expense,
    SUM(amount) as monthly_net
FROM crm.finances
GROUP BY DATE_TRUNC('month', date), status
ORDER BY month DESC, status;

-- Сводка по кассам
CREATE OR REPLACE VIEW crm.cash_desk_summary AS
SELECT
    cd.id,
    cd.name,
    cd.current_balance,
    cd.description,
    cd.is_active,
    COUNT(f.id) as transactions_count,
    COALESCE(SUM(CASE WHEN f.type = 'income' THEN f.amount ELSE 0 END), 0) as total_income,
    COALESCE(SUM(CASE WHEN f.type = 'expense' THEN f.amount ELSE 0 END), 0) as total_expense,
    COALESCE(SUM(f.amount), 0) as calculated_balance,
    cd.created_at,
    cd.updated_at
FROM crm.cash_desks cd
LEFT JOIN crm.finances f ON cd.id = f.cash_desk_id AND f.status = 'actual'
GROUP BY cd.id, cd.name, cd.current_balance, cd.description, cd.is_active, cd.created_at, cd.updated_at;

-- Статистика воронки лидов
CREATE OR REPLACE VIEW crm.lead_funnel_stats AS
SELECT
    status,
    CASE
        WHEN status = 'CREATED' THEN 'Создан'
        WHEN status = 'DISTRIBUTION' THEN 'Распределение'
        WHEN status = 'GIVE_ACCESS' THEN 'Выдача доступов'
        ELSE 'Неизвестный статус'
    END as status_name,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM crm.clients
WHERE status IN ('CREATED', 'DISTRIBUTION', 'GIVE_ACCESS')
GROUP BY status
ORDER BY
    CASE status
        WHEN 'CREATED' THEN 1
        WHEN 'DISTRIBUTION' THEN 2
        WHEN 'GIVE_ACCESS' THEN 3
        ELSE 4
    END;

-- Общая статистика записей
CREATE OR REPLACE VIEW crm.records_stats AS
SELECT
    'leads' as type,
    COUNT(*) as count,
    COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_this_month
FROM crm.clients
WHERE status IN ('CREATED', 'DISTRIBUTION', 'GIVE_ACCESS')
UNION ALL
SELECT
    'clients' as type,
    COUNT(*) as count,
    COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_this_month
FROM crm.clients
WHERE status IN ('IN_PROGRESS', 'SEARCH_OFFER', 'ACCEPT_OFFER', 'PAYING_OFFER', 'FINISH');

-- Статистика заполненности документов
CREATE OR REPLACE VIEW crm.documents_completeness AS
SELECT
    id,
    name,
    email,
    status,
    CASE WHEN documents ? 'inn' THEN 1 ELSE 0 END as has_inn,
    CASE WHEN documents ? 'passport' THEN 1 ELSE 0 END as has_passport,
    CASE WHEN documents ? 'snils' THEN 1 ELSE 0 END as has_snils,
    CASE WHEN documents ? 'diploma' THEN 1 ELSE 0 END as has_diploma,
    (CASE WHEN documents ? 'inn' THEN 1 ELSE 0 END +
     CASE WHEN documents ? 'passport' THEN 1 ELSE 0 END +
     CASE WHEN documents ? 'snils' THEN 1 ELSE 0 END +
     CASE WHEN documents ? 'diploma' THEN 1 ELSE 0 END) as completeness_score
FROM crm.clients;

-- 🎯 НАЧАЛЬНЫЕ ДАННЫЕ

-- Создание администратора по умолчанию
INSERT INTO crm.users (email, password_hash, name, role, is_active)
VALUES (
    'admin@crm.local',
    '$2b$12$R.xLDrE8QrH1894FJiEsz.ciD7Hf35T8BTIZsM/b5nrUSuWNRExse', -- пароль: admin123
    'Администратор',
    'admin',
    true
) ON CONFLICT (email) DO NOTHING;

-- Создание тестовой кассы
INSERT INTO crm.cash_desks (name, description, current_balance, is_active)
VALUES
    ('Основная касса', 'Главная касса для операций', 0.00, true),
    ('Расчетный счет', 'Банковский расчетный счет', 0.00, true)
ON CONFLICT DO NOTHING;