import { create } from "zustand";

interface CrmSessionState {
  user: any | null;
  business: any | null;
  isAuthenticated: boolean | null;
  isOnboardingCompleted: boolean | null;
  isLoading: boolean;
  fetchSession: (force?: boolean) => Promise<{
    authenticated: boolean;
    user?: any;
    business?: any;
    isOnboardingCompleted?: boolean;
  }>;
  setSession: (user: any, business: any, isOnboardingCompleted?: boolean) => void;
  clearSession: () => void;
}

let sessionFetchPromise: Promise<any> | null = null;

export const useCrmSessionStore = create<CrmSessionState>((set, get) => ({
  user: null,
  business: null,
  isAuthenticated: null,
  isOnboardingCompleted: null,
  isLoading: false,

  fetchSession: async (force = false) => {
    const state = get();
    // Return cached session if already available and not forced
    if (!force && state.isAuthenticated !== null && state.user && state.business) {
      return {
        authenticated: state.isAuthenticated,
        user: state.user,
        business: state.business,
        isOnboardingCompleted: state.isOnboardingCompleted ?? true,
      };
    }

    // Reuse in-flight fetch promise if one is already running
    if (sessionFetchPromise && !force) {
      return sessionFetchPromise;
    }

    set({ isLoading: true });

    sessionFetchPromise = (async () => {
      try {
        const res = await fetch("/api/crm/auth/session");
        const data = await res.json();

        if (data.authenticated) {
          set({
            user: data.user,
            business: data.business,
            isAuthenticated: true,
            isOnboardingCompleted: Boolean(data.isOnboardingCompleted),
            isLoading: false,
          });
          return {
            authenticated: true,
            user: data.user,
            business: data.business,
            isOnboardingCompleted: Boolean(data.isOnboardingCompleted),
          };
        } else {
          set({
            user: null,
            business: null,
            isAuthenticated: false,
            isOnboardingCompleted: false,
            isLoading: false,
          });
          return { authenticated: false };
        }
      } catch (err) {
        console.error("Failed to fetch CRM session:", err);
        set({ isLoading: false });
        return { authenticated: false };
      } finally {
        sessionFetchPromise = null;
      }
    })();

    return sessionFetchPromise;
  },

  setSession: (user: any, business: any, isOnboardingCompleted?: boolean) => {
    set({
      user,
      business,
      isAuthenticated: true,
      isOnboardingCompleted:
        isOnboardingCompleted !== undefined
          ? isOnboardingCompleted
          : Boolean(business && (user?.isOnboardingCompleted ?? true)),
    });
  },

  clearSession: () => {
    set({
      user: null,
      business: null,
      isAuthenticated: false,
      isOnboardingCompleted: false,
      isLoading: false,
    });
  },
}));
