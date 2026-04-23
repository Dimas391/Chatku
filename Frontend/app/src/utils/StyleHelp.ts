import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16 },

  hero: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  heroIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroTitle: { fontSize: 20, fontWeight: '700', marginBottom: 6 },
  heroSub: { fontSize: 13 },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 4,
  },

  // Contact cards
  contactRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  contactCard: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactLabel: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  contactSublabel: { fontSize: 10, textAlign: 'center' },

  // Search
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 0.5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14 },

  // Category chips
  categoryRow: { gap: 8, paddingBottom: 16 },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 0.5,
  },
  categoryText: { fontSize: 13, fontWeight: '500' },

  // FAQ
  faqList: { gap: 8, marginBottom: 20 },
  faqItem: { borderRadius: 14, borderWidth: 0.5, overflow: 'hidden' },
  faqHeader: {
    padding: 14,
    gap: 6,
  },
  faqCatBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 2,
  },
  faqCatText: { fontSize: 10, fontWeight: '600' },
  faqQuestion: { fontSize: 14, fontWeight: '500', lineHeight: 20 },
  faqBody: { borderTopWidth: 0.5, paddingHorizontal: 14, paddingVertical: 12 },
  faqAnswer: { fontSize: 13, lineHeight: 21 },

  emptyState: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyText: { fontSize: 13 },

  // Ticket
  ticketCard: {
    borderRadius: 16,
    borderWidth: 0.5,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  ticketTitle: { fontSize: 15, fontWeight: '600' },
  ticketSub: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  ticketBtn: {
    marginTop: 6,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 28,
    paddingVertical: 11,
    borderRadius: 25,
  },
  ticketBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});