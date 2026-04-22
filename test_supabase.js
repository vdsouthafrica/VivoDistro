const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://msjinuumxmezrijqemmp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zamludXVteG1lenJpanFlbW1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwOTAyNjMsImV4cCI6MjA4NzY2NjI2M30.ic50fSC7MQfhSkhfE5E8B0R5-BGCQStMRZNHiy6Zakw';
const supabaseClient = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    // Attempting a chat 
    const { data, error } = await supabaseClient.from('inbox_items').insert([{
        sender_id: '00000000-0000-0000-0000-000000000000',
        recipient_id: '00000000-0000-0000-0000-000000000000',
        recipient_name: 'Test',
        message: 'Test message',
        sender_phone: '1234567890',
        type: 'chat',
        status: 'pending',
        created_at: new Date().toISOString()
    }]);

    console.log("Chat Error:", error);

    // Attempting a booking
    const { data: d2, error: e2 } = await supabaseClient.from('inbox_items').insert([{
        sender_id: '00000000-0000-0000-0000-000000000000',
        recipient_id: '00000000-0000-0000-0000-000000000000',
        recipient_name: 'Test',
        event_name: 'Test Event',
        venue: 'Test Venue',
        location: 'Test Location',
        event_date: '2024-01-01',
        start_time: '12:00',
        end_time: '13:00',
        venue_type: 'Indoor',
        expected_attendance: '100',
        sender_phone: '1234567890',
        type: 'booking',
        status: 'pending',
        created_at: new Date().toISOString()
    }]);

    console.log("Booking Error:", e2);

    // See table columns
    const { data: cols, error: errCols } = await supabaseClient
        .from('inbox_items')
        .select('*')
        .limit(1);
    
    console.log("Columns Data:", cols);
    console.log("Columns Error:", errCols);
}

testInsert();
