import type { MaybeRefOrGetter } from 'vue'

/**
 * Asks for confirmation before leaving a page with unsaved form changes —
 * both in-app navigation and closing/reloading the tab.
 */
export function useUnsavedChangesGuard(isDirty: MaybeRefOrGetter<boolean>) {
  onBeforeRouteLeave(() => {
    if (!toValue(isDirty)) return true
    return window.confirm('You have unsaved changes. Leave this page and discard them?')
  })

  function onBeforeUnload(event: BeforeUnloadEvent) {
    if (!toValue(isDirty)) return
    event.preventDefault()
  }

  onMounted(() => window.addEventListener('beforeunload', onBeforeUnload))
  onBeforeUnmount(() => window.removeEventListener('beforeunload', onBeforeUnload))
}
