import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  X,
  Shield,
  Lock,
  Star,
  Check,
  Zap,
} from 'lucide-react-native';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { COLORS, GRADIENT_COLORS, useOnboardingTheme } from './designSystem';
import { GlassCard, GradientButton } from './UIComponents';
import AnimatedOrb from '@/components/AnimatedOrb';

const { height } = Dimensions.get('window');

// ============================================
// LEARN MORE MODAL
// ============================================

export const LearnMoreModal = ({
  visible,
  onClose,
  title,
  features,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  features: { icon: string; title: string; description: string }[];
}) => {
  const { colors, isDark } = useOnboardingTheme();

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{
        flex: 1,
        backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
      }}>
        <View style={{
          backgroundColor: colors.background,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          paddingTop: 24,
          paddingBottom: 40,
          paddingHorizontal: 24,
          maxHeight: height * 0.7,
          borderWidth: 1,
          borderColor: colors.glassBorder,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <Text style={{ fontSize: 22, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.3 }}>
              {title}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: colors.glassLight,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {features.map((feature, index) => (
              <GlassCard key={index} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row' }}>
                  <Text style={{ fontSize: 28, marginRight: 16 }}>{feature.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: 4 }}>
                      {feature.title}
                    </Text>
                    <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 20 }}>
                      {feature.description}
                    </Text>
                  </View>
                </View>
              </GlassCard>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ============================================
// ACCESSIBILITY REASSURANCE MODAL
// ============================================

export const AccessibilityReassuranceModal = ({
  visible,
  onContinue,
  onDecline,
}: {
  visible: boolean;
  onContinue: () => void;
  onDecline: () => void;
}) => {
  const { isDark } = useOnboardingTheme();

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
      }}>
        <View style={{
          width: '100%',
          maxWidth: 400,
          backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
          borderRadius: 24,
          padding: 24,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 20 },
          shadowOpacity: 0.5,
          shadowRadius: 30,
          elevation: 20,
        }}>
          <LinearGradient
            colors={GRADIENT_COLORS.success}
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              alignItems: 'center',
              justifyContent: 'center',
              alignSelf: 'center',
              marginBottom: 20,
            }}
          >
            <Shield size={36} color="#FFFFFF" />
          </LinearGradient>

          <Text style={{
            fontSize: 24,
            fontWeight: '700',
            color: isDark ? '#ffffff' : '#0f172a',
            textAlign: 'center',
            marginBottom: 12,
            letterSpacing: -0.3,
          }}>
            Your Phone May Show a Warning
          </Text>

          <Text style={{
            fontSize: 15,
            color: isDark ? 'rgba(255,255,255,0.7)' : '#64748b',
            textAlign: 'center',
            lineHeight: 22,
            marginBottom: 24,
          }}>
            This is normal! Android shows this for all apps that use accessibility. We only use it to detect when you open blocked apps.
          </Text>

          <View style={{
            backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
            borderRadius: 16,
            padding: 16,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: 'rgba(16, 185, 129, 0.2)',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Lock size={18} color={COLORS.success} style={{ marginRight: 10 }} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.success }}>
                Your data stays on your device
              </Text>
            </View>
            <Text style={{ fontSize: 13, color: isDark ? 'rgba(255,255,255,0.6)' : '#64748b', lineHeight: 18 }}>
              We never collect, store, or transmit your personal information. Everything happens locally.
            </Text>
          </View>

          <GradientButton
            onPress={onContinue}
            title="I Understand, Continue"
            colors={GRADIENT_COLORS.success}
            style={{ marginBottom: 12 }}
          />

          <TouchableOpacity onPress={onDecline} style={{ padding: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 15, color: isDark ? 'rgba(255,255,255,0.5)' : '#94a3b8' }}>Decline</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ============================================
// DECLINE WARNING MODAL
// ============================================

