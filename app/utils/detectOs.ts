export type CrashOs = 'windows' | 'mac' | 'linux'

// Which system the visitor is on, for Floppy's fake crash. Phones count as their closest desktop.
export function detectOs(): CrashOs {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } }
  const text = `${nav.userAgentData?.platform ?? ''} ${nav.userAgent}`
  if (/windows/i.test(text)) return 'windows'
  if (/iphone|ipad|ipod|mac/i.test(text)) return 'mac'
  if (/android|linux|cros|x11/i.test(text)) return 'linux'
  return 'windows'
}
