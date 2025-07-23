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
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useQuery } from '@tanstack/react-query';
import { MainTabParamList } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { apiClient, queryKeys } from '../lib/api';
import { MediaWithAnalysis } from '../types';

const { width } = Dimensions.get('window');
const itemSize = (width - 48) / 3; // 3 columns with padding

type GalleryScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Gallery'>;

const GalleryScreen = () => {
  const navigation = useNavigation<GalleryScreenNavigationProp>();
  const [filter, setFilter] = useState<'all' | 'photos' | 'videos' | 'issues'>('all');

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
    }, [refetch])
  );

  const allMedia = mediaData?.mediaItems || [];

  const filteredMedia = React.useMemo(() => {
    switch (filter) {
      case 'photos':
        return allMedia.filter(item => item.type === 'image');
      case 'videos':
        return allMedia.filter(item => item.type === 'video');
      case 'issues':
        return allMedia.filter(item => 
          item.analysis?.detectedIssues && item.analysis.detectedIssues.length > 0
        );
      default:
        return allMedia;
    }
  }, [allMedia, filter]);

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getIssueCount = (media: MediaWithAnalysis) => {
    return media.analysis?.detectedIssues?.length || 0;
  };

  const getHighestSeverity = (media: MediaWithAnalysis) => {
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

  const renderMediaItem = ({ item }: { item: MediaWithAnalysis }) => {
    const issueCount = getIssueCount(item);
    const highestSeverity = getHighestSeverity(item);
    
    return (
      <TouchableOpacity
        style={styles.mediaItem}
          onPress={() => navigation.navigate('MediaDetail', { id: item.id })}
      >
        <View style={styles.mediaContainer}>
          <Image
            source={{ uri: apiClient.getMediaFileUrl(item.id, 'thumbnail') }}
            style={styles.mediaImage}
            resizeMode="cover"
          />
          
          {/* Media Type Indicator */}
          <View style={styles.mediaTypeIndicator}>
            <Ionicons
              name={item.type === 'video' ? 'videocam' : 'image'}
              size={16}
              color="white"
            />
          </View>

          {/* Issue Badge */}
          {issueCount > 0 && (
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
          {item.locationName && (
            <Text style={styles.mediaLocation} numberOfLines={1}>
              {item.locationName}
            </Text>
          )}
        </View>
      </TouchableOpacity>
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
            <View style={styles.loadingImage} />
          </View>
        )}
        keyExtractor={(_, index) => `loading-${index}`}
      />
    </View>
  );

  if (isLoading) {
    return renderLoadingState();
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Gallery</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Camera')}
          style={styles.headerButton}
        >
          <Ionicons name="camera" size={24} color="#1D4ED8" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All ({allMedia.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterTab, filter === 'photos' && styles.filterTabActive]}
          onPress={() => setFilter('photos')}
        >
          <Text style={[styles.filterText, filter === 'photos' && styles.filterTextActive]}>
            Photos ({allMedia.filter(item => item.type === 'image').length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterTab, filter === 'videos' && styles.filterTabActive]}
          onPress={() => setFilter('videos')}
        >
          <Text style={[styles.filterText, filter === 'videos' && styles.filterTextActive]}>
            Videos ({allMedia.filter(item => item.type === 'video').length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterTab, filter === 'issues' && styles.filterTabActive]}
          onPress={() => setFilter('issues')}
        >
          <Text style={[styles.filterText, filter === 'issues' && styles.filterTextActive]}>
            Issues ({allMedia.filter(item => getIssueCount(item) > 0).length})
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
    fontSize: 24,
    fontWeight: '600',
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
});

export default GalleryScreen;
