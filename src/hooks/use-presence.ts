// This hook has been disabled to resolve persistent permission errors.
// It can be re-enabled later if a stable solution for presence is found.
export function usePresence() {
  return { presentUsers: [], isLoading: false };
}
