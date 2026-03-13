import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    let deleted = 0;
    let page = 0;
    while (true) {
      const batch = await base44.asServiceRole.entities.Transaction.list('created_date', 100);
      if (!batch || batch.length === 0) break;
      await Promise.all(batch.map(t => base44.asServiceRole.entities.Transaction.delete(t.id)));
      deleted += batch.length;
      if (batch.length < 100) break;
    }

    return Response.json({ message: `Se eliminaron ${deleted} transacciones correctamente.` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});