import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "https://esm.sh/web-push@3.6.7?target=deno";

// CORS headers - CRITICAL for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get JWT from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }
    
    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client with the user's JWT for verification
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
      }
    );

    // Verify the user - THIS IS KEY
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid JWT', details: userError?.message }),
        { 
          status: 401, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      );
    }

    console.log('✅ Authenticated user:', user.email);

    const { userId, notification } = await req.json();

    // Create admin client for database operations
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Store notification
    const { data: storedNotification, error: dbError } = await adminClient
      .from('notifications')
      .insert({
        user_id: userId,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // Get push subscriptions
    const { data: subscriptions, error: subError } = await adminClient
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', userId);

    if (subError) throw subError;

    console.log(`Found ${subscriptions?.length || 0} subscriptions`);

    // Send push notifications
    if (subscriptions && subscriptions.length > 0) {
      const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') || '';
      const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') || '';
      
      webpush.setVapidDetails(
        'mailto:notifications@vivodistro.co.za',
        VAPID_PUBLIC_KEY,
        VAPID_PRIVATE_KEY
      );

      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(
            sub.subscription,
            JSON.stringify({
              title: notification.title,
              body: notification.body,
              icon: '/icon-192.png',
              badge: '/icon-192.png',
              data: notification.data,
              vibrate: [200, 100, 200],
              requireInteraction: true
            })
          );
          console.log('✅ Push sent');
        } catch (e) {
          console.error('❌ Push failed:', e);
          if (e.statusCode === 410) {
            await adminClient
              .from('push_subscriptions')
              .delete()
              .eq('subscription', sub.subscription);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        notification: storedNotification,
        subscriptionsSent: subscriptions?.length || 0 
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );

  } catch (error) {
    console.error('❌ Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );
  }
});