import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      await login(form);
      navigate('/');
    } catch (err) {
      setError(err.detail || '登入失敗，請確認帳號密碼。');
    }
  }

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <h1>登入 Travel Planner</h1>
        <p>使用帳號登入即可同步你的旅程與群組資料。</p>

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
            密碼
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={updateField}
              required
              autoComplete="current-password"
            />
          </label>

          {error && <p className="form-error">{error}</p>}
          <button className="primary-button" type="submit">
            登入
          </button>
        </form>

        <p className="auth-footer">
          還沒有帳號？ <Link to="/register">立即註冊</Link>
        </p>
      </section>
    </main>
  );
}
