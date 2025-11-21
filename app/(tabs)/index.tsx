import { AddEntryModal } from '@/components/journal/AddEntryModal';
import { CalendarView } from '@/components/journal/CalendarView';
import { EntryCard } from '@/components/journal/EntryCard';
import { JournalEntry, useJournalStore } from '@/store/journalStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

export default function JournalScreen() {
  const {
    entries,
    isLoading,
    loadData,
    addEntry,
    updateEntry,
    deleteEntry,
    toggleFavorite,
    searchQuery,
    setSearchQuery,
    getFilteredEntries,
    isDarkMode,
  } = useJournalStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'favorites'>('all');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const handleAddEntry = async (data: {
    content: string;
    mood: string;
    date: string;
    title?: string;
    tags?: string[];
  }) => {
    if (editingEntry) {
      await updateEntry(editingEntry.id, {
        content: data.content,
        mood: data.mood as any,
        title: data.title,
        tags: data.tags,
      });
      setEditingEntry(null);
    } else {
      await addEntry({
        content: data.content,
        mood: data.mood as any,
        date: data.date,
        title: data.title,
        tags: data.tags,
      });
    }
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setModalVisible(true);
  };

  const handleDeleteEntry = async (id: string) => {
    await deleteEntry(id);
  };

  const handleDeleteSelected = async () => {
    for (const id of selectedEntries) {
      await deleteEntry(id);
    }
    setSelectedEntries(new Set());
    setSelectionMode(false);
  };

  const handleToggleSelection = (id: string) => {
    const newSelected = new Set(selectedEntries);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedEntries(newSelected);
    if (newSelected.size === 0) {
      setSelectionMode(false);
    }
  };

  const handleToggleFavorite = async (id: string) => {
    await toggleFavorite(id);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingEntry(null);
  };

  // Use useMemo to ensure filtered entries update reactively
  const filteredEntries = useMemo(() => {
    let filtered = getFilteredEntries();

    // Apply favorite filter
    if (selectedFilter === 'favorites') {
      filtered = filtered.filter(e => e.isFavorite);
    }

    // Apply date filter if a date is selected from calendar
    if (selectedDate) {
      const dateStr = selectedDate.toDateString();
      filtered = filtered.filter(e => new Date(e.date).toDateString() === dateStr);
    }

    // Apply mood filter if a mood is selected
    if (selectedMood) {
      filtered = filtered.filter(e => e.mood === selectedMood);
    }

    return filtered;
  }, [entries, searchQuery, selectedFilter, selectedDate, selectedMood]);

  const favoriteCount = useMemo(() => {
    return entries.filter(e => e.isFavorite).length;
  }, [entries]);

  // Dynamic styles
  const themeStyles = {
    container: {
      backgroundColor: isDarkMode ? '#0A1F1C' : '#F8FAFC',
    },
    headerTitle: {
      color: isDarkMode ? '#FFFFFF' : '#0F172A',
    },
    headerSubtitle: {
      color: isDarkMode ? '#8BA9A5' : '#64748B',
    },
    headerButton: {
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    },
    headerButtonIcon: {
      color: isDarkMode ? '#FFFFFF' : '#0F172A',
    },
    searchContainer: {
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF',
      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#E2E8F0',
    },
    searchInput: {
      color: isDarkMode ? '#FFFFFF' : '#0F172A',
    },
    filterTab: {
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
    },
    filterTabText: {
      color: isDarkMode ? '#8BA9A5' : '#64748B',
    },
    emptyTitle: {
      color: isDarkMode ? '#FFFFFF' : '#0F172A',
    },
    emptyText: {
      color: isDarkMode ? '#8BA9A5' : '#64748B',
    },
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, themeStyles.container]}>
        <ActivityIndicator size="large" color="#E89F3C" />
      </View>
    );
  }

  return (
    <View style={[styles.container, themeStyles.container]}>
      {/* Header with glassmorphism */}
      <LinearGradient
        colors={isDarkMode ? ['#0F2E2A', '#0A1F1C'] : ['#FFFFFF', '#F1F5F9']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View>
              <Text style={[styles.headerTitle, themeStyles.headerTitle]}>My Journey</Text>
              {selectedDate || selectedMood ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={[styles.headerSubtitle, themeStyles.headerSubtitle]}>
                    {selectedDate && selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {selectedDate && selectedMood && ' • '}
                    {selectedMood && `${selectedMood.charAt(0).toUpperCase() + selectedMood.slice(1)} mood`}
                  </Text>
                  <Pressable
                    onPress={() => {
                      setSelectedDate(null);
                      setSelectedMood(null);
                    }}
                    style={{ padding: 4 }}
                  >
                    <Ionicons name="close-circle" size={16} color={themeStyles.headerSubtitle.color} />
                  </Pressable>
                </View>
              ) : (
                <Text style={[styles.headerSubtitle, themeStyles.headerSubtitle]}>
                  {entries.length} {entries.length === 1 ? 'Memory' : 'Memories'}
                </Text>
              )}
            </View>
            <View style={styles.headerActions}>
              <Pressable
                onPress={() => setCalendarVisible(true)}
                style={[styles.headerButton, themeStyles.headerButton]}
              >
                <Ionicons name="calendar-outline" size={22} color={themeStyles.headerButtonIcon.color} />
              </Pressable>
              <Pressable
                onPress={() => {/* Search */ }}
                style={[styles.headerButton, themeStyles.headerButton]}
              >
                <Ionicons name="search-outline" size={22} color={themeStyles.headerButtonIcon.color} />
              </Pressable>
            </View>
          </View>

          {/* Search Bar - Mirello Style */}
          <View style={[styles.searchContainer, themeStyles.searchContainer]}>
            <Ionicons name="search" size={18} color="#6B8E8A" style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, themeStyles.searchInput]}
              placeholder="Search your memories..."
              placeholderTextColor="#6B8E8A"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#6B8E8A" />
              </Pressable>
            )}
          </View>

          {/* Filter Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterTabs}
            contentContainerStyle={styles.filterTabsContent}
          >
            <Pressable
              onPress={() => setSelectedFilter('all')}
              style={[
                styles.filterTab,
                themeStyles.filterTab,
                selectedFilter === 'all' && styles.filterTabActive
              ]}
            >
              <Text style={[
                styles.filterTabText,
                themeStyles.filterTabText,
                selectedFilter === 'all' && styles.filterTabTextActive
              ]}>
                All
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setSelectedFilter('favorites')}
              style={[
                styles.filterTab,
                themeStyles.filterTab,
                selectedFilter === 'favorites' && styles.filterTabActive
              ]}
            >
              <Ionicons
                name="star"
                size={16}
                color={selectedFilter === 'favorites' ? '#FFFFFF' : '#8BA9A5'}
                style={{ marginRight: 6 }}
              />
              <Text style={[
                styles.filterTabText,
                themeStyles.filterTabText,
                selectedFilter === 'favorites' && styles.filterTabTextActive
              ]}>
                Favorites
              </Text>
              {favoriteCount > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{favoriteCount}</Text>
                </View>
              )}
            </Pressable>
            {selectionMode && selectedEntries.size > 0 && (
              <Pressable
                onPress={handleDeleteSelected}
                style={[styles.filterTab, { backgroundColor: '#EF4444', borderColor: '#EF4444' }]}
              >
                <Ionicons name="trash" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={[styles.filterTabText, { color: '#FFFFFF' }]}>
                  Delete ({selectedEntries.size})
                </Text>
              </Pressable>
            )}
          </ScrollView>
        </View>
      </LinearGradient>

      {/* Entry List */}
      {filteredEntries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📖</Text>
          <Text style={[styles.emptyTitle, themeStyles.emptyTitle]}>Start Your Journey</Text>
          <Text style={[styles.emptyText, themeStyles.emptyText]}>
            Capture your memories and adventures
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredEntries}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <EntryCard
              entry={item}
              onPress={() => {
                if (selectionMode) {
                  handleToggleSelection(item.id);
                } else {
                  handleEditEntry(item);
                }
              }}
              onLongPress={() => {
                setSelectionMode(true);
                handleToggleSelection(item.id);
              }}
              onDelete={() => handleDeleteEntry(item.id)}
              onToggleFavorite={() => handleToggleFavorite(item.id)}
              isSelected={selectedEntries.has(item.id)}
              selectionMode={selectionMode}
              index={index}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Floating Add Button - Orange like Mirello */}
      <Pressable
        onPress={() => setModalVisible(true)}
        style={({ pressed }) => [
          styles.fab,
          {
            opacity: pressed ? 0.9 : 1,
            transform: [{ scale: pressed ? 0.95 : 1 }]
          }
        ]}
      >
        <LinearGradient
          colors={['#E89F3C', '#D68A2E']}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </LinearGradient>
      </Pressable>

      {/* Add/Edit Entry Modal */}
      <AddEntryModal
        visible={modalVisible}
        onClose={handleCloseModal}
        onSave={handleAddEntry}
        initialData={editingEntry ? {
          content: editingEntry.content,
          mood: editingEntry.mood,
          date: editingEntry.date,
          title: editingEntry.title,
          tags: editingEntry.tags,
        } : null}
      />

      {/* Calendar Modal */}
      <Modal
        visible={calendarVisible}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <CalendarView
          onClose={() => setCalendarVisible(false)}
          onDateSelect={(date) => {
            setSelectedDate(date);
            setCalendarVisible(false);
          }}
          onMoodSelect={(mood) => {
            setSelectedMood(mood);
            setCalendarVisible(false);
          }}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  filterTabs: {
    marginTop: 16,
  },
  filterTabsContent: {
    paddingRight: 20,
    gap: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterTabActive: {
    backgroundColor: '#E89F3C',
    borderColor: '#E89F3C',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  filterBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    borderRadius: 28,
    shadowColor: '#E89F3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
