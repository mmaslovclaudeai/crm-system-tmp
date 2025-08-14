// src/components/layout/FinanceSubTabs.jsx
import { CheckCircle, Clock, BarChart3 } from 'lucide-react';
import { FINANCE_TABS } from '../../constants';

const FinanceSubTabs = ({ activeSubTab, onSubTabChange, actualCount = 0, plannedCount = 0 }) => {
  return (
    <div className="mb-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => onSubTabChange(FINANCE_TABS.ACTUAL)}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeSubTab === FINANCE_TABS.ACTUAL
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>Факт</span>
              {actualCount > 0 && (
                <span className={`px-2 py-1 text-xs rounded-full ${
                  activeSubTab === FINANCE_TABS.ACTUAL 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {actualCount}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => onSubTabChange(FINANCE_TABS.PLANNED)}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeSubTab === FINANCE_TABS.PLANNED
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>План</span>
              {plannedCount > 0 && (
                <span className={`px-2 py-1 text-xs rounded-full ${
                  activeSubTab === FINANCE_TABS.PLANNED 
                    ? 'bg-orange-100 text-orange-600' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {plannedCount}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => onSubTabChange(FINANCE_TABS.STATISTICS)}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeSubTab === FINANCE_TABS.STATISTICS
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Статистика</span>
            </div>
          </button>
        </nav>
      </div>
    </div>
  );
};

export default FinanceSubTabs;