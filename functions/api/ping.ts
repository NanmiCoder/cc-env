interface Env {}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const cf = (context.request as Request & { cf?: IncomingRequestCfProperties }).cf;
  return new Response(
    JSON.stringify({
      ok: true,
      colo: cf?.colo ?? 'LOCAL',
      ts: Date.now(),
    }),
    {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
};
