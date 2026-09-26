---
type: "query"
date: "2026-09-23T23:34:50.418070+00:00"
question: "En el caso de builddata cual seria el costo de utilizar la api oficial de whatsapp y que tan dificil seria la migracion?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["client.ts", "message.handler.ts", "pollConfirmation.service.ts", "whatsapp-web.js", "api.service.ts"]
---

# Q: En el caso de builddata cual seria el costo de utilizar la api oficial de whatsapp y que tan dificil seria la migracion?

## Answer

Expanded from original query via vocab: [whatsapp, web, client, message, handler, poll, freetext, voice, image, api, session, command]. The graph shows client.ts initializes whatsapp-web.js, message.handler.ts routes input to text/audio/image handlers, pollConfirmation.service.ts sends textual confirmations, and the native poll is unused. Mongo session storage and whatsappPatch.service.ts are whatsapp-web.js-specific. The API, LLM, entity-resolution, vision and transcription business logic can mostly remain behind a new webhook and transport adapter.

## Outcome

- Signal: useful

## Source Nodes

- client.ts
- message.handler.ts
- pollConfirmation.service.ts
- whatsapp-web.js
- api.service.ts