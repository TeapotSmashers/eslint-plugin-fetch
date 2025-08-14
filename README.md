# @teapot-smashers/eslint-plugin-fetch

ESLint plugin with rules to help you write better `fetch()` API calls.

## Installation

Use [npm](https://www.npmjs.com/) or a compatibility tool to install.

```bash
npm install --save-dev eslint @teapot-smashers/eslint-plugin-fetch
```

### Requirements

- Node.js v8.10.0 or newer versions.
- ESLint v5.16.0 or newer versions.

## Usage

Add the plugin to your ESLint configuration file:

### ESLint Flat Config (eslint.config.js)

```js
import fetchPlugin from '@teapot-smashers/eslint-plugin-fetch';

export default [
  {
    plugins: {
      fetch: fetchPlugin,
    },
    rules: {
      'fetch/require-json-content-type': 'error',
      'fetch/require-encoded-query-params': 'error',
      'fetch/require-status-check': 'error',
    },
  },
];
```

### Legacy Config (.eslintrc.json)

```json
{
  "plugins": ["@teapot-smashers/fetch"],
  "rules": {
    "@teapot-smashers/fetch/require-json-content-type": "error",
    "@teapot-smashers/fetch/require-encoded-query-params": "error",
    "@teapot-smashers/fetch/require-status-check": "error"
  }
}
```

## Configs

- `@teapot-smashers/fetch/recommended` - enables all rules with recommended settings

### Using the Recommended Config

#### ESLint Flat Config

```js
import fetchPlugin from '@teapot-smashers/eslint-plugin-fetch';

export default [
  {
    plugins: {
      fetch: fetchPlugin,
    },
    extends: ['fetch/recommended'],
  },
];
```

#### Legacy Config

```json
{
  "extends": ["plugin:@teapot-smashers/fetch/recommended"]
}
```

## Rules

| Rule ID                                                                      | Description                                        | Fixable | Recommended |
| :--------------------------------------------------------------------------- | :------------------------------------------------- | :------ | :---------- |
| [require-json-content-type](./docs/rules/require-json-content-type.md)       | Require Content-Type header when sending JSON data | 🔧      | ✅          |
| [require-encoded-query-params](./docs/rules/require-encoded-query-params.md) | Require proper encoding of query parameters        |         | ✅          |
| [require-status-check](./docs/rules/require-status-check.md)                 | Require checking response.ok or response.status    |         | ✅          |

## Why This Plugin?

The `fetch()` API has several gotchas that can lead to bugs and security issues:

1. **Missing Content-Type headers** - Servers may not parse JSON correctly without proper headers
2. **Unencoded query parameters** - Can lead to injection attacks and broken URLs
3. **No automatic error handling** - `fetch()` doesn't throw on HTTP error status codes

This plugin helps catch these issues early in development.

## Examples

### Before (Problematic Code)

```js
// ❌ Missing Content-Type header
fetch('/api/users', {
  method: 'POST',
  body: JSON.stringify({ name: 'John' }),
});

// ❌ Unencoded query parameters (security risk)
fetch(`/api/search?q=${userInput}`);

// ❌ No status check (silent failures)
const response = await fetch('/api/data');
const data = await response.json(); // Might fail on 404, 500, etc.
```

### After (Safe Code)

```js
// ✅ Proper Content-Type header
fetch('/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ name: 'John' }),
});

// ✅ Properly encoded query parameters
const params = new URLSearchParams({ q: userInput });
fetch(`/api/search?${params}`);

// ✅ Proper error handling
const response = await fetch('/api/data');
if (!response.ok) {
  throw new Error(`HTTP error! status: ${response.status}`);
}
const data = await response.json();
```

## Contributing

Contributions are welcome! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT
