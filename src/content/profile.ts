import profileData from "./profile.json";
import type { Profile } from "./profile-types";
import { validateProfile } from "./validate-profile";

/**
 * The one place where the data file is read. It is validated on every call, so a bad edit
 * fails the build with a message that lists every problem.
 */
export function getProfile(): Profile {
  return validateProfile(profileData);
}
