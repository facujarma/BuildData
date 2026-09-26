---
type: "query"
date: "2026-09-23T23:41:15.320861+00:00"
question: "me gustaria reemplazar las encuestas numeradas con webhooks, osea con esas botonersa que tienen alguno bots de wpp. Es factible?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["pollConfirmation.service.ts", "sendObraConfirmationText()", "sendEntityQuestion()", "handleObraTextReply()", "handleEntityTextReply()", "pendingQuery.store.ts"]
---

# Q: me gustaria reemplazar las encuestas numeradas con webhooks, osea con esas botonersa que tienen alguno bots de wpp. Es factible?

## Answer

Expanded from original query via vocab: [whatsapp, poll, message, handler, api]. In BuildData, pollConfirmation.service.ts contains sendObraConfirmationText, sendEntityQuestion, handleObraTextReply and handleEntityTextReply. The numbered prompts can be replaced by Cloud API interactive buttons or lists, with button_reply/list_reply webhook IDs routed through pending state. The native sendObraPoll flow is unused. Keep numeric/free-text fallback for cases outside interactive limits or for users who type instead of tapping.

## Outcome

- Signal: useful

## Source Nodes

- pollConfirmation.service.ts
- sendObraConfirmationText()
- sendEntityQuestion()
- handleObraTextReply()
- handleEntityTextReply()
- pendingQuery.store.ts