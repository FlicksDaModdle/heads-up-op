import * as ScreenOrientation from 'expo-screen-orientation';
import { Dimensions, Platform } from 'react-native';

const MAX_WAIT_MS = 700;

function isLandscapeNow(): boolean {
  const { width, height } = Dimensions.get('window');
  return width > height;
}

/**
 * Locks the screen to portrait or landscape and resolves once the window
 * has actually rotated (or after a short timeout), so the next screen is
 * laid out at its final size instead of jumping mid-rotation.
 */
export async function rotateTo(landscape: boolean): Promise<void> {
  const lock = landscape
    ? ScreenOrientation.OrientationLock.LANDSCAPE
    : ScreenOrientation.OrientationLock.PORTRAIT_UP;
  try {
    await ScreenOrientation.lockAsync(lock);
  } catch {
    // Not supported (e.g. desktop web): carry on in whatever shape we are.
  }
  if (Platform.OS === 'web' || isLandscapeNow() === landscape) return;

  await new Promise<void>((resolve) => {
    const finish = () => {
      clearTimeout(timer);
      sub.remove();
      resolve();
    };
    const timer = setTimeout(finish, MAX_WAIT_MS);
    const sub = Dimensions.addEventListener('change', () => {
      if (isLandscapeNow() === landscape) finish();
    });
  });
}
