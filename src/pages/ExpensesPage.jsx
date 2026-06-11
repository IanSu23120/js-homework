import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTrips } from '../context/TripContext.jsx';
import { formatDate } from '../utils/dateUtils.js';

export default function ExpensesPage() {
  const { tripId } = useParams();
  const { authFetch, user } = useAuth();
  const { trips } = useTrips();
  const [expenses, setExpenses] = useState([]);
  const trip = trips.find((item) => item.id === tripId);

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

  function getTripDay(expenseDate) {
    const dayIndex = trip?.days.findIndex((day) => day.date === expenseDate) ?? -1;
    return dayIndex >= 0 ? `Day ${dayIndex + 1}` : '旅程日期';
  }

  function getScheduleTitle(scheduleItemId) {
    if (!scheduleItemId) return '未指定行程項目';

    for (const day of trip?.days || []) {
      const scheduleItem = day.items.find(
        (item) => String(item.id) === String(scheduleItemId),
      );
      if (scheduleItem) return scheduleItem.title;
    }

    return '行程項目已移除';
  }

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
                <div className="expense-card-header">
                  <strong>{expense.amount} {expense.currency}</strong>
                  <span>{expense.category}</span>
                </div>
                <dl className="expense-card-meta">
                  <div>
                    <dt>行程日</dt>
                    <dd>{getTripDay(expense.date)} · {formatDate(expense.date)}</dd>
                  </div>
                  <div>
                    <dt>記帳者</dt>
                    <dd>{expense.payer?.username || '未知使用者'}</dd>
                  </div>
                  <div>
                    <dt>行程項目</dt>
                    <dd>{getScheduleTitle(expense.schedule_item)}</dd>
                  </div>
                </dl>
                {expense.note && <p className="expense-card-note">{expense.note}</p>}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
