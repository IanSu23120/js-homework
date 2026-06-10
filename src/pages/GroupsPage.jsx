import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function GroupsPage() {
  const { authFetch, user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [inviteCode, setInviteCode] = useState('');
  const [groupName, setGroupName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGroups() {
      try {
        const data = await authFetch('/api/groups/');
        setGroups(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadGroups();
  }, [authFetch]);

  async function handleJoin(event) {
    event.preventDefault();
    if (!inviteCode.trim()) return;
    setError('');
    try {
      const group = await authFetch('/api/groups/join/', {
        method: 'POST',
        body: { invite_code: inviteCode.trim() },
      });
      setGroups((current) => [group, ...current.filter((item) => item.id !== group.id)]);
      setInviteCode('');
    } catch (err) {
      setError(err.detail || '邀請碼無效。');
    }
  }

  async function handleCreate(event) {
    event.preventDefault();
    if (!groupName.trim()) return;
    try {
      const group = await authFetch('/api/groups/', {
        method: 'POST',
        body: { name: groupName.trim() },
      });
      setGroups((current) => [group, ...current]);
      setGroupName('');
    } catch (err) {
      setError(err.detail || '建立群組失敗。');
    }
  }

  return (
    <main className="page-shell">
      <header className="section-title">
        <div>
          <h1>群組協作</h1>
          <p>目前使用者：{user?.username || '訪客'}，建立旅遊群組或加入協作。</p>
        </div>
        <Link className="ghost-link" to="/">
          回到首頁
        </Link>
      </header>

      <section className="card-grid">
        <article className="card">
          <h2>加入群組</h2>
          <form onSubmit={handleJoin} className="simple-form">
            <input
              value={inviteCode}
              onChange={(event) => setInviteCode(event.target.value)}
              placeholder="邀請碼"
            />
            <button className="primary-button" type="submit">
              加入
            </button>
          </form>
        </article>

        <article className="card">
          <h2>建立群組</h2>
          <form onSubmit={handleCreate} className="simple-form">
            <input
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
              placeholder="群組名稱"
            />
            <button className="primary-button" type="submit">
              建立
            </button>
          </form>
        </article>
      </section>

      {error && <p className="form-error">{error}</p>}

      <section className="content-section">
        <h2>我的群組</h2>
        {loading ? (
          <p>讀取中...</p>
        ) : groups.length === 0 ? (
          <p>目前尚未加入任何群組。</p>
        ) : (
          <div className="group-list">
            {groups.map((group) => (
              <article className="group-card" key={group.id}>
                <h3>{group.name}</h3>
                <p>邀請碼：{group.invite_code}</p>
                <p>成員：{group.members?.length || 0}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
