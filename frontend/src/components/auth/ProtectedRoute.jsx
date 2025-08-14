// src/components/auth/ProtectedRoute.jsx
import { Loader2 } from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext';
import LoginForm from './LoginForm';

const ProtectedRoute = ({ children, requiredRoles = null }) => {
  const { user, loading, isAuthenticated, login, hasRole } = useAuthContext();

  // Показываем загрузку пока проверяем авторизацию
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
          <p className="text-gray-600">Проверка авторизации...</p>
        </div>
      </div>
    );
  }

  // Если не авторизован - показываем форму входа
  if (!isAuthenticated) {
    return <LoginForm onLogin={login} loading={loading} />;
  }

  // Если требуются определенные роли - проверяем их
  if (requiredRoles && !hasRole(requiredRoles)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Доступ запрещен</h2>
          <p className="text-gray-600 mb-4">
            У вас недостаточно прав для просмотра этой страницы.
          </p>
          <div className="text-sm text-gray-500">
            <p>Ваша роль: <span className="font-semibold">{user?.role}</span></p>
            <p>Требуется: <span className="font-semibold">
              {Array.isArray(requiredRoles) ? requiredRoles.join(', ') : requiredRoles}
            </span></p>
          </div>
        </div>
      </div>
    );
  }

  // Если все проверки пройдены - показываем защищенный контент
  return children;
};

export default ProtectedRoute;