import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Image,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LocalMedia, MainTabParamList } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { apiClient, queryKeys } from '../lib/api';
import { aiService } from '../lib/aiService';
import { MediaWithAnalysis, AiAnalysis } from '../types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeColors, useTheme } from '@crossbuildui/core';
import { Skeleton } from '../crossbuildui/skeleton';
import * as FileSystem from 'expo-file-system';

const { width } = Dimensions.get('window');
const itemSize = (width - 48) / 3; // 3 columns with padding

type GalleryScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Gallery'>;

const GalleryScreen = () => {
  const insets = useSafeAreaInsets();

  const { colors } = useTheme();

  const styles = getStyles(colors);

  const navigation = useNavigation<GalleryScreenNavigationProp>();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'photos' | 'videos' | 'issues'>('all');
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState({ current: 0, total: 0 });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [localMedia, setLocalMedia] = useState<LocalMedia[]>([]);

  const {
    data: mediaData,
    isLoading,
    refetch
  } = useQuery({
    queryKey: [...queryKeys.media, filter],
    queryFn: () => apiClient.getMedia(1, 20),
  });

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetch();
      loadLocalMedia();
    }, [refetch])
  );

  const loadLocalMedia = async () => {
    try {
      const photoDir = `${FileSystem.documentDirectory}photos`;
      const videoDir = `${FileSystem.documentDirectory}videos`;

      const [photoFiles, videoFiles] = await Promise.all([
        FileSystem.readDirectoryAsync(photoDir).catch(() => []),
        FileSystem.readDirectoryAsync(videoDir).catch(() => []),
      ]);

      // Get file info for each file to get actual creation/modification time
      const getFileWithInfo = async (dir: string, filename: string, type: 'image' | 'video') => {
        try {
          const fileUri = `${dir}/${filename}`;
          const fileInfo = await FileSystem.getInfoAsync(fileUri);

          return {
            uri: fileUri,
            type,
            id: `local-${filename}`,
            isLocal: true,
            createdAt: fileInfo.modificationTime
              ? new Date(fileInfo.modificationTime * 1000).toISOString()
              : new Date().toISOString() // Fallback to current time if no modification time
          };
        } catch (error) {
          console.error(`Error getting file info for ${filename}:`, error);
          // Fallback to current time if we can't get file info
          return {
            uri: `${dir}/${filename}`,
            type,
            id: `local-${filename}`,
            isLocal: true,
            createdAt: new Date().toISOString()
          };
        }
      };

      const [photoMediaPromises, videoMediaPromises] = [
        photoFiles.map(file => getFileWithInfo(photoDir, file, 'image')),
        videoFiles.map(file => getFileWithInfo(videoDir, file, 'video'))
      ];

      const [photoMedia, videoMedia] = await Promise.all([
        Promise.all(photoMediaPromises),
        Promise.all(videoMediaPromises)
      ]);

      const media: LocalMedia[] = [...photoMedia, ...videoMedia];
      setLocalMedia(media);
    } catch (error) {
      console.error('Error loading local media:', error);
    }
  };

  const allMedia = mediaData?.mediaItems || [];

  const filteredMedia: (MediaWithAnalysis | LocalMedia)[] = React.useMemo(() => {
    const localFiltered = localMedia.filter(item => {
      if (filter === 'photos') return item.type === 'image';
      if (filter === 'videos') return item.type === 'video';
      return filter === 'all';
    });

    if (filter === 'issues') {
      return allMedia.filter(item =>
        item.analysis?.detectedIssues && item.analysis.detectedIssues.length > 0
      );
    }

    return [...allMedia, ...localFiltered];
  }, [allMedia, localMedia, filter]);

  // Type guard to check if item is MediaWithAnalysis
  const isMediaWithAnalysis = (item: MediaWithAnalysis | LocalMedia): item is MediaWithAnalysis => {
    return !item.isLocal;
  };

  const formatDate = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Unknown date';
      }
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown date';
    }
  };

  const getIssueCount = (media: MediaWithAnalysis | LocalMedia): number => {
    if (!isMediaWithAnalysis(media)) {
      return 0; // Local media has no analysis
    }
    return media.analysis?.detectedIssues?.length || 0;
  };

  const getHighestSeverity = (media: MediaWithAnalysis | LocalMedia): string | null => {
    if (!isMediaWithAnalysis(media)) {
      return null; // Local media has no analysis
    }

    if (!media.analysis?.detectedIssues || media.analysis.detectedIssues.length === 0) {
      return null;
    }

    const severityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
    const highest = media.analysis.detectedIssues.reduce((prev, current) =>
      (severityOrder[current.severity] || 0) > (severityOrder[prev.severity] || 0) ? current : prev
    );

    return highest.severity;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#DC2626';
      case 'high': return '#EA580C';
      case 'medium': return '#D97706';
      case 'low': return '#65A30D';
      default: return '#6B7280';
    }
  };

  // Bulk analysis functions
  const startBulkAnalysis = async () => {
    const unanalyzedMedia = allMedia.filter(
      item =>
        !item.analysis ||
        !item.analysis.detectedObjects ||
        item.analysis.detectedObjects.length === 0
    );

    if (unanalyzedMedia.length === 0) {
      Alert.alert('All Analyzed', 'All your media has already been analyzed!');
      return;
    }

    Alert.alert(
      'Bulk Analysis',
      `Analyze ${unanalyzedMedia.length} media items for issues and defects?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Analyze',
          onPress: () => performBulkAnalysis(unanalyzedMedia)
        }
      ]
    );
  };

  const performBulkAnalysis = async (mediaItems: MediaWithAnalysis[]) => {
    setIsAnalyzing(true);
    setAnalysisProgress({ current: 0, total: mediaItems.length });
    setShowAnalysisModal(true);

    try {
      for (let i = 0; i < mediaItems.length; i++) {
        const item = mediaItems[i];
        setAnalysisProgress({ current: i + 1, total: mediaItems.length });

        try {
          // Get the full image URL for analysis
          const imageUrl = apiClient.getMediaFileUrl(item.id, 'original');
          const analysis = await aiService.analyzeImage(imageUrl, item.type);

          // Update the media item with analysis (you'd normally save this to your backend)
          console.log(`Analysis complete for ${item.originalName}:`, analysis);

        } catch (error) {
          console.error(`Analysis failed for ${item.originalName}:`, error);
        }

        // Small delay to prevent overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Refresh the data after analysis
      await refetch();
      queryClient.invalidateQueries({ queryKey: queryKeys.stats });

      Alert.alert('Analysis Complete', `Analyzed ${mediaItems.length} media items successfully!`);

    } catch (error) {
      console.error('Bulk analysis failed:', error);
      Alert.alert('Analysis Failed', 'Some items could not be analyzed. Please try again.');
    } finally {
      setIsAnalyzing(false);
      setShowAnalysisModal(false);
      setAnalysisProgress({ current: 0, total: 0 });
    }
  };

  const generateReport = async () => {
    const mediaWithIssues = allMedia.filter(item => getIssueCount(item) > 0);

    if (mediaWithIssues.length === 0) {
      Alert.alert('No Issues', 'No issues found to include in report.');
      return;
    }

    // Navigate to reports and create a new report
    navigation.navigate('Reports');

    // You could also directly trigger report creation here
    Alert.alert(
      'Report Generated',
      `Found ${mediaWithIssues.length} media items with issues. Check the Reports tab.`
    );
  };

  const renderMediaItem = ({ item }: { item: MediaWithAnalysis | LocalMedia }) => {
    const issueCount = getIssueCount(item);
    const highestSeverity = getHighestSeverity(item);

    const sourceUri = item.isLocal ? item.uri! : apiClient.getMediaFileUrl(item.id, 'original');

    return (
      <Skeleton isLoaded={!isLoading} style={{
        width: itemSize,
        height: itemSize,
        marginBottom: 12,
        marginHorizontal: 4,
      }}>
        <TouchableOpacity
          style={styles.mediaItem}
          onPress={() => {
            if (item.isLocal) {
              Alert.alert('Local Media', 'Opening local file preview not implemented.');
            } else {
              navigation.navigate('MediaDetail', { id: item.id });
            }
          }}
        >
          <View style={styles.mediaContainer}>
            <Image
              source={{ uri: sourceUri }}
              style={styles.mediaImage}
              resizeMode="cover"
            />

            <View style={styles.mediaTypeIndicator}>
              <Ionicons
                name={item.type === 'video' ? 'videocam' : 'image'}
                size={16}
                color="white"
              />
            </View>

            {!item.isLocal && issueCount > 0 && (
              <View style={[
                styles.issueBadge,
                { backgroundColor: getSeverityColor(highestSeverity!) }
              ]}>
                <Text style={styles.issueBadgeText}>{issueCount}</Text>
              </View>
            )}
          </View>

          <View style={styles.mediaInfo}>
            <Text style={styles.mediaDate} numberOfLines={1}>
              {formatDate(item.createdAt)}
            </Text>
            {!item.isLocal && isMediaWithAnalysis(item) && item.locationName && (
              <Text style={styles.mediaLocation} numberOfLines={1}>
                {item.locationName}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </Skeleton>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name={filter === 'issues' ? 'warning-outline' : 'images-outline'}
        size={64}
        color="#9CA3AF"
      />
      <Text style={styles.emptyTitle}>
        {filter === 'issues' ? 'No Issues Found' : 'No Media Found'}
      </Text>
      <Text style={styles.emptySubtext}>
        {filter === 'issues'
          ? 'All your media looks good!'
          : 'Start capturing photos and videos to see them here'
        }
      </Text>
      {filter !== 'all' && (
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => navigation.navigate('Camera')}
        >
          <Text style={styles.emptyButtonText}>Capture Media</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <FlatList
        data={Array(12).fill(null)}
        numColumns={3}
        renderItem={() => (
          <View style={[styles.mediaItem, styles.loadingItem]}>
            <Skeleton isLoaded={false} style={styles.loadingImage} >
              <></>
            </Skeleton>
          </View>
        )}
        keyExtractor={(_, index) => `loading-${index}`}
      />
    </View>
  );

  // Get counts for filter tabs
  const allCount = allMedia.length + localMedia.length;
  const photosCount = allMedia.filter(item => item.type === 'image').length +
    localMedia.filter(item => item.type === 'image').length;
  const videosCount = allMedia.filter(item => item.type === 'video').length +
    localMedia.filter(item => item.type === 'video').length;
  const issuesCount = allMedia.filter(item => getIssueCount(item) > 0).length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Gallery</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={startBulkAnalysis}
            style={[styles.headerButton, { marginRight: 8 }]}
            disabled={isAnalyzing}
          >
            <Ionicons name="analytics" size={20} color="#1D4ED8" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={generateReport}
            style={[styles.headerButton, { marginRight: 8 }]}
          >
            <Ionicons name="document-text" size={20} color="#1D4ED8" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Camera')}
            style={styles.headerButton}
          >
            <Ionicons name="camera" size={20} color="#1D4ED8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All ({allCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === 'photos' && styles.filterTabActive]}
          onPress={() => setFilter('photos')}
        >
          <Text style={[styles.filterText, filter === 'photos' && styles.filterTextActive]}>
            Photos ({photosCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === 'videos' && styles.filterTabActive]}
          onPress={() => setFilter('videos')}
        >
          <Text style={[styles.filterText, filter === 'videos' && styles.filterTextActive]}>
            Videos ({videosCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === 'issues' && styles.filterTabActive]}
          onPress={() => setFilter('issues')}
        >
          <Text style={[styles.filterText, filter === 'issues' && styles.filterTextActive]}>
            Issues ({issuesCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Media Grid */}
      {filteredMedia.length === 0 ? renderEmptyState() : (
        <FlatList
          data={filteredMedia}
          numColumns={3}
          renderItem={renderMediaItem}
          keyExtractor={(item) => `media-${item.id}`}
          contentContainerStyle={styles.mediaGrid}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} />
          }
        />
      )}

      {/* Analysis Progress Modal */}
      <Modal
        visible={showAnalysisModal}
        transparent
        animationType="fade"
        onRequestClose={() => { }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.analysisModal}>
            <View style={styles.analysisModalHeader}>
              <Ionicons name="analytics" size={32} color="#1D4ED8" />
              <Text style={styles.analysisModalTitle}>AI Analysis in Progress</Text>
            </View>

            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                Analyzing {analysisProgress.current} of {analysisProgress.total} items
              </Text>

              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${(analysisProgress.current / Math.max(analysisProgress.total, 1)) * 100}%`
                    }
                  ]}
                />
              </View>

              <Text style={styles.progressPercentage}>
                {Math.round((analysisProgress.current / Math.max(analysisProgress.total, 1)) * 100)}%
              </Text>
            </View>

            <ActivityIndicator size="large" color="#1D4ED8" style={{ marginTop: 16 }} />

            <Text style={styles.analysisModalSubtext}>
              Please wait while we analyze your media for issues and defects...
            </Text>
          </View>
        </View>
      </Modal>
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
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 22,
    fontFamily: 'Montserrat-Bold',
    color: '#111827',
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  filterTabActive: {
    borderBottomColor: '#1D4ED8',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#1D4ED8',
  },
  mediaGrid: {
    padding: 12,
  },
  mediaItem: {
    width: itemSize,
    marginBottom: 12,
    marginHorizontal: 4,
  },
  loadingItem: {
    opacity: 0.6,
  },
  mediaContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  mediaImage: {
    width: '100%',
    height: itemSize,
    backgroundColor: '#F3F4F6',
  },
  loadingImage: {
    width: '100%',
    height: itemSize,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
  },
  mediaTypeIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 4,
    padding: 4,
  },
  issueBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  issueBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  mediaInfo: {
    paddingTop: 4,
  },
  mediaDate: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  mediaLocation: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
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
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingFooter: {
    padding: 20,
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  analysisModal: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  analysisModalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  analysisModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 8,
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1D4ED8',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  analysisModalSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});

export default GalleryScreen;