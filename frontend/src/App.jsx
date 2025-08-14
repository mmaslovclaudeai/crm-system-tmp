// src/App.jsx - ИСПРАВЛЕННАЯ ВЕРСИЯ С ПРАВИЛЬНЫМИ ПРОПСАМИ ДЛЯ KANBANBOARD
import { useState, useEffect } from 'react';

// Контекст и провайдеры
import { AuthProvider } from './context/AuthContext';

// Константы
import { TABS, FINANCE_TABS, STATUS_GROUPS } from './constants';

// Кастомные хуки
import { useToast } from './hooks/useToast';
import { useClients } from './hooks/useClients';
import { useFinances } from './hooks/useFinances';
import { useCashDesks } from './hooks/useCashDesks';
import { useWorkers } from './hooks/useWorkers';


// Layout компоненты
import Header from './components/layout/Header';
import Tabs from './components/layout/Tabs';
import SearchBar from './components/layout/SearchBar';

// UI компоненты
import Toast from './components/ui/Toast';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Таблицы и Kanban
import ClientsTable from './components/tables/ClientsTable';
import FinancesTable from './components/tables/FinancesTable';
import CashDesksTable from './components/tables/CashDesksTable';
import KanbanBoard from './components/kanban/KanbanBoard';
import WorkersTable from './components/tables/WorkersTable';

// Модальные окна
import AddClientModal from './components/modals/AddClientModal';
import EditClientModal from './components/modals/EditClientModal';
import AddFinanceModal from './components/modals/AddFinanceModal';
import EditFinanceModal from './components/modals/EditFinanceModal';
import AddCashDeskModal from './components/modals/AddCashDeskModal';
import EditCashDeskModal from './components/modals/EditCashDeskModal';
import CashDeskTransactionsModal from './components/modals/CashDeskTransactionsModal';
import AddWorkerModal from './components/modals/AddWorkerModal';
import ClientFilterModal from './components/modals/ClientFilterModal';


// Карточка клиента
import ClientCard from './components/ClientCard';
import WorkerCard from './components/WorkerCard';


// CRM форма
import CrmForm from './components/CrmForm';

// Утилиты
import { getRecordTypeName } from './utils/statusUtils';



// Простой роутер, который работает с URL
const useSimpleRouter = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  const getParams = () => {
    const pathParts = currentPath.split('/');
    if (pathParts[1] === 'client' && pathParts[2]) {
      return { clientId: pathParts[2] };
    }

    // 👥 ДОБАВИТЬ ПОДДЕРЖКУ РАБОТНИКОВ
    if (pathParts[1] === 'worker' && pathParts[2]) {
      return { workerId: pathParts[2] };
    }
    return {};
  };

  return {
    currentPath,
    navigate,
    getParams
  };
};

