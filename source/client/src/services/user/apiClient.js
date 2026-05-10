import {
  clearStoredAuth,
  getAccessToken,
  getRefreshToken,
  updateStoredTokens,
} from './authStorage.js';

const apiBaseUrl = __API_BASE_URL__;

/**
 * Gọi endpoint refresh token để xin lại cặp token mới khi access token đã hết hạn.
 */
async function refreshSession() {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    throw new Error('Không còn refresh token để làm mới phiên đăng nhập.');
  }

  const response = await fetch(`${apiBaseUrl}/auth/refresh`, {
    body: JSON.stringify({ refreshToken }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  const responseData = await response.json().catch(() => ({
    message: 'Không đọc được phản hồi từ server.',
    success: false,
  }));

  if (!response.ok || responseData.success === false) {
    throw new Error(responseData.message || 'Không thể làm mới phiên đăng nhập.');
  }

  updateStoredTokens(responseData.data);
  return responseData.data;
}

/**
 * Gọi API backend theo một format thống nhất và tự động gắn token nếu có.
 */
export async function apiRequest(path, options = {}) {
  const { skipAuthRefresh = false, ...requestOptions } = options;
  const token = getAccessToken();
  const headers = new Headers(requestOptions.headers || {});

  // FormData cần để browser tự gắn multipart boundary; nếu set JSON thủ công thì upload file sẽ hỏng.
  if (!headers.has('Content-Type') && requestOptions.body && !(requestOptions.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...requestOptions,
    headers,
  });

  const responseData = await response.json().catch(() => ({
    message: 'Không đọc được phản hồi từ server.',
    success: false,
  }));

  if (response.status === 401 && !skipAuthRefresh && path !== '/auth/refresh') {
    try {
      await refreshSession();

      return apiRequest(path, {
        ...requestOptions,
        skipAuthRefresh: true,
      });
    } catch (error) {
      clearStoredAuth();
    }
  }

  if (!response.ok || responseData.success === false) {
    const error = new Error(responseData.message || 'Yêu cầu thất bại.');
    error.status = response.status;
    error.details = responseData.details || null;
    throw error;
  }

  return responseData.data;
}
