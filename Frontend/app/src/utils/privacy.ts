import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16 },

  // Hero
  hero: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FF6B3520',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  heroTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  heroSub: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 14 },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  heroBadgeText: { fontSize: 12, color: '#FF6B35', fontWeight: '500' },

  // Accordion
  sections: { gap: 10, marginBottom: 20 },
  accordionItem: {
    borderRadius: 14,
    borderWidth: 0.5,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  sectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: { flex: 1, fontSize: 14, fontWeight: '600' },
  accordionBody: {
    borderTopWidth: 0.5,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  bodyText: { fontSize: 13, lineHeight: 21 },

  // Contact
  contactCard: {
    borderRadius: 16,
    borderWidth: 0.5,
    padding: 20,
    alignItems: 'center',
  },
  contactTitle: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
  contactSub: { fontSize: 13, textAlign: 'center', lineHeight: 19, marginBottom: 16 },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 25,
  },
  contactBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});