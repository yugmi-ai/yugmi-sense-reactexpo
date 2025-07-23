import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { apiClient, queryKeys } from '../lib/api';
import { MediaWithAnalysis } from '../types';

const MediaDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params as { id: number };

  const { data: mediaItem, isLoading } = useQuery({
    queryKey: queryKeys.mediaItem(id),
    queryFn: () => apiClient.getMediaItem(id),
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1D4ED8" />
      </View>
    );
  }

  if (!mediaItem) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="image" size={64} color="#9CA3AF" />
        <Text style={styles.emptyText}>Media item not found</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#DC2626';
      case 'high': return '#EA580C';
      case 'medium': return '#D97706';
      case 'low': return '#65A30D';
      default: return '#6B7280';
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: apiClient.getMediaFileUrl(mediaItem.id) }}
          style={styles.mediaImage}
          resizeMode="cover"
        />
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.title}>{mediaItem.originalName}</Text>
        <Text style={styles.infoText}>
          {mediaItem.type.charAt(0).toUpperCase() + mediaItem.type.slice(1)} - {mediaItem.mimeType}
        </Text>
        <Text style={styles.infoText}>
          Size: {(mediaItem.size / (1024 * 1024)).toFixed(2)} MB
        </Text>
        <Text style={styles.infoText}>
          Uploaded: {new Date(mediaItem.createdAt).toLocaleString()}
        </Text>
        {mediaItem.locationName && (
          <Text style={styles.infoText}>
            Location: {mediaItem.locationName}
          </Text>
        )}

        {mediaItem.analysis && (
          <View style={styles.analysisContainer}>
            <Text style={styles.analysisTitle}>Analysis</Text>
            
            {mediaItem.analysis.detectedIssues && mediaItem.analysis.detectedIssues.map((issue, index) => (
              <View
                key={`issue-${index}`}
                style={[
                  styles.issueContainer,
                  { borderColor: getSeverityColor(issue.severity) },
                ]}
              >
                <Text style={styles.issueType}>
                  {issue.type.replace('_', ' ').charAt(0).toUpperCase() +
                    issue.type.replace('_', ' ').slice(1)} - {issue.severity}
                </Text>
                <Text style={styles.issueDescription}>{issue.description}</Text>
                <Text style={styles.issueConfidence}>
                  Confidence: {(issue.confidence * 100).toFixed(2)}%
                </Text>
              </View>
            ))}
            <Text style={styles.analysisText}>{mediaItem.analysis.analysisText}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    height: 240,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    marginTop: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  analysisContainer: {
    marginTop: 16,
  },
  analysisTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  analysisText: {
    fontSize: 14,
    color: '#374151',
    marginTop: 12,
    lineHeight: 20,
  },
  issueContainer: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  issueType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  issueDescription: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 2,
  },
  issueConfidence: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  backButton: {
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default MediaDetailScreen;
