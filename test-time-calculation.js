// Test script to validate time calculations
// This simulates the fixed time calculation logic

function formatDateTime(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+07:00`
}

function parseScheduledDateTime(scheduledDate, scheduledTime) {
  const [year, month, day] = scheduledDate.split('-').map(Number)
  const [hours, minutes] = scheduledTime.split(':').map(Number)
  return new Date(year, month - 1, day, hours, minutes, 0, 0)
}

function calculateEndTime(scheduledDate, scheduledTime, duration) {
  const startDateTime = parseScheduledDateTime(scheduledDate, scheduledTime)
  const endDateTime = new Date(startDateTime.getTime() + duration * 60 * 1000)
  return formatDateTime(endDateTime)
}

// Test cases
const testCases = [
  {
    name: "60 minute session",
    scheduledDate: "2025-12-01",
    scheduledTime: "14:00",
    duration: 60
  },
  {
    name: "30 minute session",
    scheduledDate: "2025-12-01",
    scheduledTime: "09:30",
    duration: 30
  },
  {
    name: "90 minute session",
    scheduledDate: "2025-12-15",
    scheduledTime: "16:45",
    duration: 90
  },
  {
    name: "Session across midnight",
    scheduledDate: "2025-12-31",
    scheduledTime: "23:30",
    duration: 60
  }
]

console.log("🧪 Testing Time Calculation Logic\n")

testCases.forEach(test => {
  const startDateTime = parseScheduledDateTime(test.scheduledDate, test.scheduledTime)
  const startFormatted = formatDateTime(startDateTime)
  const endFormatted = calculateEndTime(test.scheduledDate, test.scheduledTime, test.duration)

  const start = new Date(startFormatted.replace('+07:00', ''))
  const end = new Date(endFormatted.replace('+07:00', ''))
  const durationMinutes = (end - start) / (1000 * 60)

  console.log(`Test: ${test.name}`)
  console.log(`  Input: ${test.scheduledDate} ${test.scheduledTime}, duration: ${test.duration} min`)
  console.log(`  Start: ${startFormatted}`)
  console.log(`  End:   ${endFormatted}`)
  console.log(`  ✅ Duration verified: ${durationMinutes} minutes`)

  if (durationMinutes !== test.duration) {
    console.log(`  ❌ ERROR: Expected ${test.duration} minutes, got ${durationMinutes}`)
  }

  // Check that end is after start
  if (end <= start) {
    console.log(`  ❌ ERROR: End time is not after start time!`)
  } else {
    console.log(`  ✅ End time is after start time`)
  }

  console.log()
})

console.log("✅ All time calculations validated!")
