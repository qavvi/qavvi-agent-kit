# Access and pricing

Discovery and quotes do not require a local wallet. Providers determine service prices. Read the quote and the actual x402 challenge before authorizing payment; quotes can change.

This version does not automatically sign or submit payments. A payment-capable client can authorize a payment separately, and the CLI accepts an existing payload through `--payment-file`. Treat that file as sensitive and do not commit it.

Network-fee sponsorship depends on the gateway, supported network and available treasury budget. The kit makes no blanket promise of free transactions or discounted provider prices.

Provider administration uses `QAVVI_ACCESS_TOKEN` from the Qavvi dashboard. Keep it in your environment, never in source or agent prompts.
