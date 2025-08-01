import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { apiClient, queryKeys } from '../lib/api';
import { Report } from '../types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { ThemeColors, useTheme } from '@crossbuildui/core';

const ReportsScreen = () => {
  const insets = useSafeAreaInsets();

  const { colors } = useTheme();
  const styles = getStyles(colors);

  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newReport, setNewReport] = useState({
    title: '',
    type: 'inspection',
    includeImages: true,
    includeIssues: true,
    includeLocation: false,
  });

  const { data: reportsData, isLoading, refetch } = useQuery({
    queryKey: queryKeys.reports,
    queryFn: () => apiClient.getReports(1, 20),
  });

  const { data: statsData } = useQuery({
    queryKey: queryKeys.stats,
    queryFn: () => apiClient.getStats(),
  });

  const createReportMutation = useMutation({
    mutationFn: (reportData: any) => apiClient.createReport(reportData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reports });
      setShowCreateModal(false);
      setNewReport({
        title: '',
        type: 'inspection',
        includeImages: true,
        includeIssues: true,
        includeLocation: false,
      });
      Alert.alert('Success', 'Report created successfully');
    },
    onError: (error) => {
      console.error('Create report error:', error);
      Alert.alert('Error', 'Failed to create report. Please try again.');
    },
  });

  const reports = reportsData?.reports || [];

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'draft': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'checkmark-circle';
      case 'pending': return 'time';
      case 'draft': return 'document-text-outline';
      default: return 'document-text-outline';
    }
  };

  const handleCreateReport = () => {
    if (!newReport.title.trim()) {
      Alert.alert('Error', 'Please enter a report title');
      return;
    }

    const reportData = {
      ...newReport,
      content: {
        summary: `Auto-generated ${newReport.type} report`,
        mediaItems: [],
        issues: [],
      },
    };

    createReportMutation.mutate(reportData);
  };

  const renderReportItem = ({ item }: { item: Report }) => (
    <TouchableOpacity
      style={styles.reportCard}
      onPress={() => {
        Alert.alert(
          'Report Details',
          `Title: ${item.title}\nType: ${item.type}\nStatus: ${item.status}\nCreated: ${formatDate(item.createdAt)}`,
          [{ text: 'OK' }]
        );
      }}
    >
      <View style={styles.reportHeader}>
        <View style={styles.reportTitleContainer}>
          <Text style={styles.reportTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.reportType}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Ionicons
            name={getStatusIcon(item.status) as any}
            size={12}
            color="white"
          />
          <Text style={styles.statusText}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.reportMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={14} color="#6B7280" />
          <Text style={styles.metaText}>{formatDate(item.createdAt)}</Text>
        </View>

        {item.content && (
          <View style={styles.metaItem}>
            <Ionicons name="images-outline" size={14} color="#6B7280" />
            <Text style={styles.metaText}>
              {item.content.mediaItems?.length || 0} media items
            </Text>
          </View>
        )}

        {item.content && item.content.issues && item.content.issues.length > 0 && (
          <View style={styles.metaItem}>
            <Ionicons name="warning-outline" size={14} color="#EA580C" />
            <Text style={styles.metaText}>
              {item.content.issues.length} issues
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>No Reports Found</Text>
      <Text style={styles.emptySubtext}>
        Create your first report to track inspection progress
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => setShowCreateModal(true)}
      >
        <Text style={styles.emptyButtonText}>Create Report</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCreateModal = () => (
    <Modal
      visible={showCreateModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowCreateModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            onPress={() => setShowCreateModal(false)}
            style={styles.modalCloseButton}
          >
            <Text style={styles.modalCloseText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Create Report</Text>
          <TouchableOpacity
            onPress={handleCreateReport}
            style={styles.modalCreateButton}
            disabled={createReportMutation.isPending}
          >
            <Text style={styles.modalCreateText}>
              {createReportMutation.isPending ? 'Creating...' : 'Create'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Report Title *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Enter report title"
              value={newReport.title}
              onChangeText={(text) => setNewReport(prev => ({ ...prev, title: text }))}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Report Type</Text>
            <View style={styles.typeButtons}>
              {['inspection', 'maintenance', 'safety', 'quality'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    newReport.type === type && styles.typeButtonActive
                  ]}
                  onPress={() => setNewReport(prev => ({ ...prev, type }))}
                >
                  <Text style={[
                    styles.typeButtonText,
                    newReport.type === type && styles.typeButtonTextActive
                  ]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Include</Text>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Images and Videos</Text>
              <Switch
                value={newReport.includeImages}
                onValueChange={(value) => setNewReport(prev => ({ ...prev, includeImages: value }))}
                trackColor={{ false: '#E5E7EB', true: '#DBEAFE' }}
                thumbColor={newReport.includeImages ? '#1D4ED8' : '#9CA3AF'}
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Detected Issues</Text>
              <Switch
                value={newReport.includeIssues}
                onValueChange={(value) => setNewReport(prev => ({ ...prev, includeIssues: value }))}
                trackColor={{ false: '#E5E7EB', true: '#DBEAFE' }}
                thumbColor={newReport.includeIssues ? '#1D4ED8' : '#9CA3AF'}
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Location Data</Text>
              <Switch
                value={newReport.includeLocation}
                onValueChange={(value) => setNewReport(prev => ({ ...prev, includeLocation: value }))}
                trackColor={{ false: '#E5E7EB', true: '#DBEAFE' }}
                thumbColor={newReport.includeLocation ? '#1D4ED8' : '#9CA3AF'}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Reports</Text>
        <TouchableOpacity
          onPress={() => setShowCreateModal(true)}
          style={styles.headerButton}
        >
          <Ionicons name="add" size={24} color="#1D4ED8" />
        </TouchableOpacity>
      </View>

      {/* Stats Overview */}
      {statsData && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{reports.length}</Text>
            <Text style={styles.statLabel}>Total Reports</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {reports.filter(r => r.status === 'completed').length}
            </Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{statsData.issuesCount}</Text>
            <Text style={styles.statLabel}>Issues Found</Text>
          </View>
        </View>
      )}

      {/* Reports List */}
      {reports.length === 0 ? renderEmptyState() : (
        <FlatList
          data={reports}
          renderItem={renderReportItem}
          keyExtractor={(item) => `report-${item.id}`}
          contentContainerStyle={styles.reportsList}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} />
          }
        />
      )}

      {renderCreateModal()}
    </View>
  );
};

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Montserrat-Bold',
    color: colors.foreground,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 22,
    fontFamily: 'Montserrat-Semibold',
    color: colors.primary.DEFAULT,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Montserrat-Semibold',
    color: '#6B7280',
    marginTop: 4,
  },
  reportsList: {
    padding: 16,
  },
  reportCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reportTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  reportType: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  reportMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalCreateButton: {
    padding: 8,
  },
  modalCreateText: {
    fontSize: 16,
    color: '#1D4ED8',
    fontWeight: '500',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: 'white',
  },
  typeButtonActive: {
    backgroundColor: '#1D4ED8',
    borderColor: '#1D4ED8',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  typeButtonTextActive: {
    color: 'white',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 16,
    color: '#374151',
  },
});

export default ReportsScreen;
