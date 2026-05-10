import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import FormField from '../../components/FormField.jsx';
import { resetPassword } from '../../services/user/authService.js';

/**
 * Trang đặt lại mật khẩu bằng token backend đã cấp.
 */
function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    confirmPassword: '',
    newPassword: '',
    token: searchParams.get('token') || '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  /**
   * Xác thực token và mật khẩu mới, sau đó điều hướng người dùng về trang đăng nhập.
   */
  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (formData.newPassword !== formData.confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận chưa khớp.');
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPassword({
        newPassword: formData.newPassword,
        token: formData.token,
      });
      setSuccessMessage('Mật khẩu đã được đặt lại thành công. Bạn có thể đăng nhập bằng mật khẩu mới.');
      window.setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1200);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-shell container">
      <section className="auth-panel auth-intro">
        <p className="section-eyebrow">Đặt lại mật khẩu</p>
        <h1>Thiết lập mật khẩu mới để quay lại tài khoản.</h1>
        <p>Nhập token đặt lại mật khẩu và chọn mật khẩu mới để tiếp tục đăng nhập và quản lý các chuyến đi của bạn.</p>
      </section>

      <section className="auth-panel">
        <form className="form-card" onSubmit={handleSubmit}>
          <FormField
            label="Token đặt lại mật khẩu"
            name="token"
            onChange={handleChange}
            placeholder="Dán token đặt lại mật khẩu"
            value={formData.token}
          />
          <FormField
            label="Mật khẩu mới"
            name="newPassword"
            onChange={handleChange}
            placeholder="Nhập mật khẩu mới"
            type="password"
            value={formData.newPassword}
          />
          <FormField
            label="Xác nhận mật khẩu mới"
            name="confirmPassword"
            onChange={handleChange}
            placeholder="Nhập lại mật khẩu mới"
            type="password"
            value={formData.confirmPassword}
          />
          <button className="button button-primary full-width" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Đang cập nhật mật khẩu...' : 'Đặt lại mật khẩu'}
          </button>
          {errorMessage ? <p className="error-message">{errorMessage}</p> : null}
          {successMessage ? <p className="success-message">{successMessage}</p> : null}
          <p className="helper-text">
            <Link to="/login">Quay lại đăng nhập</Link>
          </p>
        </form>
      </section>
    </div>
  );
}

export default ResetPasswordPage;
