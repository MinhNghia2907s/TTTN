import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import FormField from '../../components/FormField.jsx';
import { register } from '../../services/user/authService.js';
import { isAdminPortalRole } from '../../services/admin/adminAuthService.js';

const initialForm = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
};

/**
 * Trang đăng ký, tạo tài khoản thật qua backend và tự động đăng nhập sau khi thành công.
 */
function RegisterPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialForm);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Đồng bộ từng input vào form state để phục vụ validate và submit ở bước sau.
   */
  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  /**
   * Gửi dữ liệu đăng ký lên backend, sau đó chuyển thẳng sang luồng người dùng đã đăng nhập.
   */
  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const authData = await register(formData);

      if (isAdminPortalRole(authData?.user?.role)) {
        navigate('/admin', { replace: true });
        return;
      }

      const redirectTo = location.state?.redirectTo || '/tours';
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-shell container">
      <section className="auth-panel auth-intro">
        <p className="section-eyebrow">Trang đăng ký</p>
        <h1>Tạo tài khoản để bắt đầu đặt tour.</h1>
        <p>
          Sau khi đăng ký thành công, hệ thống sẽ lưu phiên đăng nhập để bạn có thể đặt tour và theo dõi booking ngay.
        </p>
        <ul className="feature-list">
          <li>Tạo tài khoản bằng họ tên, email, số điện thoại và mật khẩu</li>
          <li>Email sẽ được dùng để đăng nhập và nhận thông tin xác nhận chuyến đi</li>
          <li>Quản lý lịch khởi hành, thanh toán và lịch sử đặt tour trong cùng một tài khoản</li>
        </ul>
      </section>

      <section className="auth-panel">
        <form className="form-card" onSubmit={handleSubmit}>
          <FormField label="Họ và tên" name="fullName" onChange={handleChange} placeholder="Nguyễn Văn A" value={formData.fullName} />
          <FormField label="Email" name="email" onChange={handleChange} placeholder="you@example.com" type="email" value={formData.email} />
          <FormField label="Số điện thoại" name="phone" onChange={handleChange} placeholder="09xxxxxxxx" value={formData.phone} />
          <FormField label="Mật khẩu" name="password" onChange={handleChange} placeholder="Nhập mật khẩu" type="password" value={formData.password} />
          <button className="button button-primary full-width" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
          </button>
          {errorMessage ? <p className="error-message">{errorMessage}</p> : null}
          <p className="helper-text">
            Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
          </p>
        </form>
      </section>
    </div>
  );
}

export default RegisterPage;
