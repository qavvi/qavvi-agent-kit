# Examples

Run from the repository root after `npm ci`:

```sh
node examples/01-discover/index.mjs research
node examples/02-review-quote/index.mjs SERVICE_ID
```

These examples only read discovery and quotes; they never execute a provider call or move funds.

## Reviewed execution

`node examples/03-reviewed-call/index.mjs` validates a Scope GitHub research request and shows its quote. It calls the service only after you type `yes`. It never pays automatically.
