// Google Calendar API Helper
// Uses Service Account for authentication with manual JWT signing

import { encode as base64UrlEncode } from "https://deno.land/std@0.168.0/encoding/base64url.ts";
import { decode as base64Decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

interface CalendarEvent {
  summary: string;
  description: string;
  startDateTime: string; // ISO format
  endDateTime: string;   // ISO format
  attendees: { email: string; displayName?: string }[];
  timeZone?: string;
}

interface GoogleCredentials {
  client_email: string;
  private_key: string;
  project_id: string;
}

// Convert PEM private key to CryptoKey
async function importPrivateKey(pem: string): Promise<CryptoKey> {
  // Handle escaped newlines from environment variables
  let normalizedPem = pem;
  
  // Replace literal \n with actual newlines
  if (pem.includes("\\n")) {
    normalizedPem = pem.replace(/\\n/g, "\n");
  }
  
  // Remove PEM headers and all whitespace
  const pemContents = normalizedPem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/[\r\n\s]/g, "");
  
  console.log("PEM contents length:", pemContents.length);
  console.log("PEM first 20 chars:", pemContents.substring(0, 20));
  
  // Decode base64 using Deno's standard library
  const binaryKey = base64Decode(pemContents);
  
  return await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );
}

// Create signed JWT for Google API
async function createSignedJWT(credentials: GoogleCredentials): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600; // 1 hour

  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const payload = {
    iss: credentials.client_email,
    scope: "https://www.googleapis.com/auth/calendar",
    aud: "https://oauth2.googleapis.com/token",
    exp: expiry,
    iat: now,
  };

  const encodedHeader = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const encodedPayload = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const privateKey = await importPrivateKey(credentials.private_key);
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    new TextEncoder().encode(signatureInput)
  );

  const encodedSignature = base64UrlEncode(new Uint8Array(signature));
  return `${signatureInput}.${encodedSignature}`;
}

// Exchange JWT for access token
async function getAccessToken(credentials: GoogleCredentials): Promise<string> {
  const jwt = await createSignedJWT(credentials);

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

export class GoogleCalendarService {
  private credentials: GoogleCredentials;

  constructor(credentials: GoogleCredentials) {
    this.credentials = credentials;
  }

  async createEventWithMeet(event: CalendarEvent): Promise<{
    eventId: string;
    meetLink: string;
    htmlLink: string;
  }> {
    const accessToken = await getAccessToken(this.credentials);
    const timeZone = event.timeZone || "Asia/Jakarta";

    // Note: Service accounts cannot invite attendees without Domain-Wide Delegation
    // So we create the event without attendees and just get the Meet link
    const requestBody = {
      summary: event.summary,
      description: event.description,
      start: {
        dateTime: event.startDateTime,
        timeZone: timeZone,
      },
      end: {
        dateTime: event.endDateTime,
        timeZone: timeZone,
      },
      // Attendees removed - Service Account limitation
      // attendees: event.attendees.map(a => ({
      //   email: a.email,
      //   displayName: a.displayName,
      // })),
      conferenceData: {
        createRequest: {
          requestId: crypto.randomUUID(),
          conferenceSolutionKey: {
            type: "hangoutsMeet",
          },
        },
      },
    };

    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Google Calendar API Error:", error);
      throw new Error(`Failed to create calendar event: ${error}`);
    }

    const data = await response.json();

    return {
      eventId: data.id,
      meetLink: data.conferenceData?.entryPoints?.find(
        (e: any) => e.entryPointType === "video"
      )?.uri || "",
      htmlLink: data.htmlLink,
    };
  }

  async deleteEvent(eventId: string): Promise<void> {
    const accessToken = await getAccessToken(this.credentials);

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok && response.status !== 404) {
      const error = await response.text();
      throw new Error(`Failed to delete calendar event: ${error}`);
    }
  }
}

// Helper to parse date and time into ISO format
export function createDateTimeISO(
  date: string,       // "2026-02-15"
  time: string,       // "14:00"
  durationMinutes: number
): { start: string; end: string } {
  // Parse as local time in Asia/Jakarta
  const startDate = new Date(`${date}T${time}:00+07:00`);
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

  return {
    start: startDate.toISOString(),
    end: endDate.toISOString(),
  };
}
