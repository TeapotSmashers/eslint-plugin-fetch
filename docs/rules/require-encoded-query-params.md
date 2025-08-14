# @teapot-smashers/fetch/require-encoded-query-params

> Require proper encoding of query parameters in fetch URLs

## Rule Details

When building URLs with dynamic query parameters, you must properly encode them to prevent injection attacks and ensure correct URL formatting. This rule encourages using `URLSearchParams` for building query strings instead of manual concatenation.

❌ Examples of **incorrect** code for this rule:

```js
// Unsafe string concatenation
fetch('/api/search?q=' + userInput);

// Unsafe template literals
fetch(`/api/search?q=${userInput}`);

// Multiple unencoded parameters
fetch('/api/search?q=' + query + '&sort=' + sortBy);

// Template literal with multiple unencoded parameters
fetch(`/api/search?q=${query}&limit=${limit}&offset=${offset}`);
```

✅ Examples of **correct** code for this rule:

```js
// Using URLSearchParams (recommended)
const params = new URLSearchParams();
params.set('q', userInput);
fetch('/api/search?' + params.toString());

// Or inline URLSearchParams
fetch('/api/search?' + new URLSearchParams({ q: userInput }).toString());

// Template literal with URLSearchParams
fetch(`/api/search?${new URLSearchParams({ q: userInput })}`);

// Using URL constructor
const url = new URL('/api/search', 'https://api.example.com');
url.searchParams.set('q', userInput);
fetch(url.href);

// Static URLs without variables (safe)
fetch('/api/data?param=value');
fetch('/api/data?search=test&limit=10');
```

## Why?

Unencoded query parameters can lead to:

- **Security vulnerabilities**: Injection attacks through malicious query parameters
- **Broken URLs**: Special characters in parameters can break URL parsing
- **Data corruption**: Unencoded data may not be transmitted correctly

## Options

### `allowManualEncoding`

When `true` (default), the rule will suggest using `URLSearchParams` even when `encodeURIComponent()` is used.
When `false`, manual encoding with `encodeURIComponent()` is considered acceptable.

```js
// With allowManualEncoding: true (default)
fetch('/api/search?q=' + encodeURIComponent(query)); // ⚠️ Suggests URLSearchParams

// With allowManualEncoding: false
fetch('/api/search?q=' + encodeURIComponent(query)); // ✅ Allowed
```

Example configuration:

```js
{
  "rules": {
    "@teapot-smashers/fetch/require-encoded-query-params": ["error", {
      "allowManualEncoding": false
    }]
  }
}
```

## When Not To Use It

If you have a codebase that consistently uses `encodeURIComponent()` for query parameters and you don't want to migrate to `URLSearchParams`, you can disable this rule or set `allowManualEncoding: false`.
