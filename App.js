import React, { useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function App() {
  const [taskInput, setTaskInput] = useState('');
  const [tasks, setTasks] = useState([]);

  const addTask = () => {
    const trimmedText = taskInput.trim();

    if (!trimmedText) {
      return;
    }

    const newTask = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      text: trimmedText,
      completed: false,
    };

    setTasks((prevTasks) => [newTask, ...prevTasks]);
    setTaskInput('');
  };

  const toggleTask = (taskId) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const deleteTask = (taskId) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
  };

  const renderTask = ({ item }) => (
    <View style={styles.taskCard}>
      <Pressable
        style={styles.taskTextContainer}
        onPress={() => toggleTask(item.id)}
        android_ripple={{ color: '#f0f0f0' }}>
        <Text style={[styles.taskText, item.completed && styles.taskTextCompleted]}>
          {item.text}
        </Text>
      </Pressable>

      <View style={styles.taskActions}>
        <Pressable
          style={[styles.actionButton, styles.doneButton]}
          onPress={() => toggleTask(item.id)}>
          <Text style={styles.buttonText}>{item.completed ? 'Undo' : 'Done'}</Text>
        </Pressable>

        <Pressable
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => deleteTask(item.id)}>
          <Text style={styles.buttonText}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Text style={styles.header}>DoneToday</Text>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Enter a task"
            placeholderTextColor="#8b8b8b"
            value={taskInput}
            onChangeText={setTaskInput}
            onSubmitEditing={addTask}
            returnKeyType="done"
          />
          <Pressable style={styles.addButton} onPress={addTask}>
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </View>

        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={renderTask}
          contentContainerStyle={[
            styles.listContainer,
            tasks.length === 0 && styles.emptyListContainer,
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No tasks yet. Add something to DoneToday.
            </Text>
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: '#ffffff',
  },
  header: {
    fontSize: 34,
    fontWeight: '800',
    textAlign: 'center',
    color: '#1f2937',
    marginBottom: 20,
    letterSpacing: 0.3,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#d6d6d6',
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#fafafa',
    marginRight: 10,
  },
  addButton: {
    height: 48,
    minWidth: 84,
    borderRadius: 14,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 24,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 16,
    lineHeight: 22,
  },
  taskCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eceff3',
  },
  taskTextContainer: {
    marginBottom: 12,
    borderRadius: 8,
  },
  taskText: {
    fontSize: 16,
    color: '#111827',
    lineHeight: 22,
  },
  taskTextCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.55,
  },
  taskActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  doneButton: {
    backgroundColor: '#16a34a',
  },
  deleteButton: {
    backgroundColor: '#dc2626',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
