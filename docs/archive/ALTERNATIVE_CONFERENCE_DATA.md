# Alternative conferenceData Structures

If the current implementation fails with "Invalid conference type value" error, try these alternatives.

## Current Implementation

```typescript
conferenceData: {
  createRequest: {
    requestId: bookingData.bookingId,
    conferenceSolutionKey: {
      type: 'hangoutsMeet',
    },
  },
}
```

**URL:** `?conferenceDataVersion=1`

## Alternative 1: Minimal Structure

Remove the requestId and use minimal structure:

```typescript
conferenceData: {
  createRequest: {
    conferenceSolutionKey: {
      type: 'hangoutsMeet'
    }
  }
}
```

**When to use:** If requestId validation is failing

## Alternative 2: With Status Field

Add status field to createRequest:

```typescript
conferenceData: {
  createRequest: {
    requestId: bookingData.bookingId,
    conferenceSolutionKey: {
      type: 'hangoutsMeet'
    },
    status: {
      statusCode: 'success'
    }
  }
}
```

**When to use:** If API expects status field

## Alternative 3: Explicit Conference Solution

Include both conferenceSolution and createRequest:

```typescript
conferenceData: {
  conferenceSolution: {
    key: {
      type: 'hangoutsMeet'
    }
  },
  createRequest: {
    requestId: bookingData.bookingId,
    conferenceSolutionKey: {
      type: 'hangoutsMeet'
    }
  }
}
```

**When to use:** If API needs explicit solution definition

## Alternative 4: No conferenceData (Calendar Default)

Remove conferenceData entirely and rely on calendar settings:

```typescript
// No conferenceData field
const eventData = {
  summary: "...",
  description: "...",
  start: {...},
  end: {...}
  // conferenceData removed
}
```

**Prerequisites:**
- Calendar must have "Auto-add Google Meet" enabled
- Go to calendar settings
- Enable "Automatically add Google Meet video conferences"

**When to use:** If conferenceData structure keeps failing

## How to Switch Implementations

### Step 1: Update index.ts

Find this section (around line 156-164):

```typescript
conferenceData: {
  createRequest: {
    requestId: bookingData.bookingId,
    conferenceSolutionKey: {
      type: 'hangoutsMeet',
    },
  },
},
```

### Step 2: Replace with Alternative

Choose one of the alternatives above and replace the conferenceData section.

### Step 3: Update Interface (if needed)

If using Alternative 3, update the CalendarEvent interface:

```typescript
interface CalendarEvent {
  summary: string
  description: string
  start: {
    dateTime: string
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
  conferenceData?: {  // Make it optional
    conferenceSolution?: {
      key: {
        type: string
      }
    }
    createRequest: {
      requestId?: string
      conferenceSolutionKey: {
        type: string
      }
      status?: {
        statusCode: string
      }
    }
  }
}
```

### Step 4: Deploy

```bash
supabase functions deploy create-meeting-link
```

### Step 5: Test

```bash
node test-meeting-link.js
```

## Testing Each Alternative

### Test Script for Alternative 1
```typescript
// Minimal structure
const eventData = {
  summary: "Test Meeting",
  start: { dateTime: "2025-12-01T14:00:00+07:00", timeZone: "Asia/Jakarta" },
  end: { dateTime: "2025-12-01T15:00:00+07:00", timeZone: "Asia/Jakarta" },
  conferenceData: {
    createRequest: {
      conferenceSolutionKey: {
        type: 'hangoutsMeet'
      }
    }
  }
}
```

### Test Script for Alternative 2
```typescript
// With status
const eventData = {
  summary: "Test Meeting",
  start: { dateTime: "2025-12-01T14:00:00+07:00", timeZone: "Asia/Jakarta" },
  end: { dateTime: "2025-12-01T15:00:00+07:00", timeZone: "Asia/Jakarta" },
  conferenceData: {
    createRequest: {
      requestId: "unique-id-123",
      conferenceSolutionKey: {
        type: 'hangoutsMeet'
      },
      status: {
        statusCode: 'success'
      }
    }
  }
}
```

