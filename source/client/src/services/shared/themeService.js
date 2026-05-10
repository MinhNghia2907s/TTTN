const THEME_STORAGE_KEY = 'tourflow-theme';
const LIGHT_THEME = 'light';
const DARK_THEME = 'dark';

/**
 * Đọc theme đã lưu trong localStorage, nếu chưa có thì rơi về thiết lập hệ thống của người dùng.
 */
export function getInitialTheme() {
  if (typeof window === 'undefined') {
    return LIGHT_THEME;
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

  if (storedTheme === LIGHT_THEME || storedTheme === DARK_THEME) {
    return storedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? DARK_THEME : LIGHT_THEME;
}

/**
 * Áp dụng theme hiện tại lên root document để toàn bộ CSS variables phản ứng đồng bộ.
 */
export function applyTheme(theme) {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

/**
 * Lưu lại theme đã chọn để lần truy cập sau vẫn giữ nguyên giao diện.
 */
export function saveTheme(theme) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export { DARK_THEME, LIGHT_THEME };
