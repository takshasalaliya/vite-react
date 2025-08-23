import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://skmrqcgajorluaaqrdvk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrbXJxY2dham9ybHVhYXFyZHZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNjE3NzYsImV4cCI6MjA3MDYzNzc3Nn0.mZuP-ew_6PwLy2Za4Q0w7RcxmbBRbp6yJ-Hv9gKV-jQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixUserRoles() {
  try {
    console.log('Checking current user roles...');
    
    // Check current users
    const { data: currentUsers, error: fetchError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .in('role', ['event_handler', 'event_manager'])
      .order('role');
    
    if (fetchError) {
      console.error('Error fetching users:', fetchError);
      return;
    }
    
    console.log('Current users:', currentUsers);
    
    // Update Nirja to be event_manager
    const { error: updateNirjaError } = await supabase
      .from('users')
      .update({ role: 'event_manager' })
      .eq('email', 'nirja@gmail.com');
    
    if (updateNirjaError) {
      console.error('Error updating Nirja:', updateNirjaError);
    } else {
      console.log('Updated Nirja to event_manager role');
    }
    
    // Update himanshu to be event_handler
    const { error: updateHimanshuError } = await supabase
      .from('users')
      .update({ role: 'event_handler' })
      .or('email.eq.himanshu@gmail.com,name.eq.himanshu');
    
    if (updateHimanshuError) {
      console.error('Error updating himanshu:', updateHimanshuError);
    } else {
      console.log('Updated himanshu to event_handler role');
    }
    
    // Check final state
    const { data: finalUsers, error: finalError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .in('role', ['event_handler', 'event_manager'])
      .order('role');
    
    if (finalError) {
      console.error('Error fetching final users:', finalError);
      return;
    }
    
    console.log('Final users:', finalUsers);
    
    // Check what will appear in dropdown
    const { data: handlers, error: handlersError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('role', 'event_handler')
      .order('name');
    
    if (handlersError) {
      console.error('Error fetching handlers:', handlersError);
      return;
    }
    
    console.log('Handlers that will appear in dropdown:', handlers);
    
  } catch (error) {
    console.error('Script error:', error);
  }
}

fixUserRoles();
