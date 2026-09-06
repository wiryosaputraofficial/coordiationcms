export function GET() {
  return Response.json({
    ok: true,
    application: "coordiation-cms",
    version: "0.1.0",
  });
}
