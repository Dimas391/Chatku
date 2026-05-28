import React, { useEffect, useState } from 'react';
import { Card, Badge, Button } from '@/components/ui';
import {
  MessageCircle, Users, Eye, Trash2, RefreshCw, Lock, Shield, X, AlertTriangle,
} from 'lucide-react';
import chatService, { Chat } from '@/services/chatService';

interface ChatStats {
  total_chats: number;
  total_messages: number;
  active_today: number;
  personal_chats: number;
  group_chats: number;
}

interface ChatMessage {
  id: string;
  sender_name?: string;
  content?: string | null;
  created_at: string;
  classification_label?: string;
  is_destroyed?: boolean;
}

export const Chats: React.FC = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ChatStats>({
    total_chats: 0, total_messages: 0, active_today: 0, personal_chats: 0, group_chats: 0,
  });
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showDetail, setShowDetail] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    await Promise.all([fetchChats(), fetchStats()]);
  };

  const fetchChats = async () => {
    setLoading(true);
    try {
      const data = await chatService.getAllChats();
      setChats(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchStats = async () => {
    try {
      const data = await chatService.getChatStats();
      setStats(data);
    } catch (e) { console.error(e); }
  };

  const handleViewChat = async (chat: Chat) => {
    setSelectedChat(chat);
    setShowDetail(true);
    setActionLoading(chat.id);
    try {
      const data = await chatService.getChatDetail(chat.id);
      setMessages(data.messages || []);
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!confirm('Hapus chat ini? Semua pesan akan hilang.')) return;
    setActionLoading(chatId);
    try {
      await chatService.deleteChat(chatId);
      await fetchAll();
      if (selectedChat?.id === chatId) { setShowDetail(false); setSelectedChat(null); }
    } catch (e) { alert('Gagal menghapus chat'); }
    finally { setActionLoading(null); }
  };

  const formatDate = (s?: string | null) => {
    if (!s) return '-';
    const d = new Date(s);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yest = new Date(today); yest.setDate(yest.getDate() - 1);
    if (d >= today) return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    if (d >= yest) return 'Kemarin';
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  const getName = (c: Chat) =>
    c.type === 'group' ? (c.name || 'Grup Chat') : (c.participant_name || c.name || 'Personal Chat');

  const getPreview = (c: Chat) => {
    if (!c.last_message_text) return 'Belum ada pesan';
    if (c.last_message_text.startsWith('[Pesan Terenkripsi]')) return ' Pesan terenkripsi';
    return c.last_message_text;
  };

  const initials = (name: string) =>
    name.slice(0, 2).toUpperCase();

  /* ---------- Stat tiles ---------- */
  const tiles = [
    { label: 'Total Chat', value: stats.total_chats, icon: MessageCircle, tone: 'brand' as const },
    { label: 'Total Pesan', value: stats.total_messages, icon: Shield, tone: 'brand' as const },
    { label: 'Aktif Hari Ini', value: stats.active_today, icon: Users, tone: 'success' as const },
    { label: 'Personal', value: stats.personal_chats, icon: MessageCircle, tone: 'brand' as const },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Stat grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: 12,
      }}>
        {tiles.map(t => (
          <div key={t.label} style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 14,
            display: 'flex', alignItems: 'center', gap: 12,
            boxShadow: 'var(--shadow)',
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              display: 'grid', placeItems: 'center',
              background: 'var(--brand-soft)',
              color: 'var(--brand)',
            }}>
              <t.icon size={18} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.label}</span>
              <strong style={{ fontSize: 18 }}>{t.value.toLocaleString('id-ID')}</strong>
            </div>
          </div>
        ))}
      </div>

      {/* Chat list */}
      <Card
        title="Daftar Percakapan"
        subtitle={`${chats.length} percakapan total`}
        action={
          <Button variant="outline" onClick={fetchAll}>
            <RefreshCw size={14} style={{ marginRight: 6 }} /> Refresh
          </Button>
        }
      >
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Memuat…</div>
        ) : chats.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
            <MessageCircle size={36} style={{ opacity: 0.4, marginBottom: 8 }} />
            <p>Belum ada percakapan</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {chats.map(chat => (
              <div key={chat.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: 12,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                transition: 'border-color .15s, box-shadow .15s',
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--brand)';
                  e.currentTarget.style.boxShadow = 'var(--shadow)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Avatar */}
                <div className="avatar" style={{
                  width: 44, height: 44, borderRadius: 12,
                  display: 'grid', placeItems: 'center',
                  background: chat.type === 'group'
                    ? 'var(--brand-soft)'
                    : 'var(--brand)',
                  color: chat.type === 'group' ? 'var(--brand)' : 'white',
                  fontSize: 13, fontWeight: 'bold', flexShrink: 0,
                }}>
                  {chat.type === 'group' ? <Users size={18} /> : initials(getName(chat))}
                </div>

                {/* Body */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <strong style={{ fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {getName(chat)}
                    </strong>
                    <Badge tone={chat.type === 'group' ? 'warn' : 'brand'}>
                      {chat.type === 'group' ? `${chat.participants?.length || 0} anggota` : 'Personal'}
                    </Badge>
                    {chat.unread_count > 0 && (
                      <Badge tone="brand">{chat.unread_count} baru</Badge>
                    )}
                  </div>
                  <div style={{
                    fontSize: 12, color: 'var(--text-muted)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {getPreview(chat)}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 56, textAlign: 'right' }}>
                    {formatDate(chat.last_message_at)}
                  </span>
                  <button
                    onClick={() => handleViewChat(chat)}
                    disabled={actionLoading === chat.id}
                    style={iconBtn}
                    title="Lihat detail"
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteChat(chat.id)}
                    disabled={actionLoading === chat.id}
                    style={{ ...iconBtn, color: '#EF4444', borderColor: 'rgba(239,68,68,.35)' }}
                    title="Hapus chat"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modal detail */}
      {showDetail && selectedChat && (
        <div
          onClick={() => setShowDetail(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)',
            backdropFilter: 'blur(4px)', zIndex: 100,
            display: 'grid', placeItems: 'center', padding: 20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              width: '100%', maxWidth: 640, maxHeight: '85vh',
              display: 'flex', flexDirection: 'column',
              boxShadow: 'var(--shadow)',
            }}
          >
            {/* Modal header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: 16, borderBottom: '1px solid var(--border)',
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16 }}>{getName(selectedChat)}</h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                  {selectedChat.type === 'group'
                    ? `${selectedChat.participants?.length || 0} anggota`
                    : 'Personal Chat'}
                </p>
              </div>
              <button onClick={() => setShowDetail(false)} style={iconBtn}>
                <X size={14} />
              </button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 16, background: 'var(--bg)' }}>
              {actionLoading === selectedChat.id ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>Memuat pesan…</div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>Belum ada pesan</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {messages.map(msg => (
                    <div key={msg.id} style={{ display: 'flex', gap: 10 }}>
                      <div className="avatar" style={{
                        width: 32, height: 32, borderRadius: 10,
                        display: 'grid', placeItems: 'center',
                        background: 'var(--brand)',
                        color: 'white',
                        fontSize: 10, fontWeight: 'bold', flexShrink: 0,
                      }}>
                        {msg.sender_name ? initials(msg.sender_name) : '??'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: 13 }}>{msg.sender_name || 'Unknown'}</strong>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                            {new Date(msg.created_at).toLocaleString('id-ID')}
                          </span>
                          {msg.classification_label === 'Berisiko' && (
                            <Badge tone="danger"><AlertTriangle size={10} style={{ marginRight: 4 }} />Berisiko</Badge>
                          )}
                          {msg.is_destroyed && <Badge tone="danger">⚠️ Dihancurkan</Badge>}
                        </div>
                        <div style={{
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          padding: '8px 12px', borderRadius: 10,
                          fontSize: 13, color: msg.is_destroyed ? '#EF4444' : 'var(--text)',
                          fontStyle: !msg.content || msg.is_destroyed ? 'italic' : 'normal',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}>
                          {msg.is_destroyed ? (
                            '[Konten berbahaya telah dihancurkan]'
                          ) : msg.content ? msg.content : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                              <Lock size={12} /> [Pesan Terenkripsi End-to-End]
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const iconBtn: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  width: 30, height: 30, borderRadius: 8,
  display: 'grid', placeItems: 'center',
  cursor: 'pointer',
};

export default Chats;