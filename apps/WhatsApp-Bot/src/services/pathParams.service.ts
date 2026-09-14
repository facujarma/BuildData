// Interpola los params de path (ej: :id) con valores ya resueltos del payload
// (ej: tarea_id) y los quita del body para que no viajen en el JSON.
export function interpolatePathParams(
  endpoint: string,
  payload: Record<string, unknown>,
): { path: string; body: Record<string, unknown> } {
  let path = endpoint;
  for (const token of endpoint.match(/:[a-z_]+/gi) ?? []) {
    const name = token.slice(1);
    const value =
      payload[name] ??
      payload[`${name}_id`] ??
      (name === "id" ? payload.tarea_id : undefined);
    if (typeof value === "string" && value) {
      path = path.replace(token, value);
    }
    delete payload[name];
    if (name === "id") delete payload.tarea_id;
  }
  return { path, body: payload };
}