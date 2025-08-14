// src/components/layout/SearchBar.jsx - Обновлен с поддержкой касс
import { useState } from 'react';
import { Search, Loader2, X } from 'lucide-react';

const SearchBar = ({
  searchTerm,
  searchFilter,
  onSearchTermChange,
  onSearchFilterChange,
  onSearch,
  loading = false,
  placeholder = "Поиск...",
  filters = [
    { value: 'name', label: 'По имени' },
    { value: 'email', label: 'По email' }
  ]
}) => {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearchTermChange(localSearchTerm);
    onSearch();
  };

  const handleClearSearch = () => {
    setLocalSearchTerm('');
    onSearchTermChange('');
  };

  const handleFilterChange = (newFilter) => {
    onSearchFilterChange(newFilter);
    // Автоматически запускаем поиск при смене фильтра, если есть поисковый запрос
    if (searchTerm.trim()) {
      onSearch();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <form onSubmit={handleSearchSubmit} className="space-y-4">
        {/* Строка поиска */}
        <div className="flex space-x-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={localSearchTerm}
              onChange={(e) => setLocalSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={placeholder}
              disabled={loading}
            />
            {localSearchTerm && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                disabled={loading}
              >
                <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* Фильтр поиска */}
          <div className="w-48">
            <select
              value={searchFilter}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            >
              {filters.map(filter => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </div>

          {/* Кнопка поиска */}
          <button
            type="submit"
            disabled={loading || !localSearchTerm.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Поиск...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Найти</span>
              </>
            )}
          </button>
        </div>

        {/* Подсказки по поиску */}
        <div className="text-sm text-gray-500">
          {getSearchHint()}
        </div>
      </form>
    </div>
  );

  function getSearchHint() {
    const currentFilter = filters.find(f => f.value === searchFilter);
    const filterLabel = currentFilter ? currentFilter.label.toLowerCase() : 'выбранному критерию';

    if (searchFilter === 'active') {
      return 'Поиск среди активных касс. Оставьте поле пустым и нажмите "Найти" чтобы показать все активные кассы.';
    }

    return `Поиск ${filterLabel}. Введите запрос и нажмите Enter или кнопку "Найти".`;
  }
};

export default SearchBar;