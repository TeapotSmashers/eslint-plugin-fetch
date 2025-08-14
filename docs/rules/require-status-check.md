# @teapot-smashers/fetch/require-status-check

> Require checking response.ok or response.status when using fetch

## Rule Details

The `fetch()` API does not throw errors for HTTP error status codes (like 404 or 500). You must manually check `response.ok` or `response.status` before using the response to handle errors properly.

❌ Examples of **incorrect** code for this rule:

```js
// No status check before using response
const response = await fetch('/api/data');
const data = await response.json(); // ❌ Could fail silently on 404, 500, etc.

// Using response methods without checking status
const response = await fetch('/api/data');
const text = await response.text(); // ❌ No error handling

// Multiple responses, some unchecked
const response1 = await fetch('/api/data1');
if (response1.ok) {
  // handle response1
}
const response2 = await fetch('/api/data2');
const data = await response2.json(); // ❌ No check for response2

// Promise chain without status check
const promise = fetch('/api/data').then((response) => {
  return response.json(); // ❌ No status check
});

// Assigned but never checked
const response = fetch('/api/data');
response.then((r) => r.json()); // ❌ No status check
```

✅ Examples of **correct** code for this rule:

```js
// Check response.ok before using
const response = await fetch('/api/data');
if (response.ok) {
  const data = await response.json();
}

// Check response.status
const response = await fetch('/api/data');
if (response.status === 200) {
  const data = await response.json();
}

// Direct await with status check
if ((await fetch('/api/data')).ok) {
  // handle success
}

// All responses checked
const response1 = await fetch('/api/data1');
if (response1.ok) {
  // handle response1
}
const response2 = await fetch('/api/data2');
if (response2.ok) {
  const data = await response2.json(); // ✅ Status checked
}

// Fire-and-forget requests (no assignment)
fetch('/api/log', { method: 'POST', body: logData });

// Non-fetch function calls (rule doesn't apply)
const response = await request('/api/data');
```

## Why?

Unlike other HTTP libraries, `fetch()` only rejects promises for network errors, not HTTP error status codes. This means:

- A `404 Not Found` response is considered "successful" by fetch
- A `500 Internal Server Error` won't throw an exception
- Your code might try to parse error HTML as JSON
- Silent failures can occur without proper error handling

## How to Fix

Always check the response status before using the response:

```js
// Option 1: Check response.ok
const response = await fetch('/api/data');
if (!response.ok) {
  throw new Error(`HTTP error! status: ${response.status}`);
}
const data = await response.json();

// Option 2: Check specific status codes
const response = await fetch('/api/data');
if (response.status === 200) {
  const data = await response.json();
} else {
  console.error('Request failed:', response.status);
}

// Option 3: Wrapper function
async function fetchJSON(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}
```

## When Not To Use It

If you have a custom fetch wrapper that handles status checking automatically, you can disable this rule for those files.

## Options

This rule has no options.
