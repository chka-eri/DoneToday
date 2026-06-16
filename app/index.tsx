import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const STORAGE_KEY = '@DoneToday:tasks';

type Task = {
  id: string;
  text: string;
  completed: boolean;
};

const lightColors = {
  bg: '#F0F9FF',
  surface: 'rgba(255,255,255,0.72)',
  surfaceBorder: 'rgba(255,255,255,0.9)',
  text: '#0C1222',
  textSecondary: '#5B6E8A',
  textMuted: '#9BABBE',
  primary: '#0EA5E9',
  primaryLight: '#38BDF8',
  primaryGlow: 'rgba(14,165,233,0.12)',
  success: '#10B981',
  successBg: 'rgba(16,185,129,0.12)',
  danger: '#EF4444',
  dangerBg: 'rgba(239,68,68,0.12)',
  cardShadow: '#0EA5E9',
  inputBg: 'rgba(14,165,233,0.06)',
  headerBg: '#0EA5E9',
  white: '#FFFFFF',
} as const;

const darkColors = {
  bg: '#0C1222',
  surface: 'rgba(255,255,255,0.07)',
  surfaceBorder: 'rgba(255,255,255,0.1)',
  text: '#F0F9FF',
  textSecondary: '#8BA3C4',
  textMuted: '#4A5F7A',
  primary: '#38BDF8',
  primaryLight: '#7DD3FC',
  primaryGlow: 'rgba(56,189,248,0.15)',
  success: '#34D399',
  successBg: 'rgba(52,211,153,0.2)',
  danger: '#F87171',
  dangerBg: 'rgba(248,113,113,0.2)',
  cardShadow: '#000000',
  inputBg: 'rgba(255,255,255,0.06)',
  headerBg: '#0369A1',
  white: '#FFFFFF',
} as const;

function ScaleButton({
  onPress,
  style,
  children,
  haptic,
  ...props
}: {
  onPress?: () => void;
  style?: any;
  children: React.ReactNode;
  haptic?: boolean;
  [key: string]: any;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.93, { damping: 14, stiffness: 250 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 14, stiffness: 250 });
  };

  const handlePress = () => {
    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        {...props}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

function SwipeDeleteAction({
  onDelete,
  colors,
}: {
  onDelete: () => void;
  colors: Record<string, string>;
}) {
  return (
    <View style={[swipeStyles.action, { backgroundColor: colors.danger }]}>
      <Pressable
        onPress={() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          onDelete();
        }}
        style={swipeStyles.actionButton}
      >
        <MaterialCommunityIcons name="delete-outline" size={22} color={colors.white} />
        <Text style={swipeStyles.actionText}>Delete</Text>
      </Pressable>
    </View>
  );
}

