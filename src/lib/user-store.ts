export interface UserProfile {
  name: string;
  visionImages: string[]; // indices of preloaded images selected
  onboardingComplete: boolean;
}

let profile: UserProfile = {
  name: "",
  visionImages: [],
  onboardingComplete: false,
};

let listeners: Set<() => void> = new Set();
let cachedProfile = { ...profile };
let version = 0;
let lastVersion = -1;

function notify() {
  version++;
  cachedProfile = { ...profile };
  listeners.forEach((l) => l());
}

export function getProfile(): UserProfile {
  if (lastVersion !== version) {
    lastVersion = version;
    cachedProfile = { ...profile };
  }
  return cachedProfile;
}

export function setProfile(updates: Partial<UserProfile>) {
  profile = { ...profile, ...updates };
  try {
    localStorage.setItem("calm-profile", JSON.stringify(profile));
  } catch {}
  notify();
}

export function subscribeProfile(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Load
try {
  const stored = localStorage.getItem("calm-profile");
  if (stored) {
    profile = JSON.parse(stored);
    cachedProfile = { ...profile };
  }
} catch {}
