import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "https://esm.sh/web-push";

// Must match the VAPID public key used in push_notifications.js
const VAPID_PUBLIC_KEY = 'BCEV0qn2Z7G6Xlf32IDDY5m5atf1q1HHtB0RD-1FLcwnUnvMohN6dwwbfaQ1_73tvvdyxfFMphGlJf0-eogMtyo';
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") ?? '1vgIAoV_fvE2m5F_6l4_sAiZU23owEVnpCysX0YZQIc';
const VAPID_EMAIL = 'mailto:support@vivodistro.com';

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const payload = await req.json();
  const { type, table, record, action } = payload;

  console.log(`Action: ${action}, Table: ${table}`);

  // 1. Handle NEW INBOX ITEMS (Immediate Push)
  if ((table === 'inbox_items' && (type === 'INSERT' || action === 'INSERT')) || (record && record.type === 'chat')) {
    const userId = record.recipient_id;
    const senderId = record.sender_id;
    
    // Fetch sender's name
    let senderName = 'Someone';
    try {
      const { data } = await supabase.from('usernames').select('username').eq('user_id', senderId).single();
      if (data && data.username) senderName = data.username;
    } catch (e) { console.error('Error fetching name:', e); }

    let title = 'New Update';
    let body = record.message || 'Check your inbox for details.';

    if (record.type === 'chat') {
        title = `New Message from ${senderName}`;
    } else if (record.type === 'booking') {
        title = `New Booking from ${senderName}`;
        body = `Check your inbox for booking details.`;
    } else if (record.type === 'profile') {
        title = `Profile Shared by ${senderName}`;
        body = `View their profile in your inbox.`;
    }

    console.log(`🚀 Sending Push to User ${userId}: ${title}`);
    await sendPush(supabase, userId, title, body, 'inbox.html');
  }

  // 2. Handle SCHEDULED REMINDERS (Triggered by Cron every 15m)
  if (action === 'check-reminders') {
    console.log("🕒 Running Scheduled Reminder Check...");
    await checkCalendarReminders(supabase);
  }

  return new Response(JSON.stringify({ status: "ok" }), { headers: { "Content-Type": "application/json" } });
});

async function checkCalendarReminders(supabase) {
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 65 * 60 * 1000); // 1h buffer
  const twentyFourHoursLater = new Date(now.getTime() + 24.5 * 60 * 60 * 1000); // 24h buffer

  // Check 1h reminders (event_date and event_time combined)
  // This logic should be expanded in production to merge DATE and TIME fields
  const { data: upcomingEvents, error } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('notified_1h', false);

  if (upcomingEvents) {
    for (const event of upcomingEvents) {
      const eventDateTime = new Date(`${event.event_date}T${event.event_time}`);
      const diffMs = eventDateTime - now;
      const diffHrs = diffMs / (1000 * 60 * 60);

      if (diffHrs > 0 && diffHrs <= 1.1) {
        await sendPush(supabase, event.user_id, 'Event Starting Soon!', `"${event.title}" begins in less than an hour!`, 'calendar.html');
        await supabase.from('calendar_events').update({ notified_1h: true }).eq('id', event.id);
      } else if (diffHrs > 23 && diffHrs <= 25 && !event.notified_24h) {
        await sendPush(supabase, event.user_id, 'Event Tomorrow!', `"${event.title}" is happening in 24 hours!`, 'calendar.html');
        await supabase.from('calendar_events').update({ notified_24h: true }).eq('id', event.id);
      }
    }
  }
}

async function sendPush(supabase, userId, title, body, url) {
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('subscription')
    .eq('user_id', userId);

  if (!subs || subs.length === 0) {
    console.warn(`⚠️ No push subscriptions found for user: ${userId}`);
    return;
  }

  for (const row of subs) {
    try {
      await webpush.sendNotification(
        row.subscription,
        JSON.stringify({ title, body, url: url || 'inbox.html' })
      );
      console.log(`✅ Push delivered to subscription for user ${userId}`);
    } catch (e) {
      console.error("❌ Push Delivery Error:", e);
      // Clean up stale subscription
      if (e.statusCode === 410 || e.statusCode === 404) {
        await supabase.from('push_subscriptions').delete().eq('subscription', row.subscription);
      }
    }
  }
}
