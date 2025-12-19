import { StyleSheet } from 'react-native'
import { COLORS } from '../../../../theme'

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  headerContainer: {
    backgroundColor: 'white',
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
    paddingBottom: 10,
  },
  navRow: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backArrow: {
    fontSize: 18,
    color: COLORS.primary,
    marginRight: 4,
    fontWeight: '600',
  },
  backText: {
    fontSize: 17,
    color: COLORS.primary,
    fontWeight: '600',
  },
  titleRow: {
    marginBottom: 5, // 周视图标题紧凑一点
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28, // 稍微比月视图小一点
    fontWeight: '800',
    color: '#000',
    letterSpacing: 0.5,
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginTop: 5,
    paddingBottom: 5,
  },
  weekDayText: {
    textAlign: 'center',
    color: '#3C3C4399',
    fontSize: 13,
    fontWeight: '600',
  },
  // 占位符，未来放 EventList
  schedulePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
  },
  placeholderText: {
    color: '#999',
    marginTop: 10,
  },
})
