import neostandard from 'newneostandard'

export default [
    ...neostandard({
        ts: true,
        noJsx: true,
        ignores: [
            'dist/**',
            'public/**',
            'docs/**',
            'test/**/*.js',
            'lib.es5.d.ts',
        ],
    }),

    // formatting overrides -- match the project's prior `.eslintrc` settings
    {
        rules: {
            '@stylistic/indent': ['error', 4, {
                SwitchCase: 1,
                ignoredNodes: ['TemplateLiteral *'],
            }],
            '@stylistic/no-multiple-empty-lines': ['error', {
                max: 1,
                maxEOF: 1,
            }],
            '@stylistic/no-multi-spaces': ['error', {
                ignoreEOLComments: true,
            }],
            '@stylistic/comma-dangle': 'off',
            '@stylistic/operator-linebreak': 'off',
            '@stylistic/multiline-ternary': 'off',

            // @stylistic's key-spacing/space-infix-ops now also check
            // TS type annotations and union types, which the old
            // eslint-config-standard setup never did. Keep those
            // unchecked so the `name:Type` style stays untouched.
            '@stylistic/key-spacing': ['error', {
                ignoredNodes: [
                    'TSInterfaceBody',
                    'TSTypeLiteral',
                    'ClassBody',
                ],
            }],
            '@stylistic/space-infix-ops': ['error', {
                ignoreTypes: true,
            }],
        },
    },

    // TypeScript overrides -- match the project's prior `.eslintrc` settings
    {
        files: ['**/*.ts'],
        rules: {
            '@typescript-eslint/no-unused-expressions': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/consistent-type-imports': ['error', {
                prefer: 'type-imports',
            }],
            '@typescript-eslint/no-unused-vars': ['error', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
                caughtErrorsIgnorePattern: '^_',
            }],
        },
    },
]
