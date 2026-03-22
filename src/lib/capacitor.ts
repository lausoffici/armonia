import { Capacitor } from '@capacitor/core'

/**
 * Returns true when the app runs inside a native Capacitor shell
 * (Android / iOS), false when running in the browser.
 */
export const isNative = Capacitor.isNativePlatform()
export const platform = Capacitor.getPlatform() // 'android' | 'ios' | 'web'

/**
 * Initializes all native plugins. Call once at app startup.
 * Gracefully no-ops on web.
 */
export async function initCapacitor() {
  if (!isNative) return

  const [{ StatusBar, Style }, { SplashScreen }, { App }] = await Promise.all([
    import('@capacitor/status-bar'),
    import('@capacitor/splash-screen'),
    import('@capacitor/app'),
  ])

  // Translucent status bar that overlays the WebView
  await StatusBar.setStyle({ style: Style.Dark })
  await StatusBar.setOverlaysWebView({ overlay: true })

  // Hide splash screen once the app is ready
  await SplashScreen.hide({ fadeOutDuration: 300 })

  // Handle Android hardware back button
  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back()
    } else {
      App.minimizeApp()
    }
  })
}

/**
 * Trigger a light haptic tap — use for button presses and nav taps.
 */
export async function hapticTap() {
  if (!isNative) return
  const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
  await Haptics.impact({ style: ImpactStyle.Light })
}
