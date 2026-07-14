import { createFileRoute, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client.server';
import { VerificationBadge } from '@/components/marketplace/VerificationBadge';

const getAgentBySlug = createServerFn({ method: 'GET' })
  .validator((data: unknown) => z.object({ slug: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { data: agent, error } = await supabase
      .from('agents')
      .select(`
        *,
        agent_social_accounts (*),
        agent_areas (*),
        agent_documents (*)
      `)
      .eq('slug', data.slug)
      .eq('active', true)
      .maybeSingle();

    if (error || !agent) return null;

    const { data: listings } = await supabase
      .from('properties')
      .select('*')
      .eq('agent_id', agent.id)
      .in('property_status', ['published', 'featured'])
      .order('created_at', { ascending: false })
      .limit(12);

    const { data: reviews } = await supabase
      .from('marketplace_reviews')
      .select('*')
      .eq('entity_type', 'agent')
      .eq('entity_id', agent.id)
      .eq('is_verified', true)
      .order('created_at', { ascending: false })
      .limit(10);

    return { ...agent, listings: listings ?? [], reviews: reviews ?? [] };
  });

export const Route = createFileRoute('/agents/$slug')({
  component: RouteComponent,
  loader: async ({ params }) => {
    const agent = await getAgentBySlug({ data: { slug: params.slug } });
    if (!agent) throw redirect({ to: '/agents' });
    return { agent };
  },
});

function RouteComponent() {
  const { agent } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start gap-6">
            <img
              src={agent.photo || '/placeholder-agent.jpg'}
              alt={agent.full_name}
              className="w-24 h-24 rounded-full object-cover"
            />
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">{agent.full_name}</h1>
                <VerificationBadge level={agent.verification_level} />
              </div>
              <p className="text-lg text-gray-600 mt-1">{agent.position}</p>
              <p className="text-gray-500 mt-1">{agent.agency_name}</p>
              <div className="flex items-center gap-6 mt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{agent.overall_rating?.toFixed(1) || '0.0'}</div>
                  <div className="text-sm text-gray-500">Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{agent.total_reviews || 0}</div>
                  <div className="text-sm text-gray-500">Reviews</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{agent.deals_closed || 0}</div>
                  <div className="text-sm text-gray-500">Deals Closed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{agent.response_rate?.toFixed(0) || '0'}%</div>
                  <div className="text-sm text-gray-500">Response Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">About</h2>
              <p className="text-gray-700 whitespace-pre-line">{agent.bio}</p>
              {agent.specializations && agent.specializations.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Specializations</h3>
                  <div className="flex flex-wrap gap-2">
                    {agent.specializations.map((spec: string) => (
                      <span key={spec} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {agent.listings && agent.listings.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-4">Listings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {agent.listings.map((listing: any) => (
                    <a
                      key={listing.id}
                      href={`/properties/${listing.slug}`}
                      className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition"
                    >
                      <div className="aspect-video bg-gray-200 relative">
                        {listing.images && listing.images[0] && (
                          <img
                            src={listing.images[0].image_url}
                            alt={listing.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-lg">{listing.title}</h3>
                        <p className="text-gray-600">{listing.address}</p>
                        <p className="text-blue-600 font-bold mt-2">
                          KES {listing.price.toLocaleString()}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="space-y-6">
            <section className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
              <div className="space-y-3">
                <a href={`tel:${agent.phone}`} className="flex items-center gap-3 text-gray-700 hover:text-blue-600">
                  <span>📞</span>
                  <span>{agent.phone}</span>
                </a>
                <a href={`https://wa.me/${agent.whatsapp?.replace(/[^0-9]/g, '')}`} className="flex items-center gap-3 text-gray-700 hover:text-green-600">
                  <span>💬</span>
                  <span>WhatsApp</span>
                </a>
                <a href={`mailto:${agent.email}`} className="flex items-center gap-3 text-gray-700 hover:text-blue-600">
                  <span>✉️</span>
                  <span>{agent.email}</span>
                </a>
              </div>
            </section>

            {agent.agent_social_accounts && agent.agent_social_accounts.length > 0 && (
              <section className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Social Media</h3>
                <div className="space-y-2">
                  {agent.agent_social_accounts.map((account: any) => (
                    <a
                      key={account.id}
                      href={account.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-gray-700 hover:text-blue-600"
                    >
                      <span className="capitalize">{account.platform}</span>
                    </a>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}