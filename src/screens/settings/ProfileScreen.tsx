import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';
import { ThemeColors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';

interface ProfileScreenProps {
  onGoBack: () => void;
}

export default function ProfileScreen({ onGoBack }: ProfileScreenProps) {
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const [displayName, setDisplayName] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleSave = () => {
    // TODO: Implement profile update with Supabase
    Alert.alert('保存完了', 'プロフィールを更新しました');
    setIsEditing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>プロフィール</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <MaterialCommunityIcons name="account" size={48} color={colors.white} />
          </View>
          <TouchableOpacity style={styles.changeAvatarButton}>
            <Text style={styles.changeAvatarText}>写真を変更</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>アカウント情報</Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>メールアドレス</Text>
            <View style={styles.fieldValueContainer}>
              <Text style={styles.fieldValue}>{user?.email || '未設定'}</Text>
              <MaterialCommunityIcons name="lock" size={16} color={colors.textSecondary} />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>表示名</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="表示名を入力"
                placeholderTextColor={colors.textSecondary}
              />
            ) : (
              <View style={styles.fieldValueContainer}>
                <Text style={styles.fieldValue}>{displayName || '未設定'}</Text>
                <TouchableOpacity onPress={() => setIsEditing(true)}>
                  <MaterialCommunityIcons name="pencil" size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>登録日</Text>
            <Text style={styles.fieldValue}>
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString('ja-JP')
                : '不明'}
            </Text>
          </View>
        </View>

        {isEditing && (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setIsEditing(false)}
            >
              <Text style={styles.cancelButtonText}>キャンセル</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>保存</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.dangerSection}>
          <Text style={styles.dangerTitle}>アカウント削除</Text>
          <Text style={styles.dangerDescription}>
            アカウントを削除すると、すべてのデータが完全に削除されます。この操作は取り消せません。
          </Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => Alert.alert('確認', 'アカウント削除機能は準備中です')}
          >
            <Text style={styles.deleteButtonText}>アカウントを削除</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backButton: {
    padding: spacing.xs,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  placeholder: {
    width: 32,
  },
  content: {
    padding: spacing.lg,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  changeAvatarButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  changeAvatarText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  field: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  fieldValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldValue: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.inputBackground,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  dangerSection: {
    backgroundColor: colors.errorBackground,
    borderRadius: 12,
    padding: spacing.lg,
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
    marginBottom: spacing.sm,
  },
  dangerDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '500',
  },
});
