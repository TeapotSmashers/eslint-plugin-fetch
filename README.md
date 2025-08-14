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
      // Core safety rules
      'fetch/require-json-content-type': 'error',
      'fetch/require-encoded-query-params': 'error',
      'fetch/require-status-check': 'error',
      'fetch/require-timeout': 'error',
      'fetch/require-error-handling': 'error',

      // Code quality rules
      'fetch/require-json-response-check': 'error',
      'fetch/prefer-async-await': 'warn',
      'fetch/no-json-in-get-requests': 'error',
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
    "@teapot-smashers/fetch/require-status-check": "error",
    "@teapot-smashers/fetch/require-timeout": "error",
    "@teapot-smashers/fetch/require-error-handling": "error",
    "@teapot-smashers/fetch/require-json-response-check": "error",
    "@teapot-smashers/fetch/prefer-async-await": "warn",
    "@teapot-smashers/fetch/no-json-in-get-requests": "error"
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

### Core Safety Rules

| Rule ID                                                                      | Description                                        | Fixable | Recommended |
| :--------------------------------------------------------------------------- | :------------------------------------------------- | :------ | :---------- |
| [require-json-content-type](./docs/rules/require-json-content-type.md)       | Require Content-Type header when sending JSON data | 🔧      | ✅          |
| [require-encoded-query-params](./docs/rules/require-encoded-query-params.md) | Require proper encoding of query parameters        |         | ✅          |
| [require-status-check](./docs/rules/require-status-check.md)                 | Require checking response.ok or response.status    |         | ✅          |
| [require-timeout](./docs/rules/require-timeout.md)                           | Require timeout configuration to prevent hanging   |         | ✅          |
| [require-error-handling](./docs/rules/require-error-handling.md)             | Require error handling with try/catch or .catch()  |         | ✅          |

### Code Quality Rules

| Rule ID                                                                    | Description                                      | Fixable | Recommended |
| :------------------------------------------------------------------------- | :----------------------------------------------- | :------ | :---------- |
| [require-json-response-check](./docs/rules/require-json-response-check.md) | Check Content-Type before parsing JSON responses |         | ✅          |
| [prefer-async-await](./docs/rules/prefer-async-await.md)                   | Prefer async/await over promise chains           |         | ⚠️          |
| [no-json-in-get-requests](./docs/rules/no-json-in-get-requests.md)         | Disallow JSON body in GET requests               |         | ✅          |

## Why This Plugin?

The `fetch()` API has several gotchas that can lead to bugs, security issues, and poor user experience:

### Core Safety Issues

1. **Missing Content-Type headers** - Servers may not parse JSON correctly without proper headers
2. **Unencoded query parameters** - Can lead to injection attacks and broken URLs
3. **No automatic error handling** - `fetch()` doesn't throw on HTTP error status codes
4. **No built-in timeouts** - Requests can hang indefinitely, leading to poor UX
5. **Unhandled promise rejections** - Network errors can crash applications

### Code Quality Issues

6. **Unsafe JSON parsing** - `response.json()` throws on non-JSON responses
7. **Complex promise chains** - Hard to read and debug compared to async/await
8. **HTTP semantics violations** - Using JSON bodies in GET requests

This plugin helps catch these issues early in development, making your fetch code more robust, secure, and maintainable.

## Examples

### Before (Problematic Code)

```js
// ❌ Multiple issues in one function
async function fetchUserData(userId) {
  // Missing timeout, error handling, and status check
  const response = await fetch(`/api/users/${userId}`);

  // Unsafe JSON parsing without Content-Type check
  const user = await response.json();

  // Unencoded query parameters in search
  const searchResponse = await fetch(`/api/search?q=${user.name}&type=user`);
  const results = await searchResponse.json();

  return { user, results };
}

// ❌ Promise chain instead of async/await
fetch('/api/data')
  .then((response) => response.json()) // No status or content-type check
  .then((data) => console.log(data)); // No error handling

// ❌ JSON in GET request
fetch('/api/search', {
  method: 'GET',
  body: JSON.stringify({ query: 'javascript', filters: ['recent'] }),
});
```

### After (Safe & Robust Code)

```js
// ✅ Comprehensive safe implementation
async function fetchUserData(userId) {
  try {
    // Proper timeout and error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`/api/users/${userId}`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Status check before processing
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Content-Type check before JSON parsing
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw new Error('Response is not JSON');
    }

    const user = await response.json();

    // Properly encoded query parameters
    const searchParams = new URLSearchParams({
      q: user.name,
      type: 'user',
    });

    const searchResponse = await fetch(`/api/search?${searchParams}`, {
      signal: AbortSignal.timeout(3000),
    });

    if (!searchResponse.ok) {
      throw new Error(`Search failed: ${searchResponse.status}`);
    }

    const results = await searchResponse.json();
    return { user, results };
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    console.error('Failed to fetch user data:', error);
    throw error;
  }
}

// ✅ Clean async/await with proper error handling
async function fetchData() {
  try {
    const response = await fetch('/api/data', {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const data = await response.json();
      console.log(data);
    } else {
      const text = await response.text();
      console.log('Non-JSON response:', text);
    }
  } catch (error) {
    console.error('Fetch failed:', error.message);
  }
}

// ✅ POST request for complex search data
async function searchWithFilters() {
  try {
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'javascript',
        filters: ['recent', 'popular'],
        sort: { field: 'date', order: 'desc' },
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
}
```

## Quick Start

1. **Install the plugin**:

   ```bash
   npm install --save-dev eslint @teapot-smashers/eslint-plugin-fetch
   ```

2. **Use the recommended config** in your `eslint.config.js`:

   ```js
   import fetchPlugin from '@teapot-smashers/eslint-plugin-fetch';

   export default [
     {
       plugins: { fetch: fetchPlugin },
       extends: ['fetch/recommended'],
     },
   ];
   ```

3. **Run ESLint** to catch fetch-related issues:
   ```bash
   npx eslint your-code.js
   ```

## Contributing

Contributions are welcome! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT
