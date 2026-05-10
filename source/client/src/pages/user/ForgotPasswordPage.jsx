import { useState } from 'react';
import { Link } from 'react-router-dom';
import FormField from '../../components/FormField.jsx';
import { forgotPassword } from '../../services/user/authService.js';

/**
 * Trang quên mật khẩu.
 */
function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  /**
   * Gửi yêu cầu đặt lại mật khẩu lên backend.
   */
  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = await forgotPassword({ email });
      setResult(response);
    } catch (error) {
      setErrorMessage(error.message);
      setResult(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-shell container">
      <section className="auth-panel auth-intro">
        <p className="section-eyebrow">Trang quên mật khẩu</p>
        <h1>Lấy lại quyền truy cập vào tài khoản của bạn.</h1>
        <p>Nhập email đã đăng ký để nhận hướng dẫn đặt lại mật khẩu và tiếp tục quản lý các chuyến đi đang quan tâm.</p>
      </section>

      <section className="auth-panel">
        <form className="form-card" onSubmit={handleSubmit}>
          <FormField
            label="Email đăng ký"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            type="email"
            value={email}
          />
          <button className="button button-primary full-width" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Đang gửi yêu cầu...' : 'Gửi link đặt lại mật khẩu'}
          </button>
          {errorMessage ? <p className="error-message">{errorMessage}</p> : null}
          {result ? (
            <div className="form-card">
              <p className="success-message">{result.message}</p>
              {result.resetUrl ? (
                <>
                  <p className="helper-text">
                    Môi trường development đang trả trực tiếp link đặt lại mật khẩu để bạn kiểm tra nhanh.
                  </p>
                  <Link className="button button-secondary" to={`/reset-password?token=${result.resetToken}`}>
                    Mở trang đặt lại mật khẩu
                  </Link>
                </>
              ) : null}
            </div>
          ) : null}
        </form>
      </section>
    </div>
  );
}

export default ForgotPasswordPage;
