import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  ScrollView,
  Image,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { authAPI, successStoryAPI } from '../services/api';
import TherapyScreen from './TherapyScreen';
import ProfileScreen from './ProfileScreen';
import HealthScreen from './HealthScreen';
import PredictionsScreen from './PredictionsScreen';
import PrescriptiveScreen from './PrescriptiveScreen';
import AppointmentsScreen from './AppointmentsScreen';
import SuccessStoryDetailScreen from './SuccessStoryDetailScreen';
import BottomNav from './BottomNav';
import InitialDiagnosticModal from './InitialDiagnosticModal';
import { getRecommendedTherapyTarget } from '../utils/initialDiagnostic';

const { width, height } = Dimensions.get('window');

const HomePage = ({ userData, onLogout }) => {
  const [sessionUserData, setSessionUserData] = useState(userData);
  const [activeTab, setActiveTab] = useState('home');
  const [currentScreen, setCurrentScreen] = useState('home'); // 'home', 'therapy', 'profile', 'health', 'story-detail'
  const [selectedHomeTherapy, setSelectedHomeTherapy] = useState(null);
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);
  const [diagnosticLoading, setDiagnosticLoading] = useState(false);
  const scrollViewRef = useRef(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [successStories, setSuccessStories] = useState([]);
  const [loadingStories, setLoadingStories] = useState(true);
  const [selectedStory, setSelectedStory] = useState(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const card1Anim = useRef(new Animated.Value(0)).current;
  const card2Anim = useRef(new Animated.Value(0)).current;
  const card3Anim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Trigger animations on mount
  useEffect(() => {
    loadSuccessStories();
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Stagger card animations
    Animated.stagger(100, [
      Animated.spring(card1Anim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(card2Anim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(card3Anim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for call-to-action
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [card1Anim, card2Anim, card3Anim, fadeAnim, loadSuccessStories, pulseAnim, slideAnim]);

  useEffect(() => {
    setSessionUserData(userData);
  }, [userData]);

  useEffect(() => {
    const checkInitialDiagnostic = async () => {
      try {
        const storedUserData = await AsyncStorage.getItem('userData');
        const resolvedUser = storedUserData ? JSON.parse(storedUserData) : userData;

        if (!resolvedUser) {
          return;
        }

        setSessionUserData(resolvedUser);

        if (resolvedUser.hasInitialDiagnostic == null && !resolvedUser.diagnosticData?.completedWizard) {
          setShowDiagnosticModal(true);
        }
      } catch (error) {
        console.error('Error checking initial diagnostic state:', error);
      }
    };

    checkInitialDiagnostic();
  }, [userData]);

  // Load success stories
  const loadSuccessStories = useCallback(async () => {
    try {
      setLoadingStories(true);
      const response = await successStoryAPI.getAll();
      if (response.success) {
        setSuccessStories(response.data || []);
      }
    } catch (error) {
      console.error('Error loading success stories:', error);
      setSuccessStories([]);
    } finally {
      setLoadingStories(false);
    }
  }, []);

  const handleTabPress = (tab) => {
    console.log('Tab pressed:', tab);
    setActiveTab(tab);
    setCurrentScreen(tab); // Single atomic state update
    console.log('✅ Navigating to', tab, 'screen');
  };

  const handleTherapyBack = () => {
    setSelectedHomeTherapy(null);
    setCurrentScreen('home');
    setActiveTab('home');
  };

  const handleProfileBack = () => {
    setCurrentScreen('home');
    setActiveTab('home');
  };

  const handleHealthBack = () => {
    setCurrentScreen('home');
    setActiveTab('home');
  };

  const handlePredictionsBack = () => {
    setCurrentScreen('home');
    setActiveTab('home');
  };

  const handlePrescriptiveBack = () => {
    setCurrentScreen('home');
    setActiveTab('home');
  };

  const handleAppointmentsBack = () => {
    setCurrentScreen('home');
    setActiveTab('home');
  };

  const handleAppointmentsPress = () => {
    setCurrentScreen('schedule');
    setActiveTab('schedule');
  };

  const handleNavigateFromTherapy = (destination) => {
    console.log('Navigating from therapy to:', destination);
    if (destination !== 'therapy') {
      setSelectedHomeTherapy(null);
    }
    setActiveTab(destination);
    setCurrentScreen(destination);
  };

  const handleTherapyCardPress = (therapyType = null) => {
    setSelectedHomeTherapy(therapyType);
    setActiveTab('therapy');
    setCurrentScreen('therapy');
  };

  const handleHealthCardPress = () => {
    setActiveTab('health');
    setCurrentScreen('health');
  };

  // Handle manual scroll for carousel
  const handleScroll = (event) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = Math.floor(event.nativeEvent.contentOffset.x / slideSize);
    setActiveSlide(index);
  };

  const handleStoryPress = (story) => {
    setSelectedStory(story);
    setCurrentScreen('story-detail');
  };

  const handleStoryDetailBack = () => {
    setSelectedStory(null);
    setCurrentScreen('home');
  };

  const handleDiagnosticConfirm = async (wizardPayload) => {
    setDiagnosticLoading(true);
    try {
      const response = await authAPI.saveDiagnosticData(wizardPayload);
      const storedUserData = await AsyncStorage.getItem('userData');
      const nextUserData = storedUserData
        ? JSON.parse(storedUserData)
        : { ...sessionUserData, ...response?.data?.data };

      setSessionUserData(nextUserData);
      setShowDiagnosticModal(false);

      const recommendedTarget = getRecommendedTherapyTarget(
        nextUserData?.diagnosticData,
        nextUserData?.therapyType
      );

      if (recommendedTarget) {
        setSelectedHomeTherapy(recommendedTarget);
        setActiveTab('therapy');
        setCurrentScreen('therapy');
      }
    } catch (error) {
      console.error('Error saving initial diagnostic:', error);
    } finally {
      setDiagnosticLoading(false);
    }
  };

  const renderWithGlobalModal = (content, tab = activeTab) => (
    <View style={styles.container}>
      {content}
      <BottomNav activeTab={tab} onTabPress={handleTabPress} />
      <InitialDiagnosticModal
        isOpen={showDiagnosticModal}
        onClose={() => setShowDiagnosticModal(false)}
        onConfirm={handleDiagnosticConfirm}
        loading={diagnosticLoading}
        initialData={sessionUserData?.diagnosticData}
      />
    </View>
  );

  // Show Profile screen if profile tab is active
  if (currentScreen === 'profile') {
    return renderWithGlobalModal(
      <>
        <ProfileScreen 
          userData={sessionUserData} 
          onBack={handleProfileBack}
          onLogout={onLogout}
        />
      </>
    );
  }

  // Show Health screen if health tab is active
  if (currentScreen === 'health') {
    console.log('🏥 Rendering HealthScreen component');
    return renderWithGlobalModal(
      <>
        <HealthScreen
          onBack={handleHealthBack}
          onOpenPredictions={() => setCurrentScreen('predictions')}
          onOpenPlan={() => setCurrentScreen('prescriptive')}
        />
      </>
    );
  }

  // Show Predictions screen if predictions tab is active
  if (currentScreen === 'predictions') {
    return renderWithGlobalModal(
      <>
        <PredictionsScreen onBack={handlePredictionsBack} />
      </>,
      'health'
    );
  }

  // Show Prescriptive screen if prescriptive tab is active
  if (currentScreen === 'prescriptive') {
    return renderWithGlobalModal(
      <>
        <PrescriptiveScreen onBack={handlePrescriptiveBack} />
      </>,
      'health'
    );
  }

  // Show Appointments screen if appointments tab is active
  if (currentScreen === 'schedule') {
    return renderWithGlobalModal(
      <>
        <AppointmentsScreen onBack={handleAppointmentsBack} />
      </>
    );
  }

  // Show Therapy screen if therapy tab is active
  if (currentScreen === 'therapy') {
    return renderWithGlobalModal(
      <TherapyScreen onBack={handleTherapyBack} onNavigate={handleNavigateFromTherapy} initialTherapyType={selectedHomeTherapy} />
    );
  }

  // Show Success Story Detail screen
  if (currentScreen === 'story-detail') {
    return <SuccessStoryDetailScreen story={selectedStory} onBack={handleStoryDetailBack} />;
  }

  const firstName = sessionUserData?.firstName || 'Friend';
  const featuredStories = successStories.slice(0, 3);
  const therapyPrograms = [
    {
      key: 'articulation',
      title: 'Articulation',
      subtitle: 'Build clear sounds through guided speech practice.',
      accent: '#e85d5d',
      icon: 'mic',
      badge: 'PEDIATRIC',
      duration: '15-20 min'
    },
    {
      key: 'language',
      title: 'Language',
      subtitle: 'Improve language skills with guided exercises.',
      accent: '#1ea896',
      icon: 'chatbubbles',
      badge: 'PEDIATRIC',
      duration: '10-15 min'
    },
    {
      key: 'physical',
      title: 'Physical',
      subtitle: 'Support gait recovery and steady movement practice.',
      accent: '#2f6fed',
      icon: 'walk',
      badge: 'STROKE',
      duration: '20-25 min'
    }
  ];
  const recoveryHighlights = [
    {
      key: 'focus',
      label: 'Today\'s Focus',
      value: 'Steady daily practice',
      icon: 'sparkles',
      tone: '#fff1f2'
    },
    {
      key: 'appointments',
      label: 'Next Step',
      value: 'Check appointments',
      icon: 'calendar-clear',
      tone: '#eff6ff'
    },
    {
      key: 'stories',
      label: 'Motivation',
      value: `${featuredStories.length || 0} inspiring stories`,
      icon: 'heart',
      tone: '#ecfeff'
    }
  ];

  return renderWithGlobalModal(
    <>
      <View style={styles.header}>
        <View style={styles.headerLeft} />
        <Text style={styles.headerTitle}>Home</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topNavbar}>
          <Animated.View 
            style={[
              styles.navContent,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }
            ]}
          >
            <View style={styles.heroShell}>
              <View style={styles.heroTopRow}>
                <View style={styles.heroWordmarkRow}>
                  <View style={styles.heroLogoPill}>
                    <Image
                      source={require('../assets/cvalogonotext.png')}
                      style={styles.heroLogoPillIcon}
                      resizeMode="contain"
                    />
                  </View>
                  <View>
                    <Text style={styles.heroEyebrow}>Daily recovery space</Text>
                    <Text style={styles.heroMicrocopy}>Your therapy home for small wins that add up.</Text>
                  </View>
                </View>
                <View style={styles.heroStatusPillAlt}>
                  <Ionicons name="sparkles" size={11} color="#b42318" />
                  <Text style={styles.heroStatusTextAlt}>Ready today</Text>
                </View>
              </View>

              <Text style={styles.heroTitle}>Welcome back, {firstName}</Text>
              <Text style={styles.heroSubtitle}>
                Start a focused session, check your appointments, and stay inspired by recovery stories from the community.
              </Text>

              <View style={styles.heroFocusPanel}>
                <View style={styles.heroFocusLeft}>
                  <Text style={styles.heroFocusLabel}>Today&apos;s rhythm</Text>
                  <Text style={styles.heroFocusValue}>Practice a little. Progress a lot.</Text>
                </View>
              </View>

              <View style={styles.heroActionRow}>
                <TouchableOpacity style={styles.heroPrimaryButton} onPress={() => handleTherapyCardPress()} activeOpacity={0.85}>
                  <Text style={styles.heroPrimaryButtonText}>Start Therapy</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </View>

        <View style={styles.section}>
          <View style={styles.recoveryRibbon}>
            {recoveryHighlights.map((item) => (
              <View key={item.key} style={[styles.recoveryPill, { backgroundColor: item.tone }]}>
                <View style={styles.recoveryPillIconWrap}>
                  <Ionicons name={item.icon} size={16} color="#a61e22" />
                </View>
                <View style={styles.recoveryPillTextWrap}>
                  <Text style={styles.recoveryPillLabel}>{item.label}</Text>
                  <Text style={styles.recoveryPillValue}>{item.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}> 
          <View style={styles.quickAccessPanel}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Quick Access</Text>
                <Text style={styles.sectionCaption}>A streamlined command center for recovery, scheduling, and progress.</Text>
              </View>
              <View style={styles.panelBadge}>
                <Ionicons name="flash" size={12} color="#b45309" />
                <Text style={styles.panelBadgeText}>Ready</Text>
              </View>
            </View>

            <View style={styles.quickAccessLeadCard}>
              <View style={styles.quickAccessLeadHeader}>
                <Text style={styles.quickAccessLeadEyebrow}>Recovery flow</Text>
                <Ionicons name="arrow-forward-circle" size={18} color="#a61e22" />
              </View>
              <Text style={styles.quickAccessLeadTitle}>Everything you need is organized for calm, focused progress.</Text>
              <Text style={styles.quickAccessLeadText}>Move between therapy, appointments, and progress review without hunting through the app.</Text>
            </View>

            <View style={styles.quickAccessRow}>
              <TouchableOpacity style={styles.quickAccessCard} onPress={handleAppointmentsPress} activeOpacity={0.85}>
                <View style={[styles.quickAccessIconWrap, { backgroundColor: '#ffe7d6' }]}>
                  <Ionicons name="calendar" size={20} color="#c2410c" />
                </View>
                <Text style={styles.quickAccessTitle}>Appointments</Text>
                <Text style={styles.quickAccessText}>Manage your upcoming sessions.</Text>
                <Text style={styles.quickAccessLink}>Open planner</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickAccessCard} onPress={handleHealthCardPress} activeOpacity={0.85}>
                <View style={[styles.quickAccessIconWrap, { backgroundColor: '#dff7f3' }]}>
                  <Ionicons name="pulse" size={20} color="#0f766e" />
                </View>
                <Text style={styles.quickAccessTitle}>Health Dashboard</Text>
                <Text style={styles.quickAccessText}>Review progress and therapy logs.</Text>
                <Text style={styles.quickAccessLink}>See progress</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Therapy Programs</Text>
              <Text style={styles.sectionCaption}>Choose a guided activity that matches today's goal.</Text>
            </View>
            <TouchableOpacity onPress={() => handleTherapyCardPress()} activeOpacity={0.8}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.quickActionsGrid}>
            {therapyPrograms.map((program, index) => {
              const animStyle = index === 0 ? card1Anim : index === 1 ? card2Anim : card3Anim;
              return (
                <Animated.View key={program.key} style={{ opacity: animStyle, transform: [{ scale: animStyle }], width: index === 2 ? '100%' : '48%' }}>
                  <TouchableOpacity 
                    style={[styles.quickActionCard, index === 2 && styles.quickActionCardWide]}
                    onPress={() => handleTherapyCardPress(program.key)}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.cardGradient, { backgroundColor: program.accent }]}> 
                      <View style={styles.programHalo} />
                      <View style={styles.cardBadge}>
                        <Text style={styles.cardBadgeText}>{program.badge}</Text>
                      </View>
                      <View style={styles.cardIconContainer}>
                        <Ionicons name={program.icon} size={32} color="#FFFFFF" />
                      </View>
                      <Text style={[styles.quickActionText, program.key === 'language' && styles.quickActionTextCompact]}>{program.title}</Text>
                      <Text style={styles.quickActionSubtext}>{program.subtitle}</Text>
                      <View style={styles.cardFooter}>
                        <Ionicons name="time-outline" size={14} color="#FFFFFF" />
                        <Text style={styles.cardFooterText}>{program.duration}</Text>
                      </View>
                      <View style={styles.programCTA}>
                        <Text style={styles.programCTAText}>Open program</Text>
                        <Ionicons name="arrow-forward" size={14} color="#ffffff" />
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Stories of Progress</Text>
              <Text style={styles.sectionCaption}>See how recovery grows one step at a time.</Text>
            </View>
            <View style={styles.storyCountChip}>
              <Text style={styles.storyCountChipText}>{featuredStories.length || 0} featured</Text>
            </View>
          </View>

          {loadingStories ? (
            <View style={styles.storyLoadingCard}>
              <Ionicons name="sparkles" size={24} color="#C9302C" />
              <Text style={styles.storyLoadingText}>Loading success stories...</Text>
            </View>
          ) : featuredStories.length > 0 ? (
            <View style={styles.storyCarouselShell}>
              <View style={styles.storyCarouselFrame}>
              <View style={styles.storyRailAccent} />
              <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
              >
                {featuredStories.map((story) => (
                  <View key={`story-${story._id || story.id}`} style={styles.storyCarouselSlide}>
                    <TouchableOpacity
                      style={styles.storySpotlightCard}
                      onPress={() => handleStoryPress(story)}
                      activeOpacity={0.9}
                    >
                      {story.images && story.images.length > 0 ? (
                        <Image
                          source={{ uri: story.images[0] }}
                          style={styles.storySpotlightImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.storySpotlightFallback}>
                          <Ionicons name="image-outline" size={34} color="#94a3b8" />
                        </View>
                      )}

                      <View style={styles.storySpotlightOverlay}>
                        <View style={styles.storySpotlightBadge}>
                          <Ionicons name="heart" size={12} color="#FFFFFF" />
                          <Text style={styles.storySpotlightBadgeText}>Success Story</Text>
                        </View>
                        <Text style={styles.storySpotlightName}>{story.patientName || 'Patient Story'}</Text>
                        <Text style={styles.storySpotlightExcerpt} numberOfLines={3}>
                          {story.story || 'Tap to read this recovery journey and celebrate the progress made.'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
              </View>
            </View>
          ) : (
            <View style={styles.storyEmptyCard}>
              <Ionicons name="happy-outline" size={32} color="#C9302C" />
              <Text style={styles.storyEmptyTitle}>Success stories will appear here</Text>
              <Text style={styles.storyEmptyText}>As patients share their progress, you'll be able to browse them from home.</Text>
            </View>
          )}

          {featuredStories.length > 1 && (
            <View style={styles.storyIndicatorRow}>
              {featuredStories.map((story, index) => (
                <View
                  key={`indicator-${story._id || story.id || index}`}
                  style={[styles.storyIndicator, index === activeSlide && styles.storyIndicatorActive]}
                />
              ))}
            </View>
          )}
        </View>

        <Animated.View 
          style={[
            styles.section,
            { transform: [{ scale: pulseAnim }] }
          ]}
        >
          <View style={styles.ctaCard}>
            <Text style={styles.ctaEyebrow}>Today's focus</Text>
            <Text style={styles.ctaTitle}>Keep your recovery momentum going</Text>
            <Text style={styles.ctaSubtext}>
              A short daily session helps strengthen skills, build consistency, and make your next milestone feel closer.
            </Text>
            <TouchableOpacity 
              style={styles.ctaButton}
              onPress={() => handleTherapyCardPress()}
              activeOpacity={0.9}
            >
              <Text style={styles.ctaButtonText}>Begin Therapy</Text>
              <Ionicons name="arrow-forward-circle" size={22} color="#a61e22" />
            </TouchableOpacity>
            <View style={styles.ctaStats}>
              <View style={styles.ctaStatItem}>
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                <Text style={styles.ctaStatText}>Personalized</Text>
              </View>
              <View style={styles.ctaStatItem}>
                <Ionicons name="trending-up" size={18} color="#FFFFFF" />
                <Text style={styles.ctaStatText}>Track Progress</Text>
              </View>
              <View style={styles.ctaStatItem}>
                <Ionicons name="time" size={18} color="#FFFFFF" />
                <Text style={styles.ctaStatText}>Flexible Time</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        <View style={styles.section}>
          <View style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <Ionicons name="bulb" size={18} color="#d97706" />
              <Text style={styles.tipTitle}>Today's Tip</Text>
            </View>
            <Text style={styles.tipText}>
              <Text style={styles.tipBold}>Pro Tip:</Text> Practice for 15 minutes daily for best results. Consistency is the fastest way to build confidence.
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerLeft: {
    width: 34,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  headerRight: {
    width: 34,
  },
  
  topNavbar: {
    backgroundColor: '#f6f7fb',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  navContent: {
    paddingVertical: 6,
  },
  heroShell: {
    backgroundColor: '#fffaf8',
    borderRadius: 30,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f8d7d3',
    shadowColor: '#7f1d1d',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  heroWordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroLogoPill: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f5d6d2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLogoPillIcon: {
    width: 82,
    height: 82,
  },
  heroEyebrow: {
    color: '#8f1d21',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroMicrocopy: {
    color: '#7a6a67',
    fontSize: 11,
    marginTop: 3,
  },
  heroStatusPillAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    backgroundColor: '#feeceb',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  heroStatusTextAlt: {
    color: '#b42318',
    fontSize: 10,
    fontWeight: '800',
  },
  heroTitle: {
    color: '#201a19',
    fontSize: 30,
    fontWeight: '800',
    marginTop: 18,
  },
  heroSubtitle: {
    color: '#6f6360',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
    maxWidth: 290,
  },
  heroFocusPanel: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: '#fff1ee',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#f5d3cd',
    overflow: 'hidden',
  },
  heroFocusLeft: {
    flex: 1.2,
    padding: 16,
  },
  heroFocusLabel: {
    color: '#b42318',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroFocusValue: {
    color: '#201a19',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
    marginTop: 8,
  },
  heroActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 18,
  },
  heroPrimaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#b42318',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
  },
  heroPrimaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  content: {
    flex: 1,
    backgroundColor: '#f6f7fb',
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  recoveryRibbon: {
    flexDirection: 'row',
    gap: 10,
  },
  recoveryPill: {
    flex: 1,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  recoveryPillIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  recoveryPillTextWrap: {
    gap: 4,
  },
  recoveryPillLabel: {
    color: '#7f1d1d',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  recoveryPillValue: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1f2937',
  },
  sectionCaption: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  seeAllText: {
    fontSize: 13,
    color: '#c9302c',
    fontWeight: '700',
  },
  quickAccessPanel: {
    backgroundColor: '#fff4ef',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ffd9cd',
  },
  quickAccessLeadCard: {
    backgroundColor: '#fffdfb',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ffe4d6',
    marginBottom: 12,
  },
  quickAccessLeadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickAccessLeadEyebrow: {
    color: '#b45309',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  quickAccessLeadTitle: {
    color: '#1f2937',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },
  quickAccessLeadText: {
    color: '#6b7280',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  panelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ffedd5',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  panelBadgeText: {
    color: '#9a3412',
    fontSize: 11,
    fontWeight: '800',
  },
  quickAccessRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickAccessCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickAccessIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  quickAccessTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1f2937',
  },
  quickAccessText: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 18,
    marginTop: 5,
  },
  quickAccessLink: {
    marginTop: 12,
    color: '#c9302c',
    fontSize: 12,
    fontWeight: '800',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickActionCard: {
    width: (width - 44) / 2,
    borderRadius: 22,
    overflow: 'hidden',
  },
  quickActionCardWide: {
    width: '100%',
  },
  cardGradient: {
    minHeight: 176,
    borderRadius: 22,
    padding: 18,
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
  },
  programHalo: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.10)',
    top: -46,
    right: -28,
  },
  cardBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },
  cardBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  cardIconContainer: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 18,
    lineHeight: 24,
    minHeight: 48,
  },
  quickActionTextCompact: {
    fontSize: 18,
    lineHeight: 24,
  },
  quickActionSubtext: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    maxWidth: '88%',
    minHeight: 38,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 16,
  },
  cardFooterText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  programCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  programCTAText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  storyLoadingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  storyLoadingText: {
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '600',
  },
  storyCarouselShell: {
    marginHorizontal: -16,
  },
  storyCarouselFrame: {
    paddingVertical: 4,
    position: 'relative',
  },
  storyRailAccent: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: 22,
    height: 190,
    borderRadius: 28,
    backgroundColor: '#fdecec',
  },
  storyCarouselSlide: {
    width,
    paddingHorizontal: 16,
  },
  storySpotlightCard: {
    width: '100%',
    height: 244,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
  },
  storySpotlightImage: {
    width: '100%',
    height: '100%',
  },
  storySpotlightFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dbe4f0',
  },
  storySpotlightOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.68)',
  },
  storySpotlightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 10,
  },
  storySpotlightBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  storySpotlightName: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
  },
  storySpotlightExcerpt: {
    color: '#eef2ff',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  storyEmptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  storyEmptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1f2937',
    marginTop: 12,
  },
  storyEmptyText: {
    color: '#6b7280',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    textAlign: 'center',
  },
  storyIndicatorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  storyIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d1d5db',
  },
  storyIndicatorActive: {
    width: 24,
    backgroundColor: '#c9302c',
  },
  storyCountChip: {
    backgroundColor: '#fee2e2',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  storyCountChipText: {
    color: '#b91c1c',
    fontSize: 11,
    fontWeight: '800',
  },
  ctaCard: {
    backgroundColor: '#1f3b73',
    borderRadius: 24,
    padding: 22,
  },
  ctaEyebrow: {
    color: '#c7d2fe',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  ctaTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 10,
  },
  ctaSubtext: {
    color: '#dbeafe',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
  },
  ctaButton: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
    alignSelf: 'flex-start',
  },
  ctaButtonText: {
    color: '#a61e22',
    fontSize: 14,
    fontWeight: '800',
  },
  ctaStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 18,
  },
  ctaStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ctaStatText: {
    color: '#e5edff',
    fontSize: 12,
    fontWeight: '700',
  },
  tipCard: {
    backgroundColor: '#fff6dd',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  tipTitle: {
    color: '#92400e',
    fontSize: 15,
    fontWeight: '800',
  },
  tipText: {
    color: '#7c5b15',
    fontSize: 13,
    lineHeight: 20,
  },
  tipBold: {
    fontWeight: '800',
    color: '#b45309',
  },
  bottomSpacing: {
    height: 88,
  },
});

export default HomePage;
