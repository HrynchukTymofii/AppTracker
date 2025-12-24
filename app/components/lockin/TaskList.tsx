import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Plus, Calendar } from "lucide-react-native";
import { LockInTask } from "@/context/LockInContext";
import { TaskCard } from "./TaskCard";

interface TaskListProps {
  tasks: LockInTask[];
  isDark: boolean;
  onAddTask: () => void;
  onTaskPress: (task: LockInTask) => void;
  onTaskLongPress: (task: LockInTask) => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  isDark,
  onAddTask,
  onTaskPress,
  onTaskLongPress,
}) => {
  return (
    <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Calendar size={20} color={isDark ? "#ffffff" : "#111827"} />
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: isDark ? "#ffffff" : "#111827",
              marginLeft: 8,
            }}
          >
            Scheduled LockIns
          </Text>
        </View>
        <TouchableOpacity
          onPress={onAddTask}
          activeOpacity={0.7}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#3b82f6",
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 10,
          }}
        >
          <Plus size={16} color="#ffffff" />
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: "#ffffff",
              marginLeft: 6,
            }}
          >
            LockIn
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tasks or Empty State */}
      {tasks.length > 0 ? (
        tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            isDark={isDark}
            onPress={() => onTaskPress(task)}
            onLongPress={() => onTaskLongPress(task)}
          />
        ))
      ) : (
        <TouchableOpacity
          onPress={onAddTask}
          activeOpacity={0.8}
          style={{
            backgroundColor: isDark
              ? "rgba(59, 130, 246, 0.08)"
              : "rgba(59, 130, 246, 0.05)",
            borderRadius: 16,
            padding: 28,
            alignItems: "center",
            borderWidth: 1.5,
            borderColor: "rgba(59, 130, 246, 0.3)",
            borderStyle: "dashed",
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              backgroundColor: "#3b82f6",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 14,
            }}
          >
            <Calendar size={28} color="#ffffff" />
          </View>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: "#3b82f6",
              marginBottom: 6,
            }}
          >
            Schedule a LockIn
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: isDark ? "#6b7280" : "#9ca3af",
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            Plan recurring focus sessions{"\n"}with reminders
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default TaskList;
