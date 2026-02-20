module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat", // Nouvelle fonctionnalité
        "fix", // Correction de bug
        "docs", // Documentation
        "style", // Formatage, point-virgules manqués, etc.
        "refactor", // Refactoring du code
        "perf", // Amélioration des performances
        "test", // Ajout de tests
        "chore", // Maintenance
        "ci", // Intégration continue
        "build", // Système de build
        "revert", // Annulation d'un commit
      ],
    ],
    "subject-case": [2, "never", ["start-case", "pascal-case", "upper-case"]],
    "subject-max-length": [2, "always", 72],
    "body-max-line-length": [2, "always", 100],
    "footer-max-line-length": [2, "always", 100],
  },
};
