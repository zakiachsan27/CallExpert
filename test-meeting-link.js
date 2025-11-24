// Test script for create-meeting-link function
// Get your anon key from: https://supabase.com/dashboard/project/xnnlpwaodduqqiffeyxw/settings/api
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "YOUR_ANON_KEY_HERE";

const testData = {
  bookingId: "test-booking-" + Date.now(),
  expertName: "Dr. John Doe",
  userName: "Jane Smith",
  userEmail: "janesmith@example.com",
  expertEmail: "johndoe@example.com",
  sessionType: "Konsultasi Karir",
  scheduledDate: "2025-12-01",
  scheduledTime: "14:00",
  duration: 60
};

const SUPABASE_URL = "https://xnnlpwaodduqqiffeyxw.supabase.co";
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/create-meeting-link`;

async function testCreateMeetingLink() {
  console.log("Testing create-meeting-link function...");
  console.log("Test data:", JSON.stringify(testData, null, 2));
  console.log("");

  const headers = {
    "Content-Type": "application/json",
  };

  if (SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== "YOUR_ANON_KEY_HERE") {
    headers["Authorization"] = `Bearer ${SUPABASE_ANON_KEY}`;
    headers["apikey"] = SUPABASE_ANON_KEY;
    console.log("Using authentication");
  } else {
    console.log("⚠️  No API key provided. Set SUPABASE_ANON_KEY environment variable or update the script.");
    console.log("Get your key from: https://supabase.com/dashboard/project/xnnlpwaodduqqiffeyxw/settings/api");
  }
  console.log("");

  try {
    const response = await fetch(FUNCTION_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(testData),
    });

    console.log("Response status:", response.status);
    console.log("");

    const result = await response.json();
    console.log("Response:", JSON.stringify(result, null, 2));

    if (result.success) {
      console.log("");
      console.log("✅ SUCCESS!");
      console.log("Meeting Link:", result.meetingLink);
      console.log("Event ID:", result.eventId);
      console.log("");
      console.log("Next steps:");
      console.log("1. Check Google Calendar for the event");
      console.log("2. Verify the Meet link works");
    } else {
      console.log("");
      console.log("❌ FAILED!");
      console.log("Error:", result.error);
    }
  } catch (error) {
    console.error("❌ ERROR:", error.message);
  }
}

testCreateMeetingLink();
