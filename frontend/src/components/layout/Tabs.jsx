// src/components/layout/Tabs.jsx
import { Target, Users, DollarSign, Wallet, UserCheck } from 'lucide-react';
import { TABS } from '../../constants';

const Tabs = ({ activeTab, onTabChange }) => {
  return (
    <div className="mb-8">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {/* 🎯 НОВАЯ ВКЛАДКА "ЛИДЫ" - ПЕРВАЯ! */}
          <button
            onClick={() => onTabChange(TABS.LEADS)}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === TABS.LEADS
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4" />
              <span>Распределитель</span>
            </div>
          </button>

          {/* 👥 СУЩЕСТВУЮЩАЯ ВКЛАДКА "КЛИЕНТЫ" - ВТОРАЯ */}
          <button
            onClick={() => onTabChange(TABS.CLIENTS)}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === TABS.CLIENTS
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Ученики</span>
            </div>
          </button>

          {/* 💰 СУЩЕСТВУЮЩАЯ ВКЛАДКА "ФИНАНСЫ" */}
          <button
            onClick={() => onTabChange(TABS.FINANCES)}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === TABS.FINANCES
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4" />
              <span>Финансы</span>
            </div>
          </button>

          {/* 🏦 СУЩЕСТВУЮЩАЯ ВКЛАДКА "КАССЫ" */}
          <button
            onClick={() => onTabChange(TABS.CASH_DESKS)}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === TABS.CASH_DESKS
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Wallet className="w-4 h-4" />
              <span>Кассы</span>
            </div>
          </button>

          {/* 👥 НОВАЯ ВКЛАДКА "РАБОТНИКИ" */}
          <button
            onClick={() => onTabChange(TABS.WORKERS)}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === TABS.WORKERS
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <UserCheck className="w-4 h-4" />
              <span>Работники</span>
            </div>
          </button>
        </nav>
      </div>
    </div>
  );
};

export default Tabs;