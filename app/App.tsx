import React, { useCallback, useEffect } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as ImagePicker from 'expo-image-picker';

import { Dock } from './src/components/Dock';
import { RecentSheet } from './src/components/RecentSheet';
import { Checklist } from './src/screens/Checklist';
import { Onboarding } from './src/screens/Onboarding';
import { Scan } from './src/screens/Scan';
import { C } from './src/theme';
import { usePacking } from './src/usePacking';

/** The scrim behind the sheet — `@keyframes veil`, held so it can fade out too. */
function Dim({ open, onPress }: { open: boolean; onPress: () => void }) {
  const o = useSharedValue(0);
  useEffect(() => {
    o.value = withTiming(open ? 1 : 0, { duration: 220 });
  }, [open, o]);
  const anim = useAnimatedStyle(() => ({ opacity: o.value }));

  return (
    <Animated.View
      pointerEvents={open ? 'auto' : 'none'}
      onTouchEnd={onPress}
      style={[
        { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 14, backgroundColor: C.dim },
        anim,
      ]}
    />
  );
}

function Root() {
  const p = usePacking();
  const { height } = useWindowDimensions();
  // The prototype's sheet was 600px inside an 844px frame.
  const sheetHeight = Math.min(620, height * 0.72);

  const openPicker = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      // Still let the demo run — the scan is simulated either way.
      p.beginScan(null);
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.6,
    });
    if (res.canceled) return;
    p.beginScan(res.assets[0]?.uri ?? null);
  }, [p]);

  const onboarding = p.screen === 'ob';

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      {/* stage */}
      <View style={{ flex: 1, minHeight: 0 }}>
        {onboarding ? (
          <Onboarding onStartPack={p.startPack} onCamera={openPicker} />
        ) : (
          <Checklist p={p} />
        )}

        {/* Toasts live inside Checklist — they only ever fire once a list exists. */}
        <Dim open={p.sheet} onPress={() => p.setSheet(false)} />
      </View>

      {!onboarding && (
        <Dock
          canAct={p.canAct}
          sheetOpen={p.sheet}
          onSave={p.saveNow}
          onToggleSheet={() => p.setSheet(!p.sheet)}
          onCheckAll={p.checkAll}
        />
      )}

      {!onboarding && (
        <RecentSheet
          open={p.sheet}
          height={sheetHeight}
          hist={p.hist}
          onClose={() => p.setSheet(false)}
          onToggle={() => p.setSheet(!p.sheet)}
          onRestore={p.restoreSnapshot}
          onStartPack={p.startPack}
          onCamera={openPicker}
        />
      )}

      {p.scan && (
        <Scan
          scanning={p.scanning}
          photo={p.photo}
          sel={p.sel}
          onBack={p.closeScan}
          onToggleToken={p.toggleToken}
          onAccept={p.acceptScan}
        />
      )}
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    'Pretendard-Regular': require('./assets/fonts/Pretendard-Regular.ttf'),
    'Pretendard-SemiBold': require('./assets/fonts/Pretendard-SemiBold.ttf'),
    'Pretendard-Bold': require('./assets/fonts/Pretendard-Bold.ttf'),
    'Pretendard-ExtraBold': require('./assets/fonts/Pretendard-ExtraBold.ttf'),
    // Deep import: the package index re-exports all five weights, and we want one.
    SpaceGrotesk_700Bold: require('@expo-google-fonts/space-grotesk/700Bold/SpaceGrotesk_700Bold.ttf'),
  });

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: C.paper }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        {fontsLoaded ? <Root /> : <View style={{ flex: 1, backgroundColor: C.paper }} />}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
