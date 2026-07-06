import { defineConfig, type OxlintConfig, type OxlintOverride } from "oxlint"

type Rules = NonNullable<OxlintConfig["rules"]>
type RestrictedImportsRule = NonNullable<Rules["no-restricted-imports"]>

const TS_FILES = ["**/*.ts", "**/*.tsx"]

const IGNORE_PATTERNS = [
  ".agents/**",
  ".codex/**",
  ".next/**",
  ".worktrees/**",
  "coverage/**",
  "dist/**",
  "drizzle/**",
  "node_modules/**",
  "playwright-report/**",
  "storybook-static/**",
  "test-results/**",
]

const FEATURE_NAMES = [
  "auth",
  "household",
  "billing",
  "calendar",
  "payments",
] as const

const SHARED_LAYER_FILES = ["src/shared/**/*.ts", "src/shared/**/*.tsx"]
const CONFIG_LAYER_FILES = ["src/config/**/*.ts", "src/config/**/*.tsx"]

const TYPESCRIPT_RECOMMENDED_RULES: Rules = {
  "no-array-constructor": "error",
  "no-empty-function": "error",
  "no-unused-expressions": "error",
  "no-unused-vars": "error",
  "typescript/ban-ts-comment": [
    "error",
    {
      "ts-expect-error": "allow-with-description",
      "ts-ignore": true,
      "ts-nocheck": true,
      "ts-check": false,
      minimumDescriptionLength: 10,
    },
  ],
  "typescript/no-duplicate-enum-values": "error",
  "typescript/no-empty-object-type": "error",
  "typescript/no-explicit-any": [
    "error",
    {
      fixToUnknown: true,
      ignoreRestArgs: false,
    },
  ],
  "typescript/no-extra-non-null-assertion": "error",
  "typescript/no-import-type-side-effects": "error",
  "typescript/no-misused-new": "error",
  "typescript/no-namespace": "error",
  "typescript/no-non-null-asserted-optional-chain": "error",
  "typescript/no-require-imports": "error",
  "typescript/no-this-alias": "error",
  "typescript/no-unnecessary-type-constraint": "error",
  "typescript/no-unsafe-declaration-merging": "error",
  "typescript/no-unsafe-function-type": "error",
  "typescript/no-wrapper-object-types": "error",
  "typescript/prefer-as-const": "error",
  "typescript/prefer-namespace-keyword": "error",
  "typescript/triple-slash-reference": "error",
}

const REACT_RECOMMENDED_RULES: Rules = {
  "react/display-name": "off",
  "react/jsx-key": "error",
  "react/jsx-no-comment-textnodes": "error",
  "react/jsx-no-duplicate-props": "error",
  "react/jsx-no-target-blank": "error",
  "react/jsx-no-undef": "error",
  "react/no-children-prop": "error",
  "react/no-danger-with-children": "error",
  "react/no-direct-mutation-state": "error",
  "react/no-find-dom-node": "error",
  "react/no-is-mounted": "error",
  "react/no-render-return-value": "error",
  "react/no-string-refs": "error",
  "react/no-unescaped-entities": "error",
  "react/no-unknown-property": "error",
  "react/no-unsafe": "error",
  "react/react-in-jsx-scope": "off",
  "react/require-render-return": "error",
}

const REACT_HOOKS_RECOMMENDED_RULES: Rules = {
  "react/rules-of-hooks": "error",
  "react/exhaustive-deps": "error",
}

const PROJECT_RULE_OVERRIDES: Rules = {
  "typescript/consistent-type-imports": [
    "error",
    {
      prefer: "type-imports",
      fixStyle: "separate-type-imports",
      disallowTypeAnnotations: false,
    },
  ],
}

const capitalize = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1)

const toFeatureImportPattern = (featureName: string) =>
  `@features/${featureName}/**`

const ARCHITECTURE_BOUNDARY_MESSAGES = {
  feature: (featureName: string) =>
    `${capitalize(featureName)} feature should not import from other features.`,
  shared:
    "Shared layer cannot import from features. Move the dependency to shared/.",
  config:
    "Config layer cannot import from features. Extract a shared contract or move the logic down.",
}

const createRestrictedImportsRule = (
  patterns: string[],
  message: string,
): RestrictedImportsRule =>
  [
    "error",
  {
    patterns: [
      {
        group: patterns,
        message,
      },
    ],
  },
  ] as RestrictedImportsRule

const createFeatureBoundaryConfig = (featureName: string): OxlintOverride => {
  const disallowedFeatureImports = FEATURE_NAMES.filter(
    (name) => name !== featureName,
  ).map(toFeatureImportPattern)

  return {
    files: [
      `src/features/${featureName}/**/*.ts`,
      `src/features/${featureName}/**/*.tsx`,
    ],
    rules: {
      "no-restricted-imports": createRestrictedImportsRule(
        disallowedFeatureImports,
        ARCHITECTURE_BOUNDARY_MESSAGES.feature(featureName),
      ),
    },
  }
}

const featureBoundaryConfigs: OxlintOverride[] = FEATURE_NAMES.map(
  createFeatureBoundaryConfig,
)

const sharedLayerBoundaryConfig: OxlintOverride = {
  files: SHARED_LAYER_FILES,
  rules: {
    "no-restricted-imports": createRestrictedImportsRule(
      ["@features/**"],
      ARCHITECTURE_BOUNDARY_MESSAGES.shared,
    ),
  },
}

const configLayerBoundaryConfig: OxlintOverride = {
  files: CONFIG_LAYER_FILES,
  rules: {
    "no-restricted-imports": createRestrictedImportsRule(
      ["@features/**"],
      ARCHITECTURE_BOUNDARY_MESSAGES.config,
    ),
  },
}

export default defineConfig({
  ignorePatterns: IGNORE_PATTERNS,
  plugins: ["eslint", "typescript", "react"],
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  settings: {
    react: {
      version: "19.2.7",
    },
  },
  options: {
    denyWarnings: true,
    maxWarnings: 0,
    reportUnusedDisableDirectives: "error",
  },
  overrides: [
    {
      files: TS_FILES,
      rules: {
        ...TYPESCRIPT_RECOMMENDED_RULES,
        ...REACT_RECOMMENDED_RULES,
        ...REACT_HOOKS_RECOMMENDED_RULES,
        ...PROJECT_RULE_OVERRIDES,
      },
    },
    ...featureBoundaryConfigs,
    sharedLayerBoundaryConfig,
    configLayerBoundaryConfig,
  ],
})