const swipeStyles = StyleSheet.create({
  action: {
    marginLeft: 8,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    width: 88,
    marginBottom: 10,
  },
  actionButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default function HomeScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = useMemo(() => (isDark ? darkColors : lightColors), [isDark]);

  const [taskInput, setTaskInput] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored) setTasks(JSON.parse(stored));
    });
  }, []);

  const persist = useCallback(async (updated: Task[]) => {
    setTasks(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const addTask = () => {
    const trimmed = taskInput.trim();
    if (!trimmed) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const newTask = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      text: trimmed,
      completed: false,
    };
    persist([newTask, ...tasks]);
    setTaskInput('');
  };

  const toggleTask = (taskId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    persist(tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)));
  };

  const deleteTask = (taskId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    persist(tasks.filter((t) => t.id !== taskId));
  };

  const hasInput = taskInput.trim().length > 0;

  const s = useMemo(
    () => ({
      container: { flex: 1, backgroundColor: colors.bg },
      headerSection: {
        backgroundColor: colors.headerBg,
        paddingTop: 20,
        paddingBottom: 28,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        marginBottom: 4,
        ...Platform.select({
          ios: {
            shadowColor: colors.headerBg,
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.35,
            shadowRadius: 28,
          },
          android: { elevation: 12 },
        }),
      },
      headerTitle: { fontSize: 32, fontWeight: '800', color: colors.white, letterSpacing: -0.5 },
      headerSub: { fontSize: 15, color: 'rgba(255,255,255,0.7)', marginTop: 2, fontWeight: '500' },
      headerRight: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '700' },
      inputCard: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.surfaceBorder,
        borderRadius: 20,
        padding: 18,
        marginHorizontal: 16,
        marginTop: -14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        ...Platform.select({
          ios: {
            shadowColor: colors.cardShadow,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: isDark ? 0.3 : 0.1,
            shadowRadius: 24,
          },
          android: { elevation: 8 },
        }),
      },
      input: {
        flex: 1,
        fontSize: 16,
        color: colors.text,
        paddingVertical: 10,
      },
      addButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
      },
      addButtonDisabled: { opacity: 0.4 },
      taskCard: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.surfaceBorder,
        borderRadius: 18,
        padding: 16,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        ...Platform.select({
          ios: {
            shadowColor: colors.cardShadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.25 : 0.08,
            shadowRadius: 16,
          },
          android: { elevation: 4 },
        }),
      },
      taskTextContainer: { flex: 1, marginRight: 10 },
      taskText: { fontSize: 16, color: colors.text, lineHeight: 22, fontWeight: '500' },
      taskTextCompleted: {
        textDecorationLine: 'line-through',
        color: colors.textMuted,
        fontWeight: '400',
      },
      taskActions: { flexDirection: 'row', gap: 8 },
      actionButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
      },
      doneButton: { backgroundColor: colors.successBg },
      doneButtonActive: { backgroundColor: colors.success },
      undoButton: { backgroundColor: colors.primaryGlow },
      undoButtonActive: { backgroundColor: colors.primary },
      deleteButton: { backgroundColor: colors.dangerBg },
      buttonText: { fontSize: 13, fontWeight: '700', color: colors.text },
      buttonTextActive: { color: colors.white },
      emptyIcon: { color: colors.textMuted, marginBottom: 16 },
      emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        opacity: 0.6,
        marginBottom: 6,
      },
      emptySub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
      headerCircle: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.08)',
      },
      completedChip: {
        backgroundColor: colors.successBg,
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 2,
        alignSelf: 'flex-start',
        marginTop: 8,
      },
      completedChipText: { color: colors.success, fontSize: 11, fontWeight: '700' },
    }) as const,
    [colors, isDark]
  );

  const renderTask = ({ item, index }: { item: Task; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 60).springify().damping(16).stiffness(120)}>
      <Swipeable
        renderRightActions={() => (
          <SwipeDeleteAction onDelete={() => deleteTask(item.id)} colors={colors} />
        )}
        onSwipeableWillOpen={() =>
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        }
      >
        <Pressable
          onPress={() => toggleTask(item.id)}
          style={s.taskCard}
        >
          <MaterialCommunityIcons
            name={item.completed ? 'check-circle' : 'checkbox-blank-circle-outline'}
            size={22}
            color={item.completed ? colors.success : colors.textMuted}
            style={{ marginRight: 12 }}
          />
          <View style={s.taskTextContainer}>
            <Text style={[s.taskText, item.completed && s.taskTextCompleted]}>
              {item.text}
            </Text>
            {item.completed && (
              <View style={s.completedChip}>
                <Text style={s.completedChipText}>Done</Text>
              </View>
            )}
          </View>
          <View style={s.taskActions}>
            <ScaleButton
              onPress={() => toggleTask(item.id)}
              style={[
                s.actionButton,
                item.completed ? s.undoButton : s.doneButton,
              ]}
              haptic
            >
              <MaterialCommunityIcons
                name={item.completed ? 'undo' : 'check'}
                size={16}
                color={item.completed ? colors.primary : colors.success}
              />
              <Text
                style={[
                  s.buttonText,
                  {
                    color: item.completed ? colors.primary : colors.success,
                  },
                ]}
              >
                {item.completed ? 'Undo' : 'Done'}
              </Text>
            </ScaleButton>
            <ScaleButton
              onPress={() => deleteTask(item.id)}
              style={[s.actionButton, s.deleteButton]}
              haptic
            >
              <MaterialCommunityIcons name="delete-outline" size={16} color={colors.danger} />
              <Text style={[s.buttonText, { color: colors.danger }]}>Delete</Text>
            </ScaleButton>
          </View>
        </Pressable>
      </Swipeable>
    </Animated.View>
  );

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={s.container} edges={['top', 'left', 'right']}>
        <StatusBar style={isDark ? 'light' : 'dark'} />

        <View style={s.headerSection}>
          <View style={[s.headerCircle, { top: -30, right: -20, width: 140, height: 140 }]} />
          <View style={[s.headerCircle, { bottom: -40, left: -30, width: 180, height: 180 }]} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={28} color={colors.white} />
              <View>
                <Text style={s.headerTitle}>DoneToday</Text>
                <Text style={s.headerSub}>
                  {completedCount}/{tasks.length} tasks done
                </Text>
              </View>
            </View>
            {tasks.length > 0 && (
              <Text style={s.headerRight}>{completedCount === tasks.length ? 'All done!' : `${tasks.length - completedCount} left`}</Text>
            )}
          </View>
        </View>

        <KeyboardAvoidingView
          style={s.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <View style={s.inputCard}>
            <MaterialCommunityIcons name="plus-circle-outline" size={22} color={colors.textMuted} />
            <TextInput
              style={s.input}
              placeholder="Add a new task..."
              placeholderTextColor={colors.textMuted}
              value={taskInput}
              onChangeText={setTaskInput}
              onSubmitEditing={addTask}
              returnKeyType="done"
            />
            <ScaleButton
              onPress={addTask}
              style={[s.addButton, !hasInput && s.addButtonDisabled]}
              haptic={!!hasInput}
            >
              <MaterialCommunityIcons name="arrow-right" size={20} color={colors.white} />
            </ScaleButton>
          </View>

          <FlatList
            data={tasks}
            keyExtractor={(item) => item.id}
            renderItem={renderTask}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 16,
              paddingBottom: 24,
              flexGrow: tasks.length === 0 ? 1 : undefined,
            }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingTop: 60,
                }}
              >
                <MaterialCommunityIcons
                  name="clipboard-text-outline"
                  size={64}
                  color={colors.textMuted}
                  style={s.emptyIcon}
                />
                <Text style={s.emptyTitle}>No tasks yet</Text>
                <Text style={s.emptySub}>
                  Add something you want to get done today
                </Text>
              </View>
            }
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