export const DeclineWarningModal = ({
  visible,
  onContinue,
  onGoBack,
}: {
  visible: boolean;
  onContinue: () => void;
  onGoBack: () => void;
}) => {
  const { isDark } = useOnboardingTheme();

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
      }}>
        <View style={{
          width: '100%',
          maxWidth: 400,
          backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
          borderRadius: 24,
          padding: 24,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 20 },
          shadowOpacity: 0.5,
          shadowRadius: 30,
          elevation: 20,
        }}>
          <View style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'center',
            marginBottom: 20,
          }}>
            <X size={36} color={COLORS.error} />
          </View>

          <Text style={{
            fontSize: 24,
            fontWeight: '700',
            color: isDark ? '#ffffff' : '#0f172a',
            textAlign: 'center',
            marginBottom: 12,
          }}>
            App Blocking Won't Work
          </Text>

          <Text style={{
            fontSize: 15,
            color: isDark ? 'rgba(255,255,255,0.7)' : '#64748b',
            textAlign: 'center',
            lineHeight: 22,
            marginBottom: 24,
          }}>
            Without this permission, LockIn cannot block distracting apps. You'll lose the main feature of the app.
          </Text>

          <GradientButton
            onPress={onGoBack}
            title="Go Back & Enable"
            colors={GRADIENT_COLORS.success}
            style={{ marginBottom: 12 }}
          />

          <TouchableOpacity onPress={onContinue} style={{ padding: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 15, color: COLORS.error }}>Continue Without Blocking</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ============================================
// PAYWALL MODAL - Clean & Compact Design
// ============================================

