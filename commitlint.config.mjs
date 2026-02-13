export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "docs", "style", "refactor", "perf", "test", "build", "ci", "chore"],
    ],
    "scope-enum": [1, "always", ["ui", "widgets", "content", "config", "deps", "dx", "quality"]],
    "subject-case": [2, "never", ["upper-case"]],
    "header-max-length": [2, "always", 72],
  },
};
