import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AttractionExplorer from '../components/AttractionExplorer.jsx';
import StatCard from '../components/StatCard.jsx';
import TripCard from '../components/TripCard.jsx';
import TripForm from '../components/TripForm.jsx';
import { useTrips } from '../context/TripContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { countTripDays, getNextTrip } from '../utils/dateUtils.js';

export default function PlannerPage() {
  const { trips, addTrip, deleteTrip, updateTripGroup, addScheduleItem } = useTrips();
  const { user, logout, authFetch } = useAuth();
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    let active = true;

    async function loadGroups() {
      try {
        const data = await authFetch('/api/groups/');
        if (active) setGroups(data);
      } catch (err) {
        console.error('Failed to load groups:', err);
      }
    }

    loadGroups();
    return () => {
      active = false;
    };
  }, [authFetch]);

  const stats = useMemo(() => {
    const totalDays = trips.reduce(
      (sum, trip) => sum + countTripDays(trip.startDate, trip.endDate),
      0,
    );
    const nextTrip = getNextTrip(trips);

    return {
      totalTrips: trips.length,
      totalDays,
      nextDestination: nextTrip?.destination || '尚未安排',
    };
  }, [trips]);

  function handleCreateTrip({ trip, selectedAttractions }) {
    addTrip(trip, selectedAttractions);
    setIsFormOpen(false);
  }

  return (
    <main className="app-shell">
      <header className="topbar" aria-label="功能頁導覽">
        <Link className="brand" to="/planner">
          <span className="brand-mark">TP</span>
          <span>Travel Planner</span>
        </Link>
        <div className="topbar-actions">
          <span className="user-label">目前使用者：{user?.username || '訪客'}</span>
          <Link className="ghost-link" to="/groups">
            群組協作
          </Link>
          <Link className="ghost-link" to="/">
            回到首頁
          </Link>
          <button className="ghost-link" type="button" onClick={() => { logout(); navigate('/login'); }}>
            登出
          </button>
          <button className="primary-button" onClick={() => setIsFormOpen(true)}>
            <span aria-hidden="true">+</span>
            新增旅程
          </button>
        </div>
      </header>

      <section className="hero-panel planner-hero">
        <div className="hero-copy">
          <p className="eyebrow">Planner Workspace</p>
          <h1>規劃、地圖、行程都在這裡。</h1>
          <p>建立旅程、從地圖加入推薦景點，再進入詳情頁安排每天的路線。</p>
        </div>
        <div className="hero-visual" aria-label="旅遊規劃視覺摘要">
          <div className="map-card">
            <span className="pin pin-a" />
            <span className="pin pin-b" />
            <span className="pin pin-c" />
            <div className="route-line" />
            <div className="mini-panel">
              <strong>{stats.totalTrips}</strong>
              <span>trips saved</span>
            </div>
          </div>
        </div>
      </section>

      <section className="summary-grid" aria-label="旅程摘要">
        <StatCard label="旅程數" value={stats.totalTrips} />
        <StatCard label="規劃天數" value={stats.totalDays} />
        <StatCard label="下一站" value={stats.nextDestination} />
      </section>

      <section className="content-section">
        <div className="section-title">
          <div>
            <h2>我的旅程</h2>
            <p>建立旅程後，資料會同步至你的帳號，也能選擇分享給群組。</p>
          </div>
          <button className="secondary-button" onClick={() => setIsFormOpen(true)}>
            建立旅程
          </button>
        </div>

        {trips.length > 0 ? (
          <div className="trip-grid">
            {trips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                groups={groups}
                currentUserId={user?.id}
                onDelete={deleteTrip}
                onChangeGroup={updateTripGroup}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>還沒有旅程</h3>
            <p>先新增目的地與日期，之後就能開始安排每日行程。</p>
            <button className="primary-button" onClick={() => setIsFormOpen(true)}>
              <span aria-hidden="true">+</span>
              新增第一個旅程
            </button>
          </div>
        )}
      </section>

      <AttractionExplorer trips={trips} onAddAttraction={addScheduleItem} />

      {isFormOpen && (
        <TripForm
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleCreateTrip}
        />
      )}
    </main>
  );
}
