/**
 * Abre una URL en el navegador del sistema (fuera de la app).
 * - En Tauri: plugin opener (navegador por defecto).
 * - En web puro: window.open.
 */
export async function openExternal(url: string): Promise<void> {
  const tauriGlobal = (window as unknown as { __TAURI__?: { opener?: { openUrl: (u: string) => Promise<void> } } })
    .__TAURI__
  if (tauriGlobal?.opener?.openUrl) {
    try {
      await tauriGlobal.opener.openUrl(url)
      return
    } catch {
      // caer al fallback
    }
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}
