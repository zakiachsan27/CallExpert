// Create Meeting Edge Function
// Triggered after successful payment to create Google Calendar event with Meet link

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleCalendarService, createDateTimeISO } from "../_shared/google-calendar.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { booking_id } = await req.json();

    if (!booking_id) {
      return new Response(
        JSON.stringify({ error: "booking_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Google Calendar credentials from secrets
    const googleCredentials = {
      client_email: Deno.env.get("GOOGLE_CLIENT_EMAIL")!,
      private_key: Deno.env.get("GOOGLE_PRIVATE_KEY")!.replace(/\\n/g, "\n"),
      project_id: Deno.env.get("GOOGLE_PROJECT_ID")!,
    };

    // Fetch booking with expert and user data
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(`
        id,
        order_id,
        booking_date,
        booking_time,
        topic,
        notes,
        session_type,
        expert_id,
        user_id,
        meeting_link,
        calendar_event_id
      `)
      .eq("id", booking_id)
      .single();

    if (bookingError || !booking) {
      console.error("Booking not found:", bookingError);
      return new Response(
        JSON.stringify({ error: "Booking not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if meeting already created
    if (booking.meeting_link) {
      return new Response(
        JSON.stringify({ 
          message: "Meeting already exists",
          meeting_link: booking.meeting_link 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get expert data
    const { data: expert, error: expertError } = await supabase
      .from("experts")
      .select("id, name, email")
      .eq("id", booking.expert_id)
      .single();

    if (expertError || !expert) {
      console.error("Expert not found:", expertError);
      return new Response(
        JSON.stringify({ error: "Expert not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user data
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("id", booking.user_id)
      .single();

    if (userError || !user) {
      console.error("User not found:", userError);
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get session duration
    const duration = booking.session_type?.duration || 60;

    // Create date/time for calendar event
    const { start, end } = createDateTimeISO(
      booking.booking_date,
      booking.booking_time,
      duration
    );

    // Initialize Google Calendar service
    const calendarService = new GoogleCalendarService(googleCredentials);

    // Create calendar event with Google Meet
    const eventResult = await calendarService.createEventWithMeet({
      summary: `MentorinAja: ${booking.topic || "Konsultasi"}`,
      description: `Sesi konsultasi MentorinAja

Mentor: ${expert.name}
Mentee: ${user.name}

Topik: ${booking.topic || "-"}
Catatan: ${booking.notes || "-"}

Order ID: ${booking.order_id}

---
Powered by MentorinAja
https://mentorinaja.com`,
      startDateTime: start,
      endDateTime: end,
      attendees: [
        { email: expert.email, displayName: expert.name },
        { email: user.email, displayName: user.name },
      ],
      timeZone: "Asia/Jakarta",
    });

    console.log("Calendar event created:", eventResult);

    // Update booking with meeting link
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        meeting_link: eventResult.meetLink,
        calendar_event_id: eventResult.eventId,
      })
      .eq("id", booking_id);

    if (updateError) {
      console.error("Failed to update booking:", updateError);
      // Don't fail - meeting was created, just log error
    }

    return new Response(
      JSON.stringify({
        success: true,
        meeting_link: eventResult.meetLink,
        calendar_link: eventResult.htmlLink,
        event_id: eventResult.eventId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error creating meeting:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to create meeting" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
