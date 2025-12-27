import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.22.4";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const NotificationRequestSchema = z.object({
  userId: z.string().uuid({ message: "Invalid userId format" }),
  courtId: z.string().uuid({ message: "Invalid courtId format" }),
  courtName: z.string().min(1).max(100, { message: "Court name must be 1-100 characters" }),
  timeSlot: z.string().min(1).max(50, { message: "Time slot must be 1-50 characters" }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Date must be in YYYY-MM-DD format" }),
  location: z.string().max(200).optional(),
});

// HTML escape function to prevent XSS in email templates
function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char] || char);
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authentication check
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      console.log("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.log("Invalid token:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Authenticated user: ${user.id}`);

    // Parse and validate request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parseResult = NotificationRequestSchema.safeParse(requestBody);
    if (!parseResult.success) {
      console.log("Validation error:", parseResult.error.errors);
      return new Response(
        JSON.stringify({ error: "Invalid request data", details: parseResult.error.errors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { userId, courtId, courtName, timeSlot, date, location } = parseResult.data;

    // Authorization: user can only trigger notifications for themselves, or admin can trigger for anyone
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    
    if (userId !== user.id && !isAdmin) {
      console.log(`User ${user.id} attempted to send notification to ${userId} without admin role`);
      return new Response(
        JSON.stringify({ error: "Forbidden: Cannot send notifications for other users" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing notification for user ${userId}, court ${courtName}`);

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (profileError || !profile) {
      console.error("Error fetching profile:", profileError);
      return new Response(
        JSON.stringify({ error: "User profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!profile.notifications_enabled) {
      console.log("Notifications disabled for user");
      return new Response(
        JSON.stringify({ success: true, message: "Notifications disabled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Escape user-controlled data for HTML email
    const safeCourtName = escapeHtml(courtName);
    const safeTimeSlot = escapeHtml(timeSlot);
    const safeDate = escapeHtml(date);
    const safeLocation = location ? escapeHtml(location) : null;
    const safeName = profile.name ? escapeHtml(profile.name) : "there";

    // Send email notification
    const emailResponse = await resend.emails.send({
      from: "CourtWatch <onboarding@resend.dev>",
      to: [profile.email],
      subject: `🏸 Court Available: ${safeCourtName} - ${safeTimeSlot}`,
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
                <h1 style="margin: 0; font-size: 24px; font-weight: 700;">Court Available!</h1>
              </div>
              
              <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                <p style="color: #374151; font-size: 16px; margin: 0 0 24px 0;">
                  Hi ${safeName}! Great news - a court matching your preferences is now available:
                </p>
                
                <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Court</td>
                      <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${safeCourtName}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Time Slot</td>
                      <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${safeTimeSlot}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Date</td>
                      <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${safeDate}</td>
                    </tr>
                    ${safeLocation ? `
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Location</td>
                      <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${safeLocation}</td>
                    </tr>
                    ` : ''}
                  </table>
                </div>
                
                <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                  Book quickly before someone else does! 🏃‍♂️
                </p>
              </div>
              
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">
                You're receiving this because you enabled court notifications on CourtWatch.<br>
                <a href="#" style="color: #6b7280;">Manage preferences</a>
              </p>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    // Log notification in database
    const { error: notifError } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        court_id: courtId,
        time_slot: timeSlot,
        date: date,
        status: "sent",
      });

    if (notifError) {
      console.error("Error logging notification:", notifError);
    }

    // Log activity
    await supabase
      .from("activity_logs")
      .insert({
        action: "notification_sent",
        details: `Email sent to ${profile.email} for ${safeCourtName} at ${safeTimeSlot}`,
      });

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
