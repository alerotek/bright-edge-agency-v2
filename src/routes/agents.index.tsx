import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { supabase } from '@/integrations/supabase/client.server';

const getAgents = createServerFn({ method: 'GET' })
  .handler(async () => {
    const { data: agents } = await supabase
      .from('agents')
      .select('id, full_name, slug, position, agency_name, photo, overall_rating, total_reviews, verification_level')
      .eq('active', true)
      .order('overall_rating', { ascending: false })
      .limit(24);

    return { agents: agents ?? [] };
  });

export const Route = createFileRoute('/agents/')({
  component: RouteComponent,
  loader: async () => {
    const { agents } = await getAgents();
    return { agents };
  },
});

function RouteComponent() {
  const { agents } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold text-gray-900">Our Agents</h1>
          <p className="text-lg text-gray-600 mt-2">
            Meet our team of verified real estate professionals
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {agents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No agents found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent: any) => (
              <a
                key={agent.id}
                href={`/agents/${agent.slug}`}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={agent.photo || '/placeholder-agent.jpg'}
                    alt={agent.full_name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{agent.full_name}</h3>
                    <p className="text-sm text-gray-500">{agent.position}</p>
                    <p className="text-sm text-gray-400">{agent.agency_name}</p>
                    {agent.overall_rating && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-yellow-500">★</span>
                        <span className="text-sm font-medium">{agent.overall_rating.toFixed(1)}</span>
                        <span className="text-sm text-gray-500">({agent.total_reviews || 0} reviews)</span>
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