// Главный компонент CRM
const CRMContent = () => {
  const { currentPath, navigate, getParams } = useSimpleRouter();
  const { clientId, workerId } = getParams();

  // Определяем текущий режим на основе URL
  const getCurrentView = () => {
    if (currentPath.startsWith('/client/')) {
      return 'client-card';
    }
    // 👥 ДОБАВИТЬ ПОДДЕРЖКУ КАРТОЧКИ РАБОТНИКА
    if (currentPath.startsWith('/worker/')) {
      return 'worker-card';
    }
    return 'dashboard';
  };

  // Определяем активную вкладку
  const getCurrentTab = () => {
    if (currentPath === '/crm-form') {
      return 'CRM_FORM';
    }
    if (currentPath === '/leads') {
      return TABS.LEADS;
    }
    if (currentPath === '/finances') {
      return TABS.FINANCES;
    }
    if (currentPath === '/cash-desks') {
      return TABS.CASH_DESKS;
    }
    // 👥 ДОБАВИТЬ ПОДДЕРЖКУ ВКЛАДКИ РАБОТНИКОВ
    if (currentPath === '/workers') {
      return TABS.WORKERS;
    }
    if (currentPath === '/' || currentPath === '/clients') {
      return TABS.CLIENTS;
    }
    return TABS.LEADS;
  };

  // Основные состояния
  const [activeTab, setActiveTab] = useState(getCurrentTab());
  const [activeFinanceSubTab, setActiveFinanceSubTab] = useState(FINANCE_TABS.ACTUAL);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFilter, setSearchFilter] = useState('name');

  // 🆕 НОВОЕ: Состояние для поиска в Kanban
  const [kanbanSearchTerm, setKanbanSearchTerm] = useState('');

  const currentView = getCurrentView();

  // Модальные окна
  const [modals, setModals] = useState({
    addClient: false,
    editClient: false,
    addFinance: false,
    editFinance: false,
    addCashDesk: false,
    editCashDesk: false,
    viewCashDeskTransactions: false,
    addWorker: false

  });

  // Редактируемые элементы
  const [editingClient, setEditingClient] = useState(null);
  const [editingFinance, setEditingFinance] = useState(null);
  const [editingCashDesk, setEditingCashDesk] = useState(null);
  const [viewingCashDesk, setViewingCashDesk] = useState(null);
  const [editingWorker, setEditingWorker] = useState(null);


  // Кастомные хуки
  const { toast, showSuccess, showError, hideToast } = useToast();
  const clientsHook = useClients();
  const financesHook = useFinances();
  const cashDesksHook = useCashDesks();
  const workersHook = useWorkers();


  // Синхронизация активной вкладки с URL
  useEffect(() => {
    const newTab = getCurrentTab();
    if (newTab !== activeTab) {
      setActiveTab(newTab);

      // 🔧 АВТОЗАГРУЗКА: При изменении URL тоже загружаем данные
      setTimeout(() => {
        switch (newTab) {
          case TABS.LEADS:
            clientsHook.searchLeads('');
            break;
          case TABS.CLIENTS:
            clientsHook.searchActiveClients('');
            break;
          case TABS.FINANCES:
            financesHook.loadAllFinances();
            // 🔄 Также загружаем список касс для фильтрации по кассе на вкладке финансов
            cashDesksHook.searchCashDesks('');
            break;
          case TABS.CASH_DESKS:
            cashDesksHook.searchCashDesks('');
            break;
          case TABS.WORKERS:
            workersHook.searchAllWorkers('');
            break;
        }
      }, 100);
    }
  }, [currentPath, activeTab]);

  // 🔧 АВТОЗАГРУЗКА: При первой загрузке приложения
  useEffect(() => {
    // Загружаем данные для текущей вкладки при инициализации
    const currentTab = getCurrentTab();
    setTimeout(() => {
      switch (currentTab) {
        case TABS.LEADS:
          if (clientsHook.clients.length === 0) {
            clientsHook.searchLeads('');
          }
          break;
        case TABS.CLIENTS:
          if (clientsHook.clients.length === 0) {
            clientsHook.searchActiveClients('');
          }
          break;
        case TABS.FINANCES:
          if (financesHook.finances.length === 0) {
            financesHook.loadAllFinances();
          }
          break;
        case TABS.CASH_DESKS:
          if (cashDesksHook.cashDesks.length === 0) {
            cashDesksHook.searchCashDesks('');
          }
          break;
        case TABS.WORKERS:
          if (workersHook.workers.length === 0) {
            workersHook.searchAllWorkers('');
          }
          break;
      }
    }, 500); // Даем время на инициализацию хуков
  }, []);

  // Обработчики модальных окон
  const openModal = (modalName, data = null) => {
    setModals(prev => ({ ...prev, [modalName]: true }));

    switch (modalName) {
      case 'editClient':
        setEditingClient(data);
        break;
      case 'editFinance':
        setEditingFinance(data);
        break;
      case 'editCashDesk':
        setEditingCashDesk(data);
        break;
      case 'viewCashDeskTransactions':
        setViewingCashDesk(data);
        break;
    }
  };

  const closeModal = (modalName) => {
    setModals(prev => ({ ...prev, [modalName]: false }));

    // Очищаем состояние редактирования
    switch (modalName) {
      case 'editClient':
        setEditingClient(null);
        break;
      case 'editFinance':
        setEditingFinance(null);
        break;
      case 'editCashDesk':
        setEditingCashDesk(null);
        break;
      case 'viewCashDeskTransactions':
        setViewingCashDesk(null);
        break;
    }
  };

  // Обработчики вкладок
  const handleTabChange = (tab) => {
    setActiveTab(tab);

    // Сбрасываем поиск при смене вкладки
    setSearchTerm('');
    setKanbanSearchTerm('');
    setSearchFilter('name'); // Сбрасываем фильтр тоже

    switch (tab) {
      case TABS.LEADS:
        navigate('/leads');
        // 🔧 АВТОЗАГРУЗКА: Загружаем лидов при переключении на вкладку
        setTimeout(() => {
          clientsHook.searchLeads(''); // Загружаем всех лидов
        }, 100);
        break;
      case TABS.CLIENTS:
        navigate('/clients');
        // 🔧 АВТОЗАГРУЗКА: Загружаем клиентов при переключении на вкладку
        setTimeout(() => {
          clientsHook.searchActiveClients(''); // Загружаем всех активных клиентов
        }, 100);
        break;
        case TABS.FINANCES:
          navigate('/finances');
          // ✅ Автозагрузка данных за текущий месяц при первом переходе
          setTimeout(() => {
            // Проверяем, есть ли уже данные или фильтры
            const currentFilters = financesHook.getCurrentFilters();

            if (!currentFilters.date_from && !currentFilters.date_to && financesHook.finances.length === 0) {
              // Если фильтров нет и данных нет - загружаем текущий месяц
              financesHook.loadCurrentMonthFinances();
            } else if (financesHook.finances.length === 0) {
              // Если есть фильтры но нет данных - применяем фильтры
              financesHook.applyFilters();
            }
            // Если данные уже есть - ничего не делаем
          }, 100);
          // 🔄 Также загружаем список касс для фильтрации по кассе на вкладке финансов
          setTimeout(() => {
            cashDesksHook.searchCashDesks('');
          }, 150);
          break;
      case TABS.CASH_DESKS:
        navigate('/cash-desks');
        // 🔧 АВТОЗАГРУЗКА: Загружаем кассы при переключении на вкладку
        setTimeout(() => {
          cashDesksHook.searchCashDesks(''); // Загружаем все кассы
        }, 100);
        break;
      case TABS.WORKERS:
        navigate('/workers');
        setTimeout(() => {
          workersHook.searchAllWorkers('');
        }, 100);

        break;
      default:
        navigate('/');
    }
  };

  const handleFinanceSubTabChange = (newSubTab) => {
    setActiveFinanceSubTab(newSubTab);

    // Переключаем статус в хуке и применяем соответствующие фильтры
    if (newSubTab === FINANCE_TABS.STATISTICS) {
      // Для вкладки статистики загружаем все данные
      financesHook.loadAllFinances();
    } else {
      const status = newSubTab === FINANCE_TABS.ACTUAL ? 'actual' : 'planned';
      financesHook.switchStatus(status);
    }
  };



  // 👥 ОБРАБОТЧИКИ РАБОТНИКОВ
  const handleCreateWorker = async (workerData) => {
    try {
      await workersHook.createWorker(workerData);
      showSuccess('Работник успешно создан');
    } catch (error) {
      showError('Ошибка создания работника: ' + error.message);
    }
  };

  const handleEditWorker = (worker) => {
    navigate(`/worker/${worker.id}`);
  };

  const handleDeleteWorker = async (workerId) => {
    try {
      await workersHook.deleteWorker(workerId);
      showSuccess('Работник успешно удален');
    } catch (error) {
      showError('Ошибка удаления работника: ' + error.message);
    }
  };

  const handleViewWorkerStats = (worker) => {
    navigate(`/worker/${worker.id}`);
  };

  const handleViewWorkerFinances = (worker) => {
    // TODO: Реализовать модальное окно с финансами работника
    navigate(`/worker/${worker.id}`);
  };

  // Обработчики поиска
  const handleSearch = async () => {
    try {
      switch (activeTab) {
        case TABS.LEADS:
          await clientsHook.searchLeads(searchTerm, searchFilter);
          break;
        case TABS.CLIENTS:
          await clientsHook.searchActiveClients(searchTerm, searchFilter);
          break;
        case TABS.FINANCES:
          await financesHook.searchFinances(searchTerm);
          break;
        case TABS.CASH_DESKS:
          await cashDesksHook.searchCashDesks(searchTerm);
          break;
      }
    } catch (error) {
      showError('Ошибка поиска: ' + error.message);
    }
  };

  const handleKanbanSearch = async () => {
    try {
      await clientsHook.searchLeads(kanbanSearchTerm, searchFilter);
    } catch (error) {
      showError('Ошибка поиска в Kanban: ' + error.message);
    }
  };

  // CRUD операции для клиентов
  const handleCreateClient = async (clientData) => {
    try {
      await clientsHook.createClient(clientData);
      closeModal('addClient');
      showSuccess('Клиент успешно создан');
    } catch (error) {
      showError('Ошибка создания клиента: ' + error.message);
    }
  };

  const handleUpdateClient = async (id, clientData) => {
    try {
      await clientsHook.updateClient(id, clientData);
      closeModal('editClient');
      showSuccess('Клиент успешно обновлен');
    } catch (error) {
      showError('Ошибка обновления клиента: ' + error.message);
    }
  };

  const handleDeleteClient = async (id) => {
    if (!confirm('Вы уверены, что хотите удалить этого клиента?')) return;

    try {
      await clientsHook.deleteClient(id);
      showSuccess('Клиент успешно удален');
    } catch (error) {
      showError('Ошибка удаления клиента: ' + error.message);
    }
  };

  // CRUD операции для финансов
  const handleCreateFinance = async (financeData) => {
    try {
      if (financeData.isTransfer) {
        // 🆕 НОВАЯ ЛОГИКА: Используем специальный эндпоинт для transfer пар
        console.log('🔄 Создание перевода между кассами через новый API:', financeData);

        // Формируем данные для нового API эндпоинта /api/finances/transfer
        const transferData = {
          amount: Math.abs(Number(financeData.amount)),
          cash_desk_from_id: Number(financeData.cashDeskFromId),
          cash_desk_to_id: Number(financeData.cashDeskToId),
          date: financeData.date,
          description: financeData.description || 'Перевод между кассами'
        };

        console.log('📤 Отправляемые данные для transfer API:', transferData);

        // Вызываем новый метод финансового сервиса
        await financesHook.createTransfer(transferData);

        showSuccess('Перевод между кассами успешно выполнен');
      } else {
        // 💰 Обычная финансовая операция или зарплата
        console.log('💰 Создание финансовой операции:', financeData);
        await financesHook.createFinance(financeData);

        if (financeData.employee) {
          showSuccess('Зарплата успешно выплачена');
        } else {
          showSuccess('Операция успешно создана');
        }
      }

      // Закрываем модальное окно после успешного создания
      closeModal('addFinance');
    } catch (error) {
      console.error('❌ Ошибка создания операции:', error);
      showError('Ошибка создания операции: ' + error.message);
    }
  };

  const handleUpdateFinance = async (financeData) => {
    try {
      console.log('🔄 Обновление финансовой операции:', financeData);

      // Извлекаем ID из editingFinance
      const financeId = editingFinance?.id;
      if (!financeId) {
        throw new Error('ID операции не найден');
      }

      // ✅ ИСПРАВЛЕНИЕ: Сохраняем ВСЕ данные из financeData как есть
      const apiData = {
        date: financeData.date,
        amount: Math.abs(Number(financeData.amount)),
        type: financeData.type,
        status: financeData.status,
        description: financeData.description || '',
        category: financeData.category,
        cash_desk_id: financeData.cash_desk_id,
        client_id: financeData.client_id, // ✅ Берем как есть, без fallback на null
        worker_id: financeData.worker_id  // ✅ Добавляем поддержку worker_id
      };

      // 🔧 ОТЛАДКА: Удаляем undefined поля чтобы не отправлять их в API
      Object.keys(apiData).forEach(key => {
        if (apiData[key] === undefined) {
          delete apiData[key];
        }
      });

      console.log('📤 Отправляем данные в API:', apiData);

      await financesHook.updateFinance(financeId, apiData);
      closeModal('editFinance');
      showSuccess('Операция успешно обновлена');
    } catch (error) {
      console.error('❌ Ошибка обновления операции:', error);
      showError('Ошибка обновления операции: ' + error.message);
    }
  };

  const handleEditFinance = (finance) => {
    console.log('📝 Редактирование финансовой операции:', finance);
    openModal('editFinance', finance);
  };

  const handleDeleteFinance = async (id) => {
    if (!confirm('Вы уверены, что хотите удалить эту операцию?')) return;

    try {
      await financesHook.deleteFinance(id);
      showSuccess('Операция успешно удалена');
    } catch (error) {
      console.error('❌ Ошибка удаления операции:', error);
      showError('Ошибка удаления операции: ' + error.message);
    }
  };

  // CRUD операции для касс
  const handleCreateCashDesk = async (cashDeskData) => {
    try {
      await cashDesksHook.createCashDesk(cashDeskData);
      closeModal('addCashDesk');
      showSuccess('Касса успешно создана');
    } catch (error) {
      showError('Ошибка создания кассы: ' + error.message);
    }
  };

  const handleUpdateCashDesk = async (cashDeskData) => {
    try {
      // 🔧 ИСПРАВЛЕНИЕ: Извлекаем ID из editingCashDesk
      const cashDeskId = editingCashDesk?.id;
      if (!cashDeskId) {
        throw new Error('ID кассы не найден');
      }

      await cashDesksHook.updateCashDesk(cashDeskId, cashDeskData);
      closeModal('editCashDesk');
      showSuccess('Касса успешно обновлена');
    } catch (error) {
      showError('Ошибка обновления кассы: ' + error.message);
    }
  };

  const handleDeleteCashDesk = async (id) => {
    if (!confirm('Вы уверены, что хотите удалить эту кассу??')) return;

    try {
      await cashDesksHook.deleteCashDesk(id);
      showSuccess('Касса успешно удалена');
    } catch (error) {
      showError('Ошибка удаления кассы: ' + error.message);
    }
  };

  // Обработчик изменения статуса клиента (для Kanban)
  const handleClientStatusChange = async (clientId, newStatus) => {
    try {
      await clientsHook.updateClientStatus(clientId, newStatus);
      showSuccess('Статус клиента обновлен');
    } catch (error) {
      showError('Ошибка обновления статуса: ' + error.message);
    }
  };

  // Рендеринг контента в зависимости от текущего режима
  const renderContent = () => {
    // Карточка работника
    if (currentView === 'worker-card' && workerId) {
      return (
        <WorkerCard
          workerId={parseInt(workerId)}
          onBack={() => navigate('/workers')}
          onEdit={handleEditWorker}
          onDelete={handleDeleteWorker}
          onError={showError}
          onSuccess={showSuccess}
          workersService={workersHook} // Передаем сервис
          financesService={financesHook} // Передаем сервис
        />
      );
    }

        // Карточка клиента
  if (currentView === 'client-card') {
    return (
        <ClientCard
            clientId={clientId}
            onBack={() => navigate('/')}
            onEdit={(client) => openModal('editClient', client)}
            onDelete={handleDeleteClient}
            onError={showError}
            onSuccess={showSuccess}
        />
    );
  }

    // Отдельная страница для CRM формы
    if (activeTab === 'CRM_FORM') {
      return <CrmForm />;
    }

    return (
        <>
          <Header/>

          <div className="container mx-auto px-4 py-6">
            {/* Табы */}
            <Tabs
                activeTab={activeTab}
                onTabChange={handleTabChange}
            />

            {/* Поиск */}


            {/* Основной контент */}
            {activeTab === TABS.LEADS && (
                <KanbanBoard
                  leads={clientsHook.clients}
                  loading={clientsHook.loading}
                  onUpdateStatus={handleClientStatusChange}
                  onCardClick={(client) => window.open(`/client/${client.id}`, '_blank')}
                  onAddLead={() => openModal('addClient')}
                  searchTerm={kanbanSearchTerm}
                  onSearch={setKanbanSearchTerm}
                />
            )}

            {activeTab === TABS.CLIENTS && (
                <ClientsTable
                  clients={clientsHook.clients}
                  loading={clientsHook.loading}
                  showResults={true}
                  onEditClient={(client) => openModal('editClient', client)}
                  onDeleteClient={handleDeleteClient}
                  onAddClient={() => openModal('addClient')}
                />
            )}

            {activeTab === TABS.FINANCES && (
              <FinancesTable
                finances={financesHook.finances}
                clients={clientsHook.clients}
                cashDesks={cashDesksHook.cashDesks}
                workers={workersHook.workers}
                financeSummary={financesHook.financeSummary}
                loading={financesHook.loading}
                onAddFinance={() => openModal('addFinance')}
                onEditFinance={handleEditFinance}
                onDeleteFinance={handleDeleteFinance}
                onError={showError}
                activeSubTab={activeFinanceSubTab}
                onSubTabChange={handleFinanceSubTabChange}
                onApplyFilters={financesHook.applyFilters}
              />
            )}

            {activeTab === TABS.CASH_DESKS && (
                <CashDesksTable
                    cashDesks={cashDesksHook.cashDesks}
                    loading={cashDesksHook.loading}
                    showResults={cashDesksHook.showResults}
                    onEditCashDesk={(cashDesk) => openModal('editCashDesk', cashDesk)}
                    onDeleteCashDesk={handleDeleteCashDesk}
                    onAddCashDesk={() => openModal('addCashDesk')}
                    onViewTransactions={(cashDesk) => openModal('viewCashDeskTransactions', cashDesk)}
                />
            )}

            {activeTab === TABS.WORKERS && (
              <>
                <div className="mb-6">
                  <SearchBar
                    searchTerm={searchTerm}
                    onSearchChange={(term) => {
                      setSearchTerm(term);
                      workersHook.searchAllWorkers(term);
                    }}
                    placeholder="Поиск работников..."
                  />
                </div>

                <WorkersTable
                  workers={workersHook.workers}
                  loading={workersHook.loading}
                  searchTerm={searchTerm}
                  onSearchChange={(term) => {
                    setSearchTerm(term);
                    workersHook.searchAllWorkers(term);
                  }}
                  onAddWorker={() => openModal('addWorker')}
                  onEditWorker={handleEditWorker}
                  onDeleteWorker={handleDeleteWorker}
                  onViewWorkerStats={handleViewWorkerStats}
                  onViewWorkerFinances={handleViewWorkerFinances}
                />
              </>
            )}

          </div>

          {/* Модальные окна */}
          <AddClientModal
              isOpen={modals.addClient}
              onClose={() => closeModal('addClient')}
              onSuccess={handleCreateClient}
              onError={showError}
              context={activeTab === TABS.LEADS ? STATUS_GROUPS.LEADS : STATUS_GROUPS.CLIENTS}
          />

          <EditClientModal
              isOpen={modals.editClient}
              client={editingClient}
              onClose={() => closeModal('editClient')}
              onSuccess={handleUpdateClient}
              onError={showError}
          />

          <AddFinanceModal
            isOpen={modals.addFinance}
            onClose={() => closeModal('addFinance')}
            onSuccess={handleCreateFinance}
            onError={showError}
          />

          <EditFinanceModal
              isOpen={modals.editFinance}
              finance={editingFinance}
              onClose={() => closeModal('editFinance')}
              onSuccess={handleUpdateFinance}
              onError={showError}
          />

          <AddCashDeskModal
              isOpen={modals.addCashDesk}
              onClose={() => closeModal('addCashDesk')}
              onSuccess={handleCreateCashDesk}
              onError={showError}
          />

          <EditCashDeskModal
              isOpen={modals.editCashDesk}
              cashDesk={editingCashDesk}
              onClose={() => closeModal('editCashDesk')}
              onSuccess={handleUpdateCashDesk}
              onError={showError}
          />

          <CashDeskTransactionsModal
              isOpen={modals.viewCashDeskTransactions}
              cashDesk={viewingCashDesk}
              onClose={() => closeModal('viewCashDeskTransactions')}
          />

          {/* 👥 МОДАЛЬНОЕ ОКНО РАБОТНИКОВ */}
          <AddWorkerModal
            isOpen={modals.addWorker}
            onClose={() => closeModal('addWorker')}
            onSubmit={handleCreateWorker}
            loading={workersHook.loading}
          />

          <Toast
            message={toast.message}
            type={toast.type}
            isVisible={toast.isVisible}
            onClose={hideToast}
          />
        </>
    );
  }
  return renderContent();
};

// Главное приложение с провайдерами
function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <ProtectedRoute>
          <CRMContent />
        </ProtectedRoute>
      </div>
    </AuthProvider>
  );
}

export default App;
