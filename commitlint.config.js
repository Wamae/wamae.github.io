export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Existing history and tooling write unwrapped body paragraphs.
    "body-max-line-length": [0],
  },
};
