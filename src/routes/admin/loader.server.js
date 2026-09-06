import { currentUser } from "../../server/security.js";
export function load(request) {
  const user = currentUser(request);
  return user
    ? { user }
    : new Response(null, { status: 302, headers: { Location: "/login" } });
}
