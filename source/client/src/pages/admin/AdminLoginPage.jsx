import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import FormField from '../../components/FormField.jsx';
import { isAdminPortalRole, loginAdmin } from '../../services/admin/adminAuthService.js';

const ADMIN_DEMO_ACCOUNTS = [
  'Tài khoản quản trị: `admin01` / `123456`',
  'Tài khoản vận hành: `staff01` / `123456`',
  'Role `admin` và `staff` được cấp quyền vào khu quản trị; role `user` sử dụng giao diện khách hàng',
];

/**
 * Trang đăng nhập riêng cho admin để tách biệt với luồng đăng nhập người dùng.
 */
function AdminLoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    loginId: '',
    password: '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Cập nhật state cho 2 trường đăng nhập và mật khẩu.
   */
  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((currentFormData) => ({ ...currentFormData, [name]: value }));
  }

  /**
   * Đăng nhập bằng tài khoản thật từ backend, sau đó điều hướng theo đúng role.
   */
  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const authData = await loginAdmin(formData);
      const currentRole = authData?.user?.role;

      if (isAdminPortalRole(currentRole)) {
        navigate(location.state?.redirectTo || '/admin', { replace: true });
        return;
      }

      navigate('/', { replace: true });
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="admin-login-shell">
      <section className="admin-login-panel admin-login-intro">
        <p className="section-eyebrow">Khu vực quản trị</p>
        <h1>Đăng nhập khu vực quản trị</h1>
        <p>
          Hệ thống sử dụng chung tài khoản xác thực với backend. Người dùng có role `admin` hoặc `staff` sẽ được chuyển
          vào khu quản trị; role `user` sẽ sử dụng giao diện khách hàng.
        </p>
        <ul className="feature-list">
          {ADMIN_DEMO_ACCOUNTS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="admin-login-panel">
        <form className="form-card" onSubmit={handleSubmit}>
          <FormField
            label="Tài khoản quản trị"
            name="loginId"
            onChange={handleChange}
            placeholder="Nhập username hoặc email"
            value={formData.loginId}
          />
          <FormField
            label="Mật khẩu"
            name="password"
            onChange={handleChange}
            placeholder="Nhập mật khẩu"
            type="password"
            value={formData.password}
          />
          <button className="button button-primary full-width" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Đang đăng nhập...' : 'Vào hệ thống'}
          </button>
          {errorMessage ? <p className="error-message">{errorMessage}</p> : null}
          <div className="inline-links">
            <Link to="/">Về website người dùng</Link>
          </div>
        </form>
      </section>
    </div>
  );
}

export default AdminLoginPage;
