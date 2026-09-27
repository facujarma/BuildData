import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export type DocumentType = 'comprobante' | 'factura' | 'desconocido'

export interface ExtractedDocument {
  type: DocumentType
  data: ComprobanteData | FacturaData | null
  rawText: string
}

export interface ComprobanteData {
  tipo: string           // transferencia, depósito, pago de servicio, etc.
  fecha: string
  monto: string
  moneda: string
  origen: string         // nombre o CBU del que envía
  destino: string        // nombre o CBU del que recibe
  numeroOperacion: string
  entidad: string        // banco o billetera (Mercado Pago, Brubank, etc.)
}

export interface FacturaData {
  tipoFactura: string    // A, B, C
  numero: string         // 0001-00012345
  fecha: string
  fechaVencimiento: string
  emisor: string
  cuitEmisor: string
  receptor: string
  cuitReceptor: string
  items: FacturaItem[]
  subtotal: string
  iva: string
  total: string
}

export interface FacturaItem {
  descripcion: string
  cantidad: string
  precioUnitario: string
  subtotal: string
}

const SYSTEM_PROMPT = `
Sos un asistente especializado en analizar documentos financieros argentinos.
Tu tarea es identificar el tipo de documento y extraer su información importante.

Tipos de documentos que reconocés:
- "comprobante": comprobante de transferencia, pago, depósito de cualquier banco o billetera digital (Mercado Pago, Ualá, Brubank, Naranja X, etc.)
- "factura": factura electrónica tipo A, B o C emitida en Argentina
- "desconocido": si no podés identificar el documento

Respondé ÚNICAMENTE con un JSON válido con esta estructura según el tipo:

Para comprobante:
{
  "type": "comprobante",
  "data": {
    "tipo": "",
    "fecha": "",
    "monto": "",
    "moneda": "",
    "origen": "",
    "destino": "",
    "numeroOperacion": "",
    "entidad": ""
  }
}

Para factura:
{
  "type": "factura",
  "data": {
    "tipoFactura": "",
    "numero": "",
    "fecha": "",
    "fechaVencimiento": "",
    "emisor": "",
    "cuitEmisor": "",
    "receptor": "",
    "cuitReceptor": "",
    "items": [
      {
        "descripcion": "",
        "cantidad": "",
        "precioUnitario": "",
        "subtotal": ""
      }
    ],
    "subtotal": "",
    "iva": "",
    "total": ""
  }
}

Para desconocido:
{
  "type": "desconocido",
  "data": null
}

Reglas:
- Si un campo no está visible en la imagen, usá "" (string vacío), nunca null
- Los montos siempre en formato string con el símbolo: "$1.234,56"
- Las fechas en formato DD/MM/YYYY
- No agregues explicaciones, solo el JSON
`

export async function analyzeDocument(
  base64Image: string,
  mimetype: string
): Promise<ExtractedDocument> {

  const response = await groq.chat.completions.create({
    model: 'qwen/qwen3.8-27b',
    temperature: 0,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimetype};base64,${base64Image}`
            }
          },
          {
            type: 'text',
            text: SYSTEM_PROMPT
          }
        ]
      }
    ]
  })

  const rawText = response.choices[0].message.content?.trim() ?? ''

  try {
    const clean = rawText.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean) as ExtractedDocument
    return { ...parsed, rawText }
  } catch {
    return { type: 'desconocido', data: null, rawText }
  }
}