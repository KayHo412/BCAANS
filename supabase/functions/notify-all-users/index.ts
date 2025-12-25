import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Court {
  id: string;
  court_name: string;
  time_slot: string;
  date: string;
  location: string | null;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { courts }: { courts: Court[] } = await req.json();

    if (!courts || courts.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No courts to notify about" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Notifying users about ${courts.length} newly available courts`);

    // Get all users with notifications enabled
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .eq("notifications_enabled", true);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw profilesError;
    }

    if (!profiles || profiles.length === 0) {
      console.log("No users with notifications enabled");
      return new Response(
        JSON.stringify({ success: true, message: "No users to notify" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let notificationsSent = 0;
    const errors: string[] = [];

    for (const profile of profiles) {
      // Filter courts based on user preferences
      const relevantCourts = courts.filter((court) => {
        const preferredSlots = profile.preferred_time_slots || [];
        const preferredCourts = profile.preferred_courts || [];

        // If no preferences set, notify for all courts
        if (preferredSlots.length === 0 && preferredCourts.length === 0) {
          return true;
        }

        const matchesSlot = preferredSlots.length === 0 || preferredSlots.includes(court.time_slot);
        const matchesCourt = preferredCourts.length === 0 || preferredCourts.includes(court.court_name);

        return matchesSlot && matchesCourt;
      });

      if (relevantCourts.length === 0) {
        console.log(`No relevant courts for user ${profile.email}`);
        continue;
      }

      // Build email content for all relevant courts
      const courtsList = relevantCourts
        .map((c) => `• ${c.court_name} - ${c.time_slot} on ${c.date}`)
        .join("<br>");

      try {
        await resend.emails.send({
          from: "CourtWatch <onboarding@resend.dev>",
          to: [profile.email],
          subject: `🏸 ${relevantCourts.length} Court${relevantCourts.length > 1 ? 's' : ''} Now Available!`,
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
                <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                  <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 16px; padding: 32px; color: white; text-align: center; margin-bottom: 24px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">🏸</div>
                    <h1 style="margin: 0; font-size: 24px; font-weight: 700;">Courts Available!</h1>
                    <p style="margin: 8px 0 0 0; opacity: 0.8;">${relevantCourts.length} slot${relevantCourts.length > 1 ? 's' : ''} matching your preferences</p>
                  </div>
                  
                  <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                    <p style="color: #374151; font-size: 16px; margin: 0 0 24px 0;">
                      Hi ${profile.name || 'there'}! The following courts are now available:
                    </p>
                    
                    <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px; line-height: 1.8;">
                      ${courtsList}
                    </div>
                    
                    <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                      Book quickly before they're gone! 🏃‍♂️
                    </p>
                  </div>
                  
                  <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">
                    You're receiving this because you enabled court notifications on CourtWatch.
                  </p>
                </div>
              </body>
            </html>
          `,
        });

        // Log notifications
        for (const court of relevantCourts) {
          await supabase.from("notifications").insert({
            user_id: profile.user_id,
            court_id: court.id,
            time_slot: court.time_slot,
            date: court.date,
            status: "sent",
          });
        }

        notificationsSent++;
        console.log(`Notification sent to ${profile.email}`);
      } catch (emailError: any) {
        console.error(`Failed to send email to ${profile.email}:`, emailError);
        errors.push(`${profile.email}: ${emailError.message}`);
      }
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      action: "bulk_notification",
      details: `Sent ${notificationsSent} notifications for ${courts.length} courts`,
    });

    return new Response(
      JSON.stringify({
        success: true,
        notificationsSent,
        courtsCount: courts.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in notify-all-users function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
