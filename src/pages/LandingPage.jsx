import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const features = [
  {
    title: '建立旅程',
    text: '選城市、日期與封面顏色，資料保存在瀏覽器 localStorage。',
  },
  {
    title: '地圖推薦',
    text: '支援日本、韓國、越南、台灣等城市，從地圖把景點加入行程。',
  },
  {
    title: '每日編輯',
    text: '進入旅程詳情頁後，可編輯時間、類別、備註並同步地圖標記。',
  },
  {
    title: '天氣預測',
    text: '新增旅程時用 Open-Meteo 預覽目的地每日天氣，不需要 API key。',
  },
];

export default function LandingPage() {
  const { user, logout } = useAuth();

  return (
    <main className="landing-shell">
      <header className="landing-nav">
        <Link className="brand" to="/">
          <span className="brand-mark">TP</span>
          <span>Travel Planner</span>
        </Link>
        <div className="landing-nav-actions">
          {user ? (
            <>
              <span className="user-label">目前使用者：{user.username}</span>
              <Link className="ghost-link" to="/planner">
                功能頁
              </Link>
              <Link className="ghost-link" to="/groups">
                群組協作
              </Link>
              <button
                className="ghost-link"
                type="button"
                onClick={() => logout()}
              >
                登出
              </button>
            </>
          ) : (
            <>
              <Link className="ghost-link" to="/login">
                登入
              </Link>
              <Link className="primary-button" to="/register">
                註冊
              </Link>
            </>
          )}
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-copy">
          <p className="eyebrow">Travel planning, map first</p>
          <h1>從城市靈感，到每天行程，一次整理好。</h1>
          <p>
            這是一個以 React 製作的旅遊行程規劃工具。你可以建立旅程、查看推薦景點、加入每日行程，並用地圖確認路線位置。
          </p>
          <div className="landing-actions">
            <Link className="primary-button" to={user ? '/planner' : '/login'}>
              {user ? '前往我的旅程' : '開始使用'}
            </Link>
            <a className="ghost-link" href="#features">
              查看功能
            </a>
          </div>
        </div>

        <div className="landing-preview" aria-label="旅遊規劃工具預覽">
          <div className="preview-map">
            <span className="pin pin-a" />
            <span className="pin pin-b" />
            <span className="pin pin-c" />
            <div className="route-line" />
          </div>
          <div className="preview-panel">
            <span>Today</span>
            <strong>09:30 景福宮</strong>
            <strong>13:00 明洞</strong>
            <strong>18:30 南山首爾塔</strong>
          </div>
        </div>
      </section>

      <section className="landing-section" id="features">
        <div className="section-title">
          <div>
            <h2>目前已完成的功能</h2>
            <p>首頁只做介紹；真正規劃工作都放在獨立功能頁。</p>
          </div>
        </div>
        <div className="feature-grid">
          {features.map((feature) => (
            <article className="feature-card" key={feature.title}>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
