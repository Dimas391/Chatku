import React, { useState, useEffect } from 'react';
import { Card, Badge } from '@/components/ui';
import { Search, UserCheck, UserX, Trash2, RefreshCw } from 'lucide-react';
import userService, { User } from '@/services/userService';

export const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, online: 0, offline: 0, verified: 0 });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getAllUsers(search || undefined, 100);
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await userService.getUserStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleSearch = async () => {
    if (!search.trim()) {
      await fetchUsers();
      return;
    }
    
    setLoading(true);
    try {
      const data = await userService.searchUsers(search);
      setUsers(data);
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId: string) => {
    if (!confirm('Apakah Anda yakin ingin memblokir user ini?')) return;
    
    setActionLoading(userId);
    try {
      await userService.blockUser(userId);
      await fetchUsers();
      await fetchStats();
    } catch (error) {
      console.error('Failed to block user:', error);
      alert('Gagal memblokir user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnblockUser = async (userId: string) => {
    if (!confirm('Apakah Anda yakin ingin membuka blokir user ini?')) return;
    
    setActionLoading(userId);
    try {
      await userService.unblockUser(userId);
      await fetchUsers();
      await fetchStats();
    } catch (error) {
      console.error('Failed to unblock user:', error);
      alert('Gagal membuka blokir user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus user "${userName}" secara permanen?`)) return;
    
    setActionLoading(userId);
    try {
      await userService.deleteUser(userId);
      await fetchUsers();
      await fetchStats();
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Gagal menghapus user');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (user: User) => {
    if (user.is_active === false) {
      return <Badge tone="danger">Blocked</Badge>;
    }
    return user.is_online ? (
      <Badge tone="success">Online</Badge>
    ) : (
      <Badge tone="info">Offline</Badge>
    );
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <Card 
      title="Daftar Pengguna" 
      subtitle={`${users.length} pengguna dari total ${stats.total} | ${stats.online} online · ${stats.verified} terverifikasi`}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <div className="topbar-search" style={{ flex: 1, maxWidth: 400 }}>
          <Search size={16} color="var(--text-muted)" />
          <input 
            placeholder="Cari pengguna ..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSearch()}
          />
          <button 
            onClick={handleSearch}
            style={{ 
              background: 'var(--brand)', 
              border: 'none', 
              color: 'white', 
              padding: '6px 12px',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 12
            }}
          >
            Cari
          </button>
        </div>
        <button 
          onClick={() => { fetchUsers(); fetchStats(); }}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 6, 
            background: 'var(--surface-2)', 
            border: '1px solid var(--border)',
            padding: '6px 12px',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 12
          }}
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 8px' }}>User</th>
                <th style={{ padding: '12px 8px' }}>Username</th>
                <th style={{ padding: '12px 8px' }}>Kontak</th>
                <th style={{ padding: '12px 8px' }}>Status</th>
                <th style={{ padding: '12px 8px' }}>Pesan</th>
                <th style={{ padding: '12px 8px' }}>Bergabung</th>
                <th style={{ padding: '12px 8px' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar" style={{ width: 36, height: 36, fontSize: 12, background: 'var(--brand)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                        {user.display_name?.slice(0, 2).toUpperCase() || '??'}
                      </div>
                      <div style={{ fontWeight: 500 }}>{user.display_name}</div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>
                    @{user.username}
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <div style={{ fontSize: 11 }}>
                      {user.phone && <div>📱 {user.phone}</div>}
                      {user.email && <div>✉️ {user.email}</div>}
                    </div>
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    {getStatusBadge(user)}
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    {(user as any).message_count?.toLocaleString() || '0'}
                  </td>
                  <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>
                    {formatDate(user.created_at)}
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {user.is_active !== false ? (
                        <button
                          onClick={() => handleBlockUser(user.id)}
                          disabled={actionLoading === user.id}
                          style={{ 
                            background: '#EF4444', 
                            border: 'none', 
                            color: 'white', 
                            padding: '4px 8px',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontSize: 11,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <UserX size={12} /> Block
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUnblockUser(user.id)}
                          disabled={actionLoading === user.id}
                          style={{ 
                            background: '#22C55E', 
                            border: 'none', 
                            color: 'white', 
                            padding: '4px 8px',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontSize: 11,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <UserCheck size={12} /> Unblock
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteUser(user.id, user.display_name)}
                        disabled={actionLoading === user.id}
                        style={{ 
                          background: 'transparent', 
                          border: '1px solid var(--border)', 
                          color: 'var(--text-muted)', 
                          padding: '4px 8px',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontSize: 11,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        <Trash2 size={12} /> Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              Tidak ada pengguna ditemukan
            </div>
          )}
        </div>
      )}

    
    </Card>
  );
};