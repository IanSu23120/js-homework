import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function GroupsPage() {
  const { authFetch, user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [inviteCode, setInviteCode] = useState('');
  const [groupName, setGroupName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [managingGroupId, setManagingGroupId] = useState(null);

  const managingGroup = groups.find((group) => group.id === managingGroupId);

  useEffect(() => {
    async function loadGroups() {
      try {
        const data = await authFetch('/api/groups/');
        setGroups(data);
      } catch (err) {
        setError(err.detail || '讀取群組失敗。');
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
    setMessage('');

    try {
      const group = await authFetch('/api/groups/join/', {
        method: 'POST',
        body: { invite_code: inviteCode.trim() },
      });
      setGroups((current) => [
        group,
        ...current.filter((item) => item.id !== group.id),
      ]);
      setInviteCode('');
      setMessage(`已加入「${group.name}」。`);
    } catch (err) {
      setError(err.detail || '邀請碼無效。');
    }
  }

  async function handleCreate(event) {
    event.preventDefault();
    if (!groupName.trim()) return;
    setError('');
    setMessage('');

    try {
      const group = await authFetch('/api/groups/', {
        method: 'POST',
        body: { name: groupName.trim() },
      });
      setGroups((current) => [group, ...current]);
      setGroupName('');
      setMessage(`已建立「${group.name}」。`);
    } catch (err) {
      setError(err.detail || '建立群組失敗。');
    }
  }

  async function handleLeave(group) {
    if (!window.confirm(`確定要退出「${group.name}」嗎？`)) return;
    setError('');
    setMessage('');

    try {
      await authFetch(`/api/groups/${group.id}/leave/`, { method: 'POST' });
      setGroups((current) => current.filter((item) => item.id !== group.id));
      setMessage(`你已退出「${group.name}」。`);
    } catch (err) {
      setError(err.detail || '退出群組失敗。');
    }
  }

  async function handleRemoveMember(group, member) {
    if (!window.confirm(`確定要將 ${member.username} 移出群組嗎？`)) return;
    setError('');
    setMessage('');

    try {
      const updatedGroup = await authFetch(
        `/api/groups/${group.id}/remove-member/`,
        {
          method: 'POST',
          body: { member_id: member.id },
        },
      );
      setGroups((current) =>
        current.map((item) =>
          item.id === updatedGroup.id ? updatedGroup : item,
        ),
      );
      setMessage(`已將 ${member.username} 移出「${group.name}」。`);
    } catch (err) {
      setError(err.detail || '移除成員失敗。');
    }
  }

  async function handleDeleteGroup(group) {
    if (!window.confirm(`確定要解散「${group.name}」嗎？此操作無法復原。`)) {
      return;
    }
    setError('');
    setMessage('');

    try {
      await authFetch(`/api/groups/${group.id}/`, { method: 'DELETE' });
      setGroups((current) => current.filter((item) => item.id !== group.id));
      setManagingGroupId(null);
      setMessage(`已解散「${group.name}」。`);
    } catch (err) {
      setError(err.detail || '解散群組失敗。');
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
            <button className="primary-button">加入</button>
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
            <button className="primary-button">建立</button>
          </form>
        </article>
      </section>

      {error && <p className="form-error">{error}</p>}
      {message && <p className="form-success">{message}</p>}

      <section className="content-section">
        <div className="section-title">
          <div>
            <h2>我的群組</h2>
            <p>行程提案與投票已移至各旅程詳情頁。</p>
          </div>
        </div>

        {loading ? (
          <p>讀取中...</p>
        ) : groups.length === 0 ? (
          <p>目前尚未加入任何群組。</p>
        ) : (
          <div className="group-list">
            {groups.map((group) => {
              const isLeader = group.leader?.id === user?.id;

              return (
                <article className="group-card" key={group.id}>
                  <div className="group-card-main">
                    <div>
                      <div className="group-card-title">
                        <h3>{group.name}</h3>
                        <span>{isLeader ? '創立者' : '成員'}</span>
                      </div>
                      <p>邀請碼：{group.invite_code}</p>
                      <p>成員：{group.members?.length || 0}</p>
                    </div>
                    <div className="group-card-actions">
                      {isLeader ? (
                        <button
                          className="secondary-button"
                          onClick={() => setManagingGroupId(group.id)}
                        >
                          管理成員
                        </button>
                      ) : (
                        <button
                          className="danger-button"
                          onClick={() => handleLeave(group)}
                        >
                          退出群組
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {managingGroup && (
        <div className="modal-backdrop">
          <section className="group-member-modal" role="dialog" aria-modal="true">
            <div className="group-member-modal-header">
              <div>
                <p className="home-kicker">Member management</p>
                <h2>{managingGroup.name}</h2>
              </div>
              <button
                className="icon-button"
                onClick={() => setManagingGroupId(null)}
                aria-label="關閉"
              >
                ×
              </button>
            </div>

            <div className="group-member-list">
              {managingGroup.members.map((member) => {
                const isLeader = member.id === managingGroup.leader?.id;

                return (
                  <div className="group-member-row" key={member.id}>
                    <div>
                      <strong>{member.username}</strong>
                      <span>{isLeader ? '創立者' : '成員'}</span>
                    </div>
                    {!isLeader && (
                      <button
                        className="danger-button"
                        onClick={() =>
                          handleRemoveMember(managingGroup, member)
                        }
                      >
                        移除成員
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="group-member-modal-footer">
              <button
                className="danger-button"
                onClick={() => handleDeleteGroup(managingGroup)}
              >
                解散群組
              </button>
              <button
                className="secondary-button"
                onClick={() => setManagingGroupId(null)}
              >
                完成
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
