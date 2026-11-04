# Threat model

Assets include provider session tokens, private manifest keys, request content and payment authorizations. The agent host, configured gateway and chosen provider are separate trust boundaries.

This client prevents automatic payment signing, rejects HTTP redirects and refuses non-TLS remote gateway URLs. It cannot guarantee provider honesty, response correctness, availability or refunds. A malicious agent host can access local files; run the kit with the minimum filesystem access required.

ML-DSA-65 signs service configurations only. It does not protect Solana signatures or conceal API traffic. Future payment automation requires user approval bound to recipient, network, asset, maximum amount and request, plus persistent deduplication and reconciliation.
