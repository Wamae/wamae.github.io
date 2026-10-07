/** The icons copied into `src/assets/icons/`. Add the file there, then the name here. */
export const iconNames = ["briefcase", "folder", "user", "mail", "file-text", "monitor"] as const;

export type IconName = (typeof iconNames)[number];
