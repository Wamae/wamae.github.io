export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Warn, do not fail: Dependabot and other tools write long unwrapped lines.
    "body-max-line-length": [1, "always", 100],
  },
};
