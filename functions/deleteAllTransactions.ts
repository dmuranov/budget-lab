import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    let user;
    try {
      user = await base44.auth.me();
    } catch (authErr) {
      return Response.json({ error: 'Auth failed: ' + (authErr.message || 'unknown') }, { status: 401 });
    }

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required. Role: ' + (user?.role || 'none') }, { status: 403 });
    }

    let deleted = 0;
    let maxIterations = 200;
    
    while (maxIterations > 0) {
      maxIterations--;
      
      let batch;
      try {
        batch = await base44.asServiceRole.entities.Transaction.list('date', 100);
      } catch (listError) {
        return Response.json({ 
          error: 'List failed: ' + (listError.message || JSON.stringify(listError)),
          deleted_so_far: deleted
        }, { status: 500 });
      }
      
      if (!batch || batch.length === 0) break;
      
      const results = await Promise.allSettled(
        batch.map(t => base44.asServiceRole.entities.Transaction.delete(t.id))
      );
      
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      deleted += successCount;
      
      if (successCount === 0) {
        const firstError = results.find(r => r.status === 'rejected');
        return Response.json({ 
          error: 'Delete failed: ' + (firstError?.reason?.message || 'unknown'),
          deleted_so_far: deleted
        }, { status: 500 });
      }
      
      if (batch.length < 100) break;
    }

    return Response.json({ 
      message: `Se eliminaron ${deleted} transacciones correctamente.`,
      deleted
    });
  } catch (error) {
    return Response.json({ 
      error: 'Unexpected: ' + (error.message || JSON.stringify(error)) 
    }, { status: 500 });
  }
});