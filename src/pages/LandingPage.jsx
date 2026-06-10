import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTrips } from '../context/TripContext.jsx';
import {
  countTripDays,
  formatTripDateRange,
  getNextTrip,
} from '../utils/dateUtils.js';

const guestFeatures = [
  {
    number: '01',
    title: '把想去的地方收進旅程',
    text: '從城市、景點與餐廳開始，快速建立一趟有方向的旅行。',
  },
  {
    number: '02',
    title: '每天的安排清楚可見',
    text: '依日期整理時間、備註與費用，行程再多也不會失去脈絡。',
  },
  {
    number: '03',
    title: '和同行夥伴一起規劃',
    text: '分享旅程給群組，保留每位成員的留言與記帳紀錄。',
  },
];

export default function LandingPage() {
  const { user, logout, authFetch } = useAuth();
  const { trips } = useTrips();
  const navigate = useNavigate();
  const [groupCount, setGroupCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setGroupCount(0);
      return;
    }

    let active = true;
    authFetch('/api/groups/')
      .then((groups) => {
        if (active) setGroupCount(groups.length);
      })
      .catch((err) => console.error('Failed to load dashboard groups:', err));

    return () => {
      active = false;
    };
  }, [authFetch, user]);

  const dashboard = useMemo(() => {
    const nextTrip = getNextTrip(trips);
    const totalDays = trips.reduce(
      (sum, trip) => sum + countTripDays(trip.startDate, trip.endDate),
      0,
    );
    const scheduledItems = trips.reduce(
      (sum, trip) =>
        sum + trip.days.reduce((daySum, day) => daySum + day.items.length, 0),
      0,
    );

    return { nextTrip, totalDays, scheduledItems };
  }, [trips]);

  function handleLogout() {
    logout();
    navigate('/');
  }

  if (user) {
    return (
      <main className="home-shell member-home">
        <HomeNav user={user} onLogout={handleLogout} />

        <section className="member-hero">
          <div className="member-welcome">
            <p className="home-kicker">Welcome back</p>
            <h1>{user.username}，下一段旅程從這裡開始。</h1>
            <p>查看即將出發的旅程、回到規劃進度，或邀請夥伴一起補完細節。</p>
            <div className="home-actions">
              <Link className="primary-button" to="/planner">
                管理我的旅程
              </Link>
              <Link className="ghost-link" to="/groups">
                前往群組
              </Link>
            </div>
          </div>

          {dashboard.nextTrip ? (
            <article
              className="next-trip-card"
              style={{ '--trip-accent': dashboard.nextTrip.coverColor }}
            >
              <div className="next-trip-label">
                <span>Next destination</span>
                <span>{countTripDays(
                  dashboard.nextTrip.startDate,
                  dashboard.nextTrip.endDate,
                )} 天</span>
              </div>
              <div>
                <p>{dashboard.nextTrip.destination}</p>
                <h2>{dashboard.nextTrip.name}</h2>
              </div>
              <p>{formatTripDateRange(
                dashboard.nextTrip.startDate,
                dashboard.nextTrip.endDate,
              )}</p>
              <Link to={`/trip/${dashboard.nextTrip.id}`}>繼續規劃行程 →</Link>
            </article>
          ) : (
            <article className="next-trip-card empty-next-trip">
              <span>尚未安排下一站</span>
              <h2>先選一個想去的城市。</h2>
              <Link to="/planner">建立第一趟旅程 →</Link>
            </article>
          )}
        </section>

        <section className="dashboard-stats" aria-label="旅程統計">
          <DashboardStat label="旅程" value={trips.length} suffix="趟" />
          <DashboardStat label="規劃天數" value={dashboard.totalDays} suffix="天" />
          <DashboardStat label="行程項目" value={dashboard.scheduledItems} suffix="個" />
          <DashboardStat label="協作群組" value={groupCount} suffix="組" />
        </section>

        <section className="home-section">
          <div className="home-section-heading">
            <div>
              <p className="home-kicker">Your journeys</p>
              <h2>最近的旅程</h2>
            </div>
            <Link to="/planner">查看全部 →</Link>
          </div>

          {trips.length > 0 ? (
            <div className="home-trip-list">
              {trips.slice(0, 3).map((trip) => (
                <Link className="home-trip-row" to={`/trip/${trip.id}`} key={trip.id}>
                  <span
                    className="home-trip-accent"
                    style={{ backgroundColor: trip.coverColor }}
                  />
                  <div>
                    <span>{trip.destination}</span>
                    <strong>{trip.name}</strong>
                  </div>
                  <span>{formatTripDateRange(trip.startDate, trip.endDate)}</span>
                  <span>查看 →</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="home-empty-state">
              <p>你的旅程清單還是空的。</p>
              <Link className="primary-button" to="/planner">
                開始建立旅程
              </Link>
            </div>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="home-shell guest-home">
      <HomeNav />

      <section className="guest-hero">
        <div className="guest-hero-copy">
          <p className="home-kicker">Plan together. Travel better.</p>
          <h1>讓旅行不只是一串待辦，而是一段大家都期待的路線。</h1>
          <p>
            Travel Planner 把每日行程、地圖、留言與費用放在同一個地方，
            從第一個目的地到最後一筆記帳，都能和同行夥伴一起完成。
          </p>
          <div className="home-actions">
            <Link className="primary-button" to="/register">
              免費建立帳號
            </Link>
            <Link className="ghost-link" to="/login">
              我已經有帳號
            </Link>
          </div>
          <div className="home-proof">
            <span>每日行程</span>
            <span>群組協作</span>
            <span>地圖推薦</span>
            <span>共同記帳</span>
          </div>
        </div>

        <div className="journey-board" aria-label="行程規劃預覽">
          <div className="journey-board-top">
            <div>
              <span>Seoul · 4 days</span>
              <strong>首爾週末散步</strong>
            </div>
            <span className="journey-avatar">3 人</span>
          </div>
          <div className="journey-map">
            <span className="pin pin-a" />
            <span className="pin pin-b" />
            <span className="pin pin-c" />
            <div className="route-line" />
          </div>
          <div className="journey-timeline">
            <span>09:30</span><strong>景福宮</strong><small>test1：入口集合</small>
            <span>13:00</span><strong>廣藏市場</strong><small>test2：午餐 320 TWD</small>
            <span>18:40</span><strong>南山首爾塔</strong><small>一起看夜景</small>
          </div>
        </div>
      </section>

      <section className="guest-feature-section" id="features">
        <div className="home-section-heading">
          <div>
            <p className="home-kicker">One place, every detail</p>
            <h2>規劃過程更簡單，旅途中更安心。</h2>
          </div>
        </div>
        <div className="guest-feature-grid">
          {guestFeatures.map((feature) => (
            <article key={feature.number}>
              <span>{feature.number}</span>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-cta">
        <div>
          <p className="home-kicker">Your next trip</p>
          <h2>先建立旅程，剩下的細節一起慢慢補完。</h2>
        </div>
        <Link className="primary-button" to="/register">
          開始規劃
        </Link>
      </section>
    </main>
  );
}

function HomeNav({ user, onLogout }) {
  return (
    <header className="home-nav">
      <Link className="brand" to="/">
        <span className="brand-mark">TP</span>
        <span>Travel Planner</span>
      </Link>
      <nav>
        {user ? (
          <>
            <Link to="/planner">我的旅程</Link>
            <Link to="/groups">群組</Link>
            <button type="button" onClick={onLogout}>登出</button>
          </>
        ) : (
          <>
            <a href="#features">功能</a>
            <Link to="/login">登入</Link>
            <Link className="home-nav-primary" to="/register">開始使用</Link>
          </>
        )}
      </nav>
    </header>
  );
}

function DashboardStat({ label, value, suffix }) {
  return (
    <article>
      <span>{label}</span>
      <strong>{value}<small>{suffix}</small></strong>
    </article>
  );
}
