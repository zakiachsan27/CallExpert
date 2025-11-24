// Test script for Meeting Links Pool System
// Tests: assignment, conflict detection, link reuse

const SUPABASE_URL = "https://xnnlpwaodduqqiffeyxw.supabase.co"
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "YOUR_SERVICE_ROLE_KEY"

// Test scenarios
const tests = {
  async test1_singleBooking() {
    console.log('\n📋 Test 1: Single Booking Assignment')
    console.log('='repeat(50))

    const bookingId = "test-booking-" + Date.now()

    // Simulate creating a booking (you'll need actual booking ID from database)
    console.log(`Testing with booking ID: ${bookingId}`)

    const response = await fetch(`${SUPABASE_URL}/functions/v1/assign-meeting-link`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ bookingId })
    })

    const result = await response.json()

    console.log('Response:', JSON.stringify(result, null, 2))

    if (result.success) {
      console.log('✅ Test 1 PASSED: Meeting link assigned')
      console.log('   Link:', result.meetingLink)
    } else {
      console.log('❌ Test 1 FAILED:', result.error)
    }

    return result
  },

  async test2_conflictDetection() {
    console.log('\n📋 Test 2: Conflict Detection (Same Time Slot)')
    console.log('='repeat(50))

    console.log('This test requires 2 bookings at the same date/time')
    console.log('Create them in the database first, then run assign-meeting-link for each')
    console.log('Expected: They should get DIFFERENT links')

    // Manual test instructions
    console.log('\nManual Test SQL:')
    console.log(`
-- Step 1: Create 2 test bookings at same time
INSERT INTO bookings (
  user_id, expert_id, session_type,
  scheduled_date, scheduled_time, duration,
  price, payment_status, status, order_id
) VALUES
  ('user-1', 'expert-1', 'Konsultasi', '2025-12-01', '14:00', 60, 100000, 'paid', 'confirmed', 'TEST-1-' || gen_random_uuid()),
  ('user-2', 'expert-1', 'Konsultasi', '2025-12-01', '14:00', 60, 100000, 'paid', 'confirmed', 'TEST-2-' || gen_random_uuid())
RETURNING id, order_id;

-- Step 2: Get the IDs and call assign-meeting-link for each
-- They should get different links!
    `)
  },

  async test3_linkReuse() {
    console.log('\n📋 Test 3: Link Reuse (Different Time Slots)')
    console.log('='repeat(50))

    console.log('This test requires 2 bookings at DIFFERENT times')
    console.log('Expected: They CAN get the same link (reuse)')

    console.log('\nManual Test SQL:')
    console.log(`
-- Create 2 bookings at different times (no overlap)
INSERT INTO bookings (
  user_id, expert_id, session_type,
  scheduled_date, scheduled_time, duration,
  price, payment_status, status, order_id
) VALUES
  ('user-1', 'expert-1', 'Konsultasi', '2025-12-01', '14:00', 60, 100000, 'paid', 'confirmed', 'TEST-3A-' || gen_random_uuid()),
  ('user-2', 'expert-1', 'Konsultasi', '2025-12-01', '16:00', 60, 100000, 'paid', 'confirmed', 'TEST-3B-' || gen_random_uuid())
RETURNING id, order_id;

-- Both can potentially get the same link (no conflict)
    `)
  },

  async test4_poolExhaustion() {
    console.log('\n📋 Test 4: Pool Exhaustion (4 Concurrent Bookings)')
    console.log('='repeat(50))

    console.log('Pool has 3 links. Creating 4 bookings at same time...')
    console.log('Expected: First 3 succeed, 4th returns "no available links"')

    console.log('\nManual Test SQL:')
    console.log(`
-- Create 4 bookings at same time
INSERT INTO bookings (
  user_id, expert_id, session_type,
  scheduled_date, scheduled_time, duration,
  price, payment_status, status, order_id
) VALUES
  ('user-1', 'expert-1', 'Konsultasi', '2025-12-01', '10:00', 60, 100000, 'paid', 'confirmed', 'TEST-4A-' || gen_random_uuid()),
  ('user-2', 'expert-2', 'Konsultasi', '2025-12-01', '10:00', 60, 100000, 'paid', 'confirmed', 'TEST-4B-' || gen_random_uuid()),
  ('user-3', 'expert-3', 'Konsultasi', '2025-12-01', '10:00', 60, 100000, 'paid', 'confirmed', 'TEST-4C-' || gen_random_uuid()),
  ('user-4', 'expert-4', 'Konsultasi', '2025-12-01', '10:00', 60, 100000, 'paid', 'confirmed', 'TEST-4D-' || gen_random_uuid())
RETURNING id, order_id;

-- Assign to all 4
-- First 3 should succeed, 4th should fail with "no available links"
    `)
  }
}

// Run all tests
async function runAllTests() {
  console.log('🧪 Meeting Links Pool System - Test Suite')
  console.log('='repeat(50))

  console.log('\nℹ️  NOTE: Most tests require manual setup via SQL')
  console.log('   Follow the SQL instructions for each test\n')

  if (!SERVICE_ROLE_KEY || SERVICE_ROLE_KEY === 'YOUR_SERVICE_ROLE_KEY') {
    console.log('⚠️  WARNING: SUPABASE_SERVICE_ROLE_KEY not set')
    console.log('   Set it via: export SUPABASE_SERVICE_ROLE_KEY="your-key"')
    console.log('   Get it from: https://supabase.com/dashboard/project/xnnlpwaodduqqiffeyxw/settings/api\n')
  }

  // Test 1 can run automatically if you provide a real booking ID
  // await tests.test1_singleBooking()

  // Tests 2-4 require manual SQL setup
  await tests.test2_conflictDetection()
  await tests.test3_linkReuse()
  await tests.test4_poolExhaustion()

  console.log('\n' + '='repeat(50))
  console.log('✅ All test instructions displayed')
  console.log('\nNext Steps:')
  console.log('1. Apply migrations via Supabase Dashboard')
  console.log('2. Create test bookings using SQL above')
  console.log('3. Call assign-meeting-link for each booking')
  console.log('4. Verify results match expected behavior')
}

// Helper function to test assign-meeting-link directly
async function testAssignLink(bookingId) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/assign-meeting-link`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ bookingId })
  })

  const result = await response.json()
  console.log('Result:', JSON.stringify(result, null, 2))
  return result
}

// Export for use
if (require.main === module) {
  runAllTests().catch(console.error)
}

module.exports = { tests, testAssignLink }
