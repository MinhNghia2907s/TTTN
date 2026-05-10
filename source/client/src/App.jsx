import { useEffect, useState } from 'react';
import AppRoutes from './routes/AppRoutes.jsx';
import { isAuthenticated, logout, syncCurrentSession } from './services/user/authService.js';

/**
 * Component gốc của frontend, nạp lại phiên từ backend trước khi render route để tránh tin hoàn toàn vào localStorage.
 */
function App() {
  const [isSessionReady, setIsSessionReady] = useState(!isAuthenticated());

  useEffect(() => {
    let isMounted = true;

    /**
     * Làm mới thông tin phiên từ DB khi người dùng vừa refresh trình duyệt.
     */
    async function bootstrapSession() {
      if (!isAuthenticated()) {
        if (isMounted) {
          setIsSessionReady(true);
        }

        return;
      }

      try {
        await syncCurrentSession();
      } catch (error) {
        logout();
      } finally {
        if (isMounted) {
          setIsSessionReady(true);
        }
      }
    }

    bootstrapSession();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!isSessionReady) {
    return null;
  }

  return <AppRoutes />;
}

export default App;
