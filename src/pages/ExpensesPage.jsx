import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ExpensesPage() {
  const { tripId } = useParams();
  const { authFetch, user } = useAuth();
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    async function loadExpenses() {
      try {
        const data = await authFetch('/api/expenses/');
        setExpenses(data.filter((item) => item.trip === tripId));
      } catch (err) {
        console.error(err);
      }
    }

    loadExpenses();
  }, [authFetch, tripId]);

  const totalsByCurrency = expenses.reduce((totals, expense) => {
    const current = totals[expense.currency] || 0;
    totals[expense.currency] = current + Number(expense.amount);
    return totals;
  }, {});

  return (
    <main className="page-shell">
      <header className="section-title">
        <div>
          <h1>旅程花費總覽</h1>
          <p>目前使用者：{user?.username || '訪客'}，查看整個行程的費用摘要與明細。</p>
        </div>
        <Link className="ghost-link" to={`/trip/${tripId}`}>
          回到行程
        </Link>
      </header>

      <section className="card-grid expense-summary-grid">
        <article className="card">
          <h2>總支出筆數</h2>
          <p>{expenses.length} 筆</p>
        </article>
        {Object.entries(totalsByCurrency).map(([currency, amount]) => (
          <article className="card" key={currency}>
            <h2>{currency} 總額</h2>
            <p>{amount.toFixed(2)}</p>
          </article>
        ))}
      </section>

      <section className="content-section">
        <h2>支出明細</h2>
        {expenses.length === 0 ? (
          <p>尚未有任何費用紀錄。</p>
        ) : (
          <div className="expense-list">
            {expenses.map((expense) => (
              <article className="expense-card" key={expense.id}>
                <div>
                  <strong>{expense.amount} {expense.currency}</strong>
                  <p>{expense.category} · {expense.date}</p>
                </div>
                <p>{expense.note}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
