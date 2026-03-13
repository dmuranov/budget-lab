import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    let deleted = 0;
    let maxIterations = 100;

    while (maxIterations > 0) {
      maxIterations--;

      let batch;
      try {
        batch = await base44.asServiceRole.entities.Transaction.list('created_date', 100);
      } catch (listError) {
        break;
      }

      if (!batch || batch.length === 0) break;

      const results = await Promise.allSettled(
        batch.map(t => base44.asServiceRole.entities.Transaction.delete(t.id))
      );

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failCount = results.filter(r => r.status === 'rejected').length;

      deleted += successCount;

      if (failCount === batch.length) {
        return Response.json({
          error: `Se eliminaron ${deleted} transacciones pero ${failCount} fallaron. Posible problema de permisos.`
        }, { status: 500 });
      }

      if (batch.length < 100) break;
    }

    return Response.json({
      message: `Se eliminaron ${deleted} transacciones correctamente.`,
      deleted: deleted
    });
  } catch (error) {
    return Response.json({ error: error.message || 'Error desconocido' }, { status: 500 });
  }
});