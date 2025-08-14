# @teapot-smashers/fetch/require-json-content-type

> Require Content-Type header when sending JSON data with fetch

## Rule Details

When sending JSON data using `fetch()` with `JSON.stringify()` in the body, you must include the appropriate `Content-Type: application/json` header. Without this header, servers may not properly parse the request body.

❌ Examples of **incorrect** code for this rule:

```js
// Missing headers entirely
fetch('/api/data', {
  method: 'POST',
  body: JSON.stringify(data),
});

// Missing Content-Type header
fetch('/api/data', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer token',
  },
  body: JSON.stringify(data),
});

// Wrong Content-Type header
fetch('/api/data', {
  method: 'POST',
  headers: {
    'Content-Type': 'text/plain',
  },
  body: JSON.stringify(data),
});
```

✅ Examples of **correct** code for this rule:

```js
// Correct Content-Type header
fetch('/api/data', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data),
});

// Not using JSON.stringify (rule doesn't apply)
fetch('/api/data', {
  method: 'POST',
  body: 'plain text data',
});

// No body (rule doesn't apply)
fetch('/api/data', {
  method: 'GET',
});
```

## Why?

Without the proper `Content-Type` header, servers may:

- Not parse the JSON correctly
- Return 400 Bad Request errors
- Treat the body as plain text instead of JSON

## When Not To Use It

This rule assumes you're sending data to servers that require the `Content-Type` header. If you're working with servers that don't require this header, you can disable this rule.

## Options

This rule has no options.
