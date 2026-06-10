import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, user } = useAuth();
  const [form, setForm] = useState({ username: '', email: '', password: '' });

  useEffect(() => {
    if (user) {
      navigate('/planner');
    }
  }, [user, navigate]);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    if (form.password.length < 8) {
      setError('密碼至少 8 個字元。');
      return;
    }

    try {
      await register(form);
      navigate('/login');
    } catch (err) {
      setError(err.detail || '註冊失敗，請稍後再試。');
    }
  }

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <h1>建立新帳號</h1>
        <p>註冊後即可保存旅程與群組協作資料。</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            帳號
            <input
              name="username"
              value={form.username}
              onChange={updateField}
              required
              autoComplete="username"
            />
          </label>

          <label>
            電子郵件
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={updateField}
              required
              autoComplete="email"
            />
          </label>

          <label>
            密碼
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={updateField}
              required
              autoComplete="new-password"
            />
          </label>

          {error && <p className="form-error">{error}</p>}
          <button className="primary-button" type="submit">
            註冊
          </button>
        </form>

        <p className="auth-footer">
          已有帳號？ <Link to="/login">前往登入</Link>
        </p>
      </section>
    </main>
  );
}
