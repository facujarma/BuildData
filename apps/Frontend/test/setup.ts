// Setup global de `bun test` para el frontend.
//
// happy-dom tiene que existir antes de que cualquier archivo evalúe
// `@testing-library/react` (su `screen` captura `document` al importarse) y
// antes de que React DOM programe trabajo. Registrarlo una vez por proceso
// evita que el `unregister()` de un archivo deje sin DOM al siguiente.
import { GlobalRegistrator } from "@happy-dom/global-registrator";

if (typeof document === "undefined") {
  GlobalRegistrator.register();
}