export const PaywallModal = ({
  visible,
  onClose,
  onSubscribe,
  onRestore,
  savedHours,
}: {
  visible: boolean;
  onClose: () => void;
  onSubscribe: (plan: 'monthly' | 'yearly') => void;
  onRestore: () => void;
  savedHours: number;
}) => {
  const { colors, isDark } = useOnboardingTheme();
  const [selectedPlan, setSelectedPlan] = useState<'yearly' | 'monthly'>('yearly');
  const [trialMode, setTrialMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRestoring, setIsRestoring] = useState(false);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);

  // Prices with currency
  const [monthlyPrice, setMonthlyPrice] = useState('$7.99');
  const [yearlyPrice, setYearlyPrice] = useState('$39.99');
  const [yearlyMonthlyPrice, setYearlyMonthlyPrice] = useState('$3.33');
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [savings, setSavings] = useState(58);

  useEffect(() => {
    if (visible) {
      fetchOfferings();
    }
  }, [visible]);

  const fetchOfferings = async () => {
    try {
      setIsLoading(true);
      const offerings = await Purchases.getOfferings();

      // Collect ALL packages from ALL offerings
      const allPackages: PurchasesPackage[] = [];

      // Debug: log all offerings
      console.log('=== RevenueCat Offerings Debug ===');
      Object.keys(offerings.all).forEach(key => {
        const offering = offerings.all[key];
        console.log(`Offering: ${key}`, offering.availablePackages.length, 'packages');
        offering.availablePackages.forEach((p) => {
          console.log(`  - ${p.identifier} (${p.packageType}): ${p.product.priceString}`);
          allPackages.push(p);
        });
      });

      if (allPackages.length > 0) {
        setPackages(allPackages);

        // Find monthly package - check multiple ways
        let monthly = allPackages.find(p => p.packageType === 'MONTHLY');
        if (!monthly) monthly = allPackages.find(p => p.identifier === '$rc_monthly');
        if (!monthly) monthly = allPackages.find(p => p.identifier.toLowerCase().includes('month'));
        if (!monthly) monthly = allPackages.find(p => p.product.identifier.toLowerCase().includes('month'));

        // Find yearly package - check multiple ways
        let yearly = allPackages.find(p => p.packageType === 'ANNUAL');
        if (!yearly) yearly = allPackages.find(p => p.identifier === '$rc_annual');
        if (!yearly) yearly = allPackages.find(p => p.identifier.toLowerCase().includes('year') || p.identifier.toLowerCase().includes('annual'));
        if (!yearly) yearly = allPackages.find(p => p.product.identifier.toLowerCase().includes('year') || p.product.identifier.toLowerCase().includes('annual'));

        console.log('Found monthly:', monthly?.identifier, monthly?.product.priceString);
        console.log('Found yearly:', yearly?.identifier, yearly?.product.priceString);

        if (monthly) {
          setMonthlyPrice(monthly.product.priceString);
          // Extract currency symbol from price string
          const symbol = monthly.product.priceString.replace(/[\d.,\s]/g, '').trim();
          if (symbol) setCurrencySymbol(symbol);
        }

        if (yearly) {
          setYearlyPrice(yearly.product.priceString);
          const yearlyNum = yearly.product.price;
          const monthlyEquiv = yearlyNum / 12;

          // Use the same currency format as the yearly price
          const symbol = yearly.product.priceString.replace(/[\d.,\s]/g, '').trim() || currencySymbol;
          setYearlyMonthlyPrice(`${symbol}${monthlyEquiv.toFixed(2)}`);

          // Calculate real savings if we have monthly price
          if (monthly) {
            const monthlyNum = monthly.product.price;
            const savingsPercent = Math.round((1 - yearlyNum / (monthlyNum * 12)) * 100);
            setSavings(savingsPercent > 0 ? savingsPercent : 58);
          }
        }
      }
    } catch (e) {
      console.log('Error fetching offerings:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async () => {
    try {
      setIsLoading(true);
      const packageToPurchase = packages.find(p => {
        if (selectedPlan === 'yearly') {
          return p.packageType === 'ANNUAL' ||
                 p.identifier === '$rc_annual' ||
                 p.identifier.toLowerCase().includes('yearly') ||
                 p.identifier.toLowerCase().includes('annual');
        }
        return p.packageType === 'MONTHLY' ||
               p.identifier === '$rc_monthly' ||
               p.identifier.toLowerCase().includes('monthly');
      });

      if (packageToPurchase) {
        const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
        if (customerInfo.entitlements.active['premium'] || customerInfo.entitlements.active['pro']) {
          onSubscribe(selectedPlan);
        }
      } else {
        // Fallback if no package found
        onSubscribe(selectedPlan);
      }
    } catch (e: any) {
      if (!e.userCancelled) {
        console.log('Purchase error:', e);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    try {
      setIsRestoring(true);
      const customerInfo = await Purchases.restorePurchases();
      if (customerInfo.entitlements.active['premium'] || customerInfo.entitlements.active['pro']) {
        onRestore();
      }
    } catch (e) {
      console.log('Restore error:', e);
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: 56,
          paddingBottom: 12,
          zIndex: 1,
        }}>
          <TouchableOpacity onPress={handleRestore} disabled={isRestoring}>
            <Text style={{ fontSize: 15, color: colors.textSecondary }}>
              {isRestoring ? 'Restoring...' : 'Restore'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1, zIndex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Orb & Title */}
          <View style={{ alignItems: 'center', marginTop: 8, marginBottom: 24 }}>
            <View style={{ marginBottom: 16 }}>
              <AnimatedOrb size={80} level={3} />
            </View>
            <Text style={{
              fontSize: 26,
              fontWeight: '800',
              color: colors.textPrimary,
              textAlign: 'center',
              letterSpacing: -0.5,
            }}>
              Unlock LockIn Pro
            </Text>
            <Text style={{
              fontSize: 15,
              color: colors.textSecondary,
              textAlign: 'center',
              marginTop: 8,
            }}>
              Get <Text style={{ color: COLORS.success, fontWeight: '700' }}>{savedHours}+ hours</Text> back every week
            </Text>
          </View>

          {/* Social Proof */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 20,
            gap: 16,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {[1,2,3,4,5].map((star) => (
                <Star key={star} size={14} color="#FBBF24" fill="#FBBF24" style={{ marginRight: 1 }} />
              ))}
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginLeft: 6, fontWeight: '600' }}>4.8</Text>
            </View>
            <View style={{ width: 1, height: 14, backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }} />
            <Text style={{ fontSize: 13, color: colors.textSecondary }}>
              <Text style={{ fontWeight: '700', color: COLORS.success }}>92%</Text> complete tasks
            </Text>
          </View>

          {/* Trial Toggle */}
          <TouchableOpacity
            onPress={() => setTrialMode(!trialMode)}
            activeOpacity={0.8}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: trialMode
                ? isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)'
                : isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
              borderRadius: 14,
              padding: 14,
              marginBottom: 16,
              borderWidth: 1.5,
              borderColor: trialMode ? COLORS.success : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Shield size={20} color={trialMode ? COLORS.success : colors.textSecondary} style={{ marginRight: 10 }} />
              <Text style={{ fontSize: 15, fontWeight: '600', color: trialMode ? COLORS.success : colors.textPrimary }}>
                Not sure? Start free trial
              </Text>
            </View>
            <View style={{
              width: 48,
              height: 28,
              borderRadius: 14,
              backgroundColor: trialMode ? COLORS.success : isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
              padding: 2,
              justifyContent: 'center',
            }}>
              <View style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: '#FFFFFF',
                alignSelf: trialMode ? 'flex-end' : 'flex-start',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 2,
                elevation: 2,
              }} />
            </View>
          </TouchableOpacity>

          {/* Plan Selection */}
          {!trialMode && (
            <View style={{ marginBottom: 16 }}>
              {/* Yearly Plan */}
              <TouchableOpacity
                onPress={() => setSelectedPlan('yearly')}
                activeOpacity={0.8}
                style={{
                  backgroundColor: selectedPlan === 'yearly'
                    ? isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)'
                    : isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 10,
                  borderWidth: 2,
                  borderColor: selectedPlan === 'yearly' ? COLORS.gradientPurple : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: selectedPlan === 'yearly' ? COLORS.gradientPurple : colors.textTertiary,
                    backgroundColor: selectedPlan === 'yearly' ? COLORS.gradientPurple : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}>
                    {selectedPlan === 'yearly' && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>
                        Yearly
                      </Text>
                      <View style={{
                        backgroundColor: COLORS.success,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 4,
                        marginLeft: 8,
                      }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#FFFFFF' }}>
                          -{savings}%
                        </Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                      {yearlyMonthlyPrice}/mo
                    </Text>
                  </View>
                  <Text style={{ fontSize: 17, fontWeight: '800', color: colors.textPrimary }}>
                    {yearlyPrice}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Monthly Plan */}
              <TouchableOpacity
                onPress={() => setSelectedPlan('monthly')}
                activeOpacity={0.8}
                style={{
                  backgroundColor: selectedPlan === 'monthly'
                    ? isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)'
                    : isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 2,
                  borderColor: selectedPlan === 'monthly' ? COLORS.gradientPurple : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: selectedPlan === 'monthly' ? COLORS.gradientPurple : colors.textTertiary,
                    backgroundColor: selectedPlan === 'monthly' ? COLORS.gradientPurple : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}>
                    {selectedPlan === 'monthly' && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 }}>
                      Monthly
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                      Billed monthly
                    </Text>
                  </View>
                  <Text style={{ fontSize: 17, fontWeight: '800', color: colors.textPrimary }}>
                    {monthlyPrice}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Trial Info when trial mode is on */}
          {trialMode && (
            <View style={{
              backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.08)',
              borderRadius: 14,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: 'rgba(16, 185, 129, 0.2)',
            }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.success, marginBottom: 10 }}>
                3-day free trial includes:
              </Text>
              {['Full access to all features', 'Smart task verification', 'Focus sessions & blocking', 'Cancel anytime'].map((item, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Check size={14} color={COLORS.success} style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 13, color: colors.textSecondary }}>{item}</Text>
                </View>
              ))}

              {/* Price after trial */}
              <View style={{
                marginTop: 12,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: 'rgba(16, 185, 129, 0.2)',
              }}>
                <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 8 }}>
                  After trial ends:
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <TouchableOpacity
                    onPress={() => setSelectedPlan('yearly')}
                    style={{
                      flex: 1,
                      backgroundColor: selectedPlan === 'yearly' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                      borderRadius: 10,
                      padding: 10,
                      marginRight: 8,
                      borderWidth: 1,
                      borderColor: selectedPlan === 'yearly' ? COLORS.success : 'rgba(16, 185, 129, 0.3)',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 2 }}>Yearly</Text>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: selectedPlan === 'yearly' ? COLORS.success : colors.textPrimary }}>
                      {yearlyPrice}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setSelectedPlan('monthly')}
                    style={{
                      flex: 1,
                      backgroundColor: selectedPlan === 'monthly' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                      borderRadius: 10,
                      padding: 10,
                      marginLeft: 8,
                      borderWidth: 1,
                      borderColor: selectedPlan === 'monthly' ? COLORS.success : 'rgba(16, 185, 129, 0.3)',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 2 }}>Monthly</Text>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: selectedPlan === 'monthly' ? COLORS.success : colors.textPrimary }}>
                      {monthlyPrice}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* CTA Button */}
          <TouchableOpacity
            onPress={handlePurchase}
            disabled={isLoading}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={trialMode ? GRADIENT_COLORS.success : GRADIENT_COLORS.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 16,
                paddingVertical: 18,
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF' }}>
                  {trialMode ? 'Start 3-Day Free Trial' : 'Continue'}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Legal Links */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 12 }}>
            <TouchableOpacity onPress={() => Linking.openURL('https://lockin.app/terms')}>
              <Text style={{ fontSize: 13, color: colors.textTertiary }}>Terms of Service</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Linking.openURL('https://lockin.app/privacy')}>
              <Text style={{ fontSize: 13, color: colors.textTertiary }}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>

          {/* Fine Print */}
          <Text style={{
            fontSize: 11,
            color: colors.textTertiary,
            textAlign: 'center',
            lineHeight: 16,
          }}>
            3-day free trial. Cancel anytime. Subscription auto-renews unless cancelled 24 hours before the trial ends.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
};
