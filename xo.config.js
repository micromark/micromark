/**
 * @import {FlatXoConfig} from 'xo'
 */

import globals from 'globals'

/** @type {FlatXoConfig} */
const xoConfig = [
  {
    languageOptions: {globals: {...globals.node, ...globals.browser}},
    prettier: 'compat',
    space: true
  },
  {
    name: 'default',
    rules: {
      '@typescript-eslint/array-type': ['error', {default: 'generic'}],
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/no-duplicate-type-constituents': 'off',
      '@typescript-eslint/no-restricted-types': 'off',
      'import-x/extensions': 'off',
      'import-x/order': 'off',
      'jsdoc/check-indentation': 'off',
      'jsdoc/check-line-alignment': 'off',
      'jsdoc/check-param-names': 'off',
      'jsdoc/check-tag-names': 'off',
      'jsdoc/escape-inline-tags': 'off',
      'jsdoc/imports-as-dependencies': 'off',
      'jsdoc/informative-docs': 'off',
      'jsdoc/no-blank-block-descriptions': 'off',
      'jsdoc/no-multi-asterisks': 'off',
      'jsdoc/require-asterisk-prefix': 'off',
      'jsdoc/require-description': 'off',
      'jsdoc/require-param': 'off',
      'jsdoc/require-param-description': 'off',
      'jsdoc/require-property-description': 'off',
      'jsdoc/require-returns-check': 'off',
      'jsdoc/require-returns-description': 'off',
      'jsdoc/require-returns-type': 'off',
      'jsdoc/valid-types': 'off',
      'logical-assignment-operators': 'off',
      'max-depth': 'off',
      'max-params': 'off',
      'n/file-extension-in-import': 'off',
      'no-await-in-loop': 'off',
      'no-shadow': 'off',
      'node-test/no-constant-assertion': 'off',
      'prefer-arrow-callback': 'off',
      'prefer-destructuring': 'off',
      'regexp/no-obscure-range': 'off',
      'regexp/prefer-named-capture-group': 'off',
      'regexp/unicode-property': 'off',
      'regexp/use-ignore-case': 'off',
      'require-unicode-regexp': 'off',
      'unicorn/consistent-boolean-name': 'off',
      'unicorn/logical-assignment-operators': 'off',
      'unicorn/max-nested-calls': 'off',
      'unicorn/no-array-reverse': 'off',
      'unicorn/no-break-in-nested-loop': 'off',
      'unicorn/no-computed-property-existence-check': 'off',
      'unicorn/no-this-assignment': 'off',
      'unicorn/no-unnecessary-array-splice-count': 'off',
      'unicorn/no-unnecessary-splice': 'off',
      'unicorn/no-unsafe-string-replacement': 'off',
      'unicorn/prefer-at': 'off',
      'unicorn/prefer-code-point': 'off',
      'unicorn/prefer-continue': 'off',
      'unicorn/prefer-early-return': 'off',
      'unicorn/prefer-https': 'off',
      'unicorn/prefer-includes-over-repeated-comparisons': 'off',
      'unicorn/prefer-iterator-to-array': 'off',
      'unicorn/prefer-logical-operator-over-ternary': 'off',
      'unicorn/prefer-spread': 'off',
      'unicorn/prefer-string-raw': 'off',
      'unicorn/prefer-string-replace-all': 'off',
      'unicorn/prefer-unicode-code-point-escapes': 'off'
    }
  },
  {
    files: ['test/**/*.js'],
    rules: {
      'import-x/no-unassigned-import': 'off',
      'n/no-extraneous-import': 'off'
    }
  },
  {
    files: ['packages/micromark-util-combine-extensions/**'],
    rules: {'guard-for-in': 'off'}
  },
  {
    files: ['packages/micromark-util-types/**'],
    rules: {'unicorn/text-encoding-identifier-case': 'off'}
  },
  {
    files: ['packages/micromark/**'],
    rules: {'unicorn/prefer-event-target': 'off'}
  }
]

export default xoConfig
