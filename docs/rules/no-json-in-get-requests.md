# @teapot-smashers/fetch/no-json-in-get-requests

> Disallow JSON body in GET requests as it violates HTTP semantics

HTTP GET requests should not contain a request body, especially JSON data. This violates HTTP semantics and can cause issues with proxies, caches, and servers that don't expect GET requests to have bodies.

❌ Examples of **incorrect** code for this rule:

```js
// GET request with JSON body
fetch('/api/data', {
  method: 'GET',
  body: JSON.stringify({ query: 'search term' }),
});

// Lowercase get method with JSON body
fetch('/api/data', {
  method: 'get',
  body: JSON.stringify({ filter: 'active' }),
});

// Default method (GET) with JSON body
fetch('/api/data', {
  body: JSON.stringify({ params: 'values' }),
});

// GET with JSON and headers
fetch('/api/search', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer token',
  },
  body: JSON.stringify({ q: 'search term' }),
});

// HEAD request with JSON (also inappropriate)
fetch('/api/data', {
  method: 'HEAD',
  body: JSON.stringify({ metadata: 'info' }),
});

// OPTIONS request with JSON (questionable)
fetch('/api/data', {
  method: 'OPTIONS',
  body: JSON.stringify({ config: 'value' }),
});
```

✅ Examples of **correct** code for this rule:

```js
// GET request without body
fetch('/api/data');
fetch('/api/data', { method: 'GET' });

// GET request with query parameters (proper way)
const params = new URLSearchParams({ query: 'search term' });
fetch(`/api/search?${params}`);

// POST request with JSON body (correct)
fetch('/api/data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'John', email: 'john@example.com' }),
});

// PUT request with JSON body
fetch('/api/data/123', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Updated Name' }),
});

// PATCH request with JSON body
fetch('/api/data/123', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: 'active' }),
});

// DELETE request with JSON body (sometimes valid for complex deletions)
fetch('/api/data', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ids: [1, 2, 3], reason: 'cleanup' }),
});

// GET request with non-JSON body (unusual but not flagged by this rule)
fetch('/api/data', {
  method: 'GET',
  body: 'raw text data',
});
```

## Why?

Sending JSON in GET requests causes several issues:

- **HTTP specification violation**: RFC 7231 states that GET requests should not have semantic meaning in the body
- **Proxy/cache issues**: Many proxies and caches ignore or strip bodies from GET requests
- **Server issues**: Some servers reject GET requests with bodies
- **Firewall issues**: Security tools may block GET requests with bodies as suspicious
- **Semantic confusion**: GET should be for retrieving data, not sending complex data

## Proper Alternatives

### 1. Use Query Parameters

Instead of JSON in body:

```js
// ❌ Don't do this
fetch('/api/search', {
  method: 'GET',
  body: JSON.stringify({ query: 'javascript', limit: 10, sort: 'date' }),
});

// ✅ Do this instead
const params = new URLSearchParams({
  query: 'javascript',
  limit: '10',
  sort: 'date',
});
fetch(`/api/search?${params}`);
```

### 2. Use POST for Complex Data

For complex search or filtering:

```js
// ❌ Don't do this
fetch('/api/search', {
  method: 'GET',
  body: JSON.stringify({
    filters: { category: 'tech', tags: ['js', 'web'] },
    sort: { field: 'date', order: 'desc' },
    pagination: { page: 1, size: 20 },
  }),
});

// ✅ Do this instead
fetch('/api/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    filters: { category: 'tech', tags: ['js', 'web'] },
    sort: { field: 'date', order: 'desc' },
    pagination: { page: 1, size: 20 },
  }),
});
```

### 3. Use Multiple API Endpoints

Break complex operations into simpler GET requests:

```js
// Instead of one complex GET with JSON
// ✅ Use multiple simple endpoints
const category = await fetch('/api/categories/tech').then((r) => r.json());
const posts = await fetch(`/api/posts?category=${category.id}&limit=10`).then(
  (r) => r.json()
);
```

## HTTP Methods and Bodies

| Method  | Should Have Body? | Use Case                          |
| ------- | ----------------- | --------------------------------- |
| GET     | ❌ No             | Retrieve data, use query params   |
| HEAD    | ❌ No             | Get headers only                  |
| OPTIONS | ❌ Usually No     | Get allowed methods/headers       |
| POST    | ✅ Yes            | Create resources, complex queries |
| PUT     | ✅ Yes            | Replace entire resource           |
| PATCH   | ✅ Yes            | Partial resource updates          |
| DELETE  | ⚠️ Sometimes      | Simple deletes (no), bulk (yes)   |

## When Not To Use It

- If you're working with APIs that specifically require JSON in GET requests (very rare)
- If you're building GraphQL endpoints that expect POST for all operations
- If your server framework explicitly supports and expects JSON in GET requests

## Migration Guide

1. **Identify violations**: Use this rule to find problematic code
2. **Convert to query parameters**: For simple data, use URLSearchParams
3. **Change method to POST**: For complex data, change the HTTP method
4. **Update API endpoints**: May require backend changes to accept POST instead of GET

## Options

This rule has no options.
