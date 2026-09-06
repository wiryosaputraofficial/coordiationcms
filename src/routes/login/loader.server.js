import { currentUser } from "../../server/security.js";
import { services } from "../../server/database.js";
export function load(request) {
  if (currentUser(request))
    return new Response(null, { status: 302, headers: { Location: "/admin" } });
  return {
    needsSetup: !services().db.prepare("SELECT id FROM profiles LIMIT 1").get(),
  };
}
