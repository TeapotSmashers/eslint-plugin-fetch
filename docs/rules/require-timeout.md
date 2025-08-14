# @teapot-smashers/fetch/require-timeout

> Require timeout configuration for fetch requests to prevent hanging

The native `fetch()` API has no built-in timeout mechanism. Without proper timeout handling, fetch requests can hang indefinitely, leading to poor user experience and potential memory leaks.

❌ Examples of **incorrect** code for this rule:

```js
// Basic fetch without timeout
fetch('/api/data');

// fetch with options but no timeout
fetch('/api/data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});

// async/await without timeout
async function getData() {
  const response = await fetch('/api/data');
  return response.json();
}

// Promise chain without timeout
fetch('/api/data')
  .then((response) => response.json())
  .then((data) => console.log(data));
```

✅ Examples of **correct** code for this rule:

```js
// AbortController with timeout
async function getData() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch('/api/data', { signal: controller.signal });
    clearTimeout(timeoutId);
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// AbortSignal.timeout (modern browsers)
fetch('/api/data', { signal: AbortSignal.timeout(5000) });

// Promise.race with timeout
Promise.race([
  fetch('/api/data'),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), 5000)
  ),
]);

// Custom timeout wrapper
function fetchWithTimeout(url, options, timeout = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(id)
  );
}
```

## Why?

Without timeout handling:

- **Hanging requests**: Network issues can cause requests to hang indefinitely
- **Poor user experience**: Users may wait forever for responses
- **Memory leaks**: Unresolved promises can accumulate in memory
- **Resource exhaustion**: Too many hanging connections can exhaust browser/server resources

## Recommended Approaches

1. **AbortController with setTimeout** (most compatible):

   ```js
   const controller = new AbortController();
   setTimeout(() => controller.abort(), 5000);
   fetch(url, { signal: controller.signal });
   ```

2. **AbortSignal.timeout()** (modern browsers):

   ```js
   fetch(url, { signal: AbortSignal.timeout(5000) });
   ```

3. **Promise.race with timeout**:
   ```js
   Promise.race([
     fetch(url),
     new Promise((_, reject) =>
       setTimeout(() => reject(new Error('Timeout')), 5000)
     ),
   ]);
   ```

## When Not To Use It

- If you have a custom fetch wrapper that handles timeouts automatically
- For fire-and-forget requests where hanging is acceptable (like logging)

## Options

This rule has no options.
