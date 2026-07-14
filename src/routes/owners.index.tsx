import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client.server';

const getOwners = createServerFn({ method: 'GET' })
  .handler(async () => {
    const { data: owners } = await supabase
      .from('home_owners')
      .select('*')
      .eq('verification_status', 'verified')
      .order('overall_rating', { ascending: false })
      .limit(24);

    return { owners: owners ?? [] };
  });

export const Route = createFileRoute('/owners/')({
  component: RouteComponent,
  loader: async () => {
    const { owners } = await getOwners();
    return { owners };
  },
});

function RouteComponent() {
  const { owners } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold text-gray-900">Property Owners</h1>
          <p className="text-lg text-gray-600 mt-2">
            Browse verified homeowners and their listings
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {owners.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No owners found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {owners.map((owner: any) => (
              <a
                key={owner.id}
                href={`/owners/${owner.slug}`}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={owner.photo || '/placeholder-owner.jpg'}
                    alt={owner.full_name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{owner.full_name}</h3>
                    <p className="text-sm text-gray-500">
                      {owner.properties_listed || 0} properties
                    </p>
                    {owner.overall_rating && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-yellow-500">★</span>
                        <span className="text-sm font-medium">{owner.overall_rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
</parameter>
<task_progress>
- [x] Step 1: Analyze existing codebase
- [x] Step 2: Create combined single migration file
- [x] Step 3: Create marketplace server functions
- [x] Step 4: Create marketplace frontend components
- [x] Step 5: Create owner profile page route
- [x] Step 6: Fix migration conflicts with existing V2 schema
- [x] Step 7: Fix migration CHECK constraint syntax
- [x] Step 8: Fix agents/properties schema for backward compatibility
- [x] Step 9: Fix seed.sql VALUES list mismatch by using UNION ALL inserts
- [x] Step 10: Remove stray XML tag from seed.sql
- [x] Step 11: Final verification
- [x] Step 12: Regenerate Supabase types
- [x] Step 13: Create public agent profile route
- [x] Step 14: Create public owners index route
- [ ] Step 15: Add analytics tracking to property pages
- [ ] Step 16: Update route tree registration
</parameter>
</write_to_file>