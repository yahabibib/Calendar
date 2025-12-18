import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { CalendarEvent } from '../types/event';
import { COLORS, SPACING, COMMON_STYLES } from '../theme';

// --- 子组件：单条日程卡片 ---
const EventCard = ({ item, onPress }: { item: CalendarEvent; onPress: () => void }) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    <View style={styles.cardTime}>
      <Text style={styles.timeText}>
        {new Date(item.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
      </Text>
    </View>
    <View style={styles.cardContent}>
      <Text style={styles.title}>{item.title}</Text>
      {item.location && <Text style={styles.location}>📍 {item.location}</Text>}
    </View>
  </TouchableOpacity>
);

// --- 主组件：列表容器 ---
interface EventListProps {
  date: string;
  events: CalendarEvent[];
  onEventPress: (event: CalendarEvent) => void;
}

export const EventList: React.FC<EventListProps> = ({ date, events, onEventPress }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>
        {date} 的日程 ({events.length})
      </Text>
      
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <EventCard item={item} onPress={() => onEventPress(item)} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>今天没有安排日程</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginLeft: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  // 卡片样式
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    padding: SPACING.md,
    marginBottom: SPACING.sm + 4,
    borderRadius: 12,
    alignItems: 'center',
    ...COMMON_STYLES.shadow,
  },
  cardTime: {
    marginRight: SPACING.md,
    paddingRight: SPACING.md,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  timeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  cardContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  location: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: COLORS.textLight,
  }
});