import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import PostGrid from '@/components/ui/PostGrid';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const placeholderImage = '@/assets/images/icon.png';

export default function ProfileScreen() {
  const { push } = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'tagged'>('all');

  // Sample post data for "All" tab
  const allPosts = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    image: require(placeholderImage),
    comments: ['Great post!', 'Love this!', 'Amazing!'],
  }));

  // Sample post data for "Recent" tab
  const recentPosts = Array.from({ length: 6 }, (_, i) => ({
    id: `recent-${i}`,
    image: require(placeholderImage),
    comments: ['Just posted!', 'Fresh content!', 'Love it!'],
  }));

  // Sample post data for "Tagged" tab
  const taggedPosts = Array.from({ length: 4 }, (_, i) => ({
    id: `tagged-${i}`,
    image: require(placeholderImage),
    comments: ['Tagged in this!', 'Amazing moment!', 'Great shot!'],
  }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Open settings"
          onPress={() => push('/profile/settings')}
          style={styles.settingsButton}
        >
          <MaterialIcons name="settings" size={22} color="#ff8420" />
        </TouchableOpacity>

        {/* Profile Header */}
        <ThemedView style={styles.header}>
          {/* Profile Picture */}
          <View style={styles.profilePicContainer}>
            <Image source={require(placeholderImage)} style={styles.profilePic} />
          </View>

          {/* Name and Bio */}
          <View style={styles.nameBioContainer}>
            <ThemedText style={styles.username}>Pandamanawesome</ThemedText>
            <ThemedText style={styles.bio}>
              WOOOOO FOMO✨
              {'\n'}Bazinga!
            </ThemedText>
          </View>
        </ThemedView>

        {/* Profile Info */}
        <ThemedView style={styles.infoContainer}>
          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <ThemedText style={styles.statNumber}>42</ThemedText>
              <ThemedText style={styles.statLabel}>Posts</ThemedText>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Open friends"
              onPress={() => push('/profile/friends')}
              style={styles.stat}
            >
              <ThemedText style={styles.statNumber}>180</ThemedText>
              <ThemedText style={styles.statLabel}>Friends</ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.RecentActivityButton}>
            <ThemedText style={styles.RecentActivityButtonText}>Recent Activity</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Stories/Highlights */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.highlightsContainer}
          contentContainerStyle={styles.highlightsContent}
        ></ScrollView>

        {/* Tab Bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'all' && styles.activeTab]}
            onPress={() => setActiveTab('all')}
          >
            <ThemedText>All</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'recent' && styles.activeTab]}
            onPress={() => setActiveTab('recent')}
          >
            <ThemedText>Recent</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'tagged' && styles.activeTab]}
            onPress={() => setActiveTab('tagged')}
          >
            <ThemedText>Tagged</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Posts Grid Component - Changes based on active tab */}
        {activeTab === 'all' && <PostGrid posts={allPosts} />}
        {activeTab === 'recent' && <PostGrid posts={recentPosts} />}
        {activeTab === 'tagged' && <PostGrid posts={taggedPosts} />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 24,
    alignItems: 'center',
  },
  settingsButton: {
    position: 'absolute',
    top: 12,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ffa600',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    backgroundColor: '#fff',
  },
  profilePicContainer: {
    width: 100,
    height: 100,
    backgroundColor: '#ff8420',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#ffa600',
    borderRadius: 10,
    borderWidth: 3,
    marginRight: 16,
    overflow: 'hidden',
  },
  profilePic: {
    width: '100%',
    height: '100%',
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
  },
  nameBioContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  infoContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bio: {
    fontSize: 14,
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  RecentActivityButton: {
    flex: 1,
    height: 82,
    borderWidth: 1,
    borderColor: '#ffa600',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  RecentActivityButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  shareButton: {
    width: 40,
    height: 32,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  highlightsContainer: {
    marginBottom: 16,
  },
  highlightsContent: {
    paddingHorizontal: 16,
  },
  highlight: {
    alignItems: 'center',
    marginRight: 16,
  },
  highlightRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  highlightText: {
    fontSize: 12,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 5,
    borderBottomColor: '#ffa600',
  },
});
