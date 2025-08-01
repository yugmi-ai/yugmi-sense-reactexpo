import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainTabParamList } from '../types';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { apiClient, queryKeys } from '../lib/api';
import { MediaWithAnalysis } from '../types';
import { useAuth } from '../lib/authContext';
import { useTheme } from '@crossbuildui/core';
import type { ThemeColors } from '@crossbuildui/core';
import { Avatar } from '../crossbuildui/avatar';

const { width } = Dimensions.get('window');

type DashboardScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Dashboard'>;

const DashboardScreen = () => {
  // Get the safe area insets for padding
  const insets = useSafeAreaInsets();

  const { colors } = useTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const { user } = useAuth();
  const [location, setLocation] = React.useState<Location.LocationObject | null>(null);
  const [address, setAddress] = React.useState<string>('Getting location...');

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: queryKeys.stats,
    queryFn: () => apiClient.getStats(),
  });

  const {
    data: mediaData,
    isLoading: mediaLoading,
    refetch: refetchMedia
  } = useQuery({
    queryKey: queryKeys.media,
    queryFn: () => apiClient.getMedia(1, 10),
  });

  const recentMedia = mediaData?.mediaItems?.slice(0, 3) || [];

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setAddress('Location permission denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);

      // Reverse geocode to get address
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const { street, city, region } = reverseGeocode[0];
        setAddress(`${street || ''} ${city || ''} ${region || ''}`.trim() || 'Unknown location');
      }
    } catch (error) {
      console.error('Error getting location:', error);
      setAddress('Location unavailable');
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days} days ago`;
    if (hours > 0) return `${hours} hours ago`;
    return 'Recently';
  };

  const getIssueType = (media: MediaWithAnalysis) => {
    if (media.analysis?.detectedIssues && media.analysis.detectedIssues.length > 0) {
      const issue = media.analysis.detectedIssues[0];
      return {
        type: issue.type.replace('_', ' '),
        severity: issue.severity
      };
    }
    return null;
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

  const onRefresh = () => {
    refetchStats();
    refetchMedia();
    getCurrentLocation();
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      refreshControl={
        <RefreshControl
          refreshing={statsLoading || mediaLoading}
          onRefresh={onRefresh}
        />
      }
    >

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Yugmi Sense</Text>
          <Text style={styles.subtitle}>
            {user?.fullName ? `Welcome, ${user.fullName}` : 'Field Inspection Dashboard'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Profile')}
        >
          <Avatar
            size='md'
            name={user?.fullName || 'User'}
          />
        </TouchableOpacity>
      </View>

      {/* Status Bar */}
      <View style={styles.statusBar}>
        <View style={styles.statusLeft}>
          <Ionicons name="location-outline" size={16} color="white" />
          <Text style={styles.statusText} numberOfLines={1}>
            {address}
          </Text>
        </View>
        <View style={styles.statusRight}>
          <View style={styles.onlineIndicator} />
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: '#DBEAFE' }]}>
          <Text style={[styles.statValue, { color: '#1D4ED8' }]}>
            {statsLoading ? '...' : stats?.imagesCount || 0}
          </Text>
          <Text style={styles.statLabel}>Images</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#D1FAE5' }]}>
          <Text style={[styles.statValue, { color: '#059669' }]}>
            {statsLoading ? '...' : stats?.videosCount || 0}
          </Text>
          <Text style={styles.statLabel}>Videos</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FED7AA' }]}>
          <Text style={[styles.statValue, { color: '#EA580C' }]}>
            {statsLoading ? '...' : stats?.issuesCount || 0}
          </Text>
          <Text style={styles.statLabel}>Issues</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Camera')}
          >
            <Ionicons name="camera-outline" size={32} color="#1D4ED8" />
            <Text style={styles.actionText}>Capture Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Camera', { mode: 'video' })}
          >
            <Ionicons name="videocam-outline" size={32} color="#1D4ED8" />
            <Text style={styles.actionText}>Record Video</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Gallery')}
          >
            <Ionicons name="images-outline" size={32} color="#1D4ED8" />
            <Text style={styles.actionText}>View Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Reports')}
          >
            <Ionicons name="document-text-outline" size={32} color="#1D4ED8" />
            <Text style={styles.actionText}>Generate Report</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { marginTop: 8, }]}>Recent Activity</Text>
        {mediaLoading ? (
          <View style={styles.loadingContainer}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={styles.loadingCard}>
                <View style={styles.loadingImage} />
                <View style={styles.loadingContent}>
                  <View style={styles.loadingLine} />
                  <View style={[styles.loadingLine, { width: '60%' }]} />
                </View>
              </View>
            ))}
          </View>
        ) : recentMedia.length > 0 ? (
          <View style={styles.recentList}>
            {recentMedia.map((media) => {
              const issue = getIssueType(media);

              return (
                <TouchableOpacity
                  key={media.id}
                  style={styles.recentCard}
                  onPress={() => navigation.navigate('MediaDetail', { id: media.id })}
                >
                  <View style={styles.recentImage}>
                    <Ionicons
                      name={media.type === 'video' ? 'videocam' : 'image'}
                      size={24}
                      color="#6B7280"
                    />
                  </View>
                  <View style={styles.recentContent}>
                    <Text style={styles.recentTitle}>
                      {issue ? `${issue.type} detected` : 'Media captured'}
                    </Text>
                    <Text style={styles.recentTime}>
                      {formatTimeAgo(media.createdAt)}
                    </Text>
                    <View style={styles.recentTags}>
                      {issue && (
                        <View style={[styles.tag, { backgroundColor: getSeverityColor(issue.severity) }]}>
                          <Text style={styles.tagText}>{issue.severity}</Text>
                        </View>
                      )}
                      {media.locationName && (
                        <View style={[styles.tag, { backgroundColor: '#6B7280' }]}>
                          <Text style={styles.tagText}>{media.locationName}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="camera-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>No recent activity</Text>
            <Text style={styles.emptySubtext}>Start capturing to see your work here</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  statusBar: {
    backgroundColor: colors.primary.DEFAULT,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileButton: {
    padding: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontFamily:'Montserrat-Regular',
    marginLeft: 8,
    flex: 1,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontFamily:'Montserrat-Semibold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    fontFamily: 'Montserrat-Regular',
  },
  statsGrid: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
  },
  statCard: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    width: (width - 48) / 3,
  },
  statValue: {
    fontSize: 22,
    fontFamily:'Montserrat-Semibold',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    fontFamily:'Montserrat-Regular',
  },
  section: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily:'Montserrat-Bold',
    color: colors.foreground,
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: colors.background,
    width: (width - 48) / 2,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
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
  actionText: {
    fontSize: 14,
    fontFamily:'Montserrat-Medium',
    color: '#111827',
    marginTop: 8,
  },
  loadingContainer: {
    gap: 12,
  },
  loadingCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  loadingContent: {
    flex: 1,
    marginLeft: 12,
  },
  loadingLine: {
    height: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
  },
  recentList: {
    gap: 12,
  },
  recentCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
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
  recentImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentContent: {
    flex: 1,
    marginLeft: 12,
  },
  recentTitle: {
    fontSize: 14,
    fontFamily:'Montserrat-Medium',
    color: '#111827',
  },
  recentTime: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily:'Montserrat-Regular',
    marginTop: 2,
  },
  recentTags: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 4,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontFamily:'Montserrat-Medium',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    fontFamily:'Montserrat-Regular',
  },
});

export default DashboardScreen;