### Test Script for Alternative 3
```typescript
// Explicit solution
const eventData = {
  summary: "Test Meeting",
  start: { dateTime: "2025-12-01T14:00:00+07:00", timeZone: "Asia/Jakarta" },
  end: { dateTime: "2025-12-01T15:00:00+07:00", timeZone: "Asia/Jakarta" },
  conferenceData: {
    conferenceSolution: {
      key: {
        type: 'hangoutsMeet'
      }
    },
    createRequest: {
      requestId: "unique-id-123",
      conferenceSolutionKey: {
        type: 'hangoutsMeet'
      }
    }
  }
}
```

### Test Script for Alternative 4
```typescript
// No conferenceData
const eventData = {
  summary: "Test Meeting",
  start: { dateTime: "2025-12-01T14:00:00+07:00", timeZone: "Asia/Jakarta" },
  end: { dateTime: "2025-12-01T15:00:00+07:00", timeZone: "Asia/Jakarta" }
}
```

## Debugging conferenceData Issues

### Check API Response
After API call, log the full response:

```typescript
console.log('Full event:', JSON.stringify(event, null, 2))
```

Look for:
- `hangoutLink` field (the Meet URL)
- `conferenceData` field (conference details)
- Any error messages in response

### Common Issues

**Issue 1: hangoutLink is undefined**
- Check if `conferenceDataVersion=1` is in URL
- Verify conferenceData structure is correct
- Check calendar supports Google Meet

**Issue 2: conferenceData in response is empty**
- API didn't process the conferenceData request
- Check URL parameter
- Check service account permissions

**Issue 3: Error about conference type**
- Type must be exactly `'hangoutsMeet'`
- Check for typos
- Verify calendar type

## Calendar Settings Alternative

Instead of using conferenceData in API:

### Step 1: Enable in Calendar Settings
1. Go to Google Calendar
2. Find your service account calendar
3. Settings → Event Settings
4. Enable "Automatically add Google Meet video conferences to events"

### Step 2: Update Code
Remove conferenceData field entirely:

```typescript
const eventData: CalendarEvent = {
  summary: `${bookingData.expertName} - ${bookingData.sessionType}`,
  description: `Booking details...`,
  start: {
    dateTime: startDateTimeFormatted,
    timeZone: 'Asia/Jakarta',
  },
  end: {
    dateTime: endDateTimeFormatted,
    timeZone: 'Asia/Jakarta',
  }
  // No conferenceData field
}
```

### Step 3: Update Interface
```typescript
interface CalendarEvent {
  summary: string
  description: string
  start: {
    dateTime: string
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
  // conferenceData removed
}
```

### Step 4: Remove URL Parameter
```typescript
// Change from:
const apiUrl = `...events?conferenceDataVersion=1`

// To:
const apiUrl = `...events`
```

## Recommendation

**Start with current implementation** → If it fails, try alternatives in this order:

1. ✅ **Current** (with requestId) - Most feature-rich
2. **Alternative 1** (minimal) - Simplest structure
3. **Alternative 4** (calendar default) - No API complexity
4. **Alternative 2** (with status) - If status required
5. **Alternative 3** (explicit) - If full definition needed

## Success Criteria

When you find the working implementation, you should see:

```json
{
  "id": "event-id",
  "hangoutLink": "https://meet.google.com/xxx-xxxx-xxx",
  "conferenceData": {
    "conferenceId": "xxx-xxxx-xxx",
    "conferenceSolution": {
      "name": "Google Meet",
      "key": {
        "type": "hangoutsMeet"
      }
    }
  }
}
```

The `hangoutLink` field is what we need!

---

**Note:** Try current implementation with enhanced logging first. Only switch to alternatives if you see specific errors in the logs.
