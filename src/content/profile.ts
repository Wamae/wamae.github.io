import cvSource from "../../content/cv.yml?raw";
import { cvFilePath } from "./cv-file";
import type { Profile } from "./profile-types";
import { validateProfile } from "./validate-profile";
import { parseYamlSource } from "./yaml-source";

/** Reads and validates CV text. Throws one error that names every problem and its line. */
export function loadProfile(source: string, filename: string = cvFilePath): Profile {
  const { data, lineOf } = parseYamlSource(source, filename);
  return validateProfile(data, lineOf, filename);
}

/**
 * The one place where the CV file is read. It is imported as text, so the dev server reloads when
 * the file changes, and it is validated on every call, so a bad edit fails the build.
 */
export function getProfile(): Profile {
  return loadProfile(cvSource);
}
