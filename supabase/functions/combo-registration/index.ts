import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || userData?.role !== 'admin') {
      throw new Error('Access denied. Admin role required.')
    }

    const { combo_id, user_id, transaction_id, amount_paid } = await req.json()

    if (!combo_id || !user_id) {
      throw new Error('Missing required fields: combo_id, user_id')
    }

    // Start a transaction to check capacities and create registrations
    const { data, error } = await supabaseClient.rpc('create_combo_registration', {
      p_combo_id: combo_id,
      p_user_id: user_id,
      p_transaction_id: transaction_id || null,
      p_amount_paid: amount_paid || 0
    })

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Combo registration created successfully',
        data 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})

// Database function to be created in Supabase:
/*
CREATE OR REPLACE FUNCTION create_combo_registration(
  p_combo_id UUID,
  p_user_id UUID,
  p_transaction_id TEXT,
  p_amount_paid NUMERIC
) RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
  combo_record RECORD;
  combo_item RECORD;
  registration_id UUID;
  child_registrations JSONB := '[]'::jsonb;
  capacity_check BOOLEAN := true;
BEGIN
  -- Get combo details
  SELECT * INTO combo_record FROM combos WHERE id = p_combo_id AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Combo not found or inactive';
  END IF;

  -- Check combo capacity
  IF combo_record.capacity IS NOT NULL THEN
    SELECT COUNT(*) INTO capacity_check FROM registrations 
    WHERE target_type = 'combo' AND target_id = p_combo_id;
    
    IF capacity_check >= combo_record.capacity THEN
      RAISE EXCEPTION 'Combo capacity exceeded';
    END IF;
  END IF;

  -- Create parent registration
  INSERT INTO registrations (
    id, user_id, target_type, target_id, 
    transaction_id, amount_paid, payment_status, selected
  ) VALUES (
    gen_random_uuid(), p_user_id, 'combo', p_combo_id,
    p_transaction_id, p_amount_paid, 'pending', true
  ) RETURNING id INTO registration_id;

  -- Create child registrations (trigger will handle this, but we can also do it manually)
  FOR combo_item IN 
    SELECT * FROM combo_items WHERE combo_id = p_combo_id ORDER BY position
  LOOP
    -- Check individual item capacity
    IF combo_item.target_type = 'event' THEN
      SELECT COUNT(*) INTO capacity_check FROM registrations 
      WHERE target_type = 'event' AND target_id = combo_item.target_id;
      
      SELECT max_participants INTO capacity_check FROM events 
      WHERE id = combo_item.target_id;
      
      IF capacity_check IS NOT NULL AND capacity_check <= (
        SELECT COUNT(*) FROM registrations 
        WHERE target_type = 'event' AND target_id = combo_item.target_id
      ) THEN
        RAISE EXCEPTION 'Event capacity exceeded: %', combo_item.target_id;
      END IF;
    ELSIF combo_item.target_type = 'workshop' THEN
      SELECT COUNT(*) INTO capacity_check FROM registrations 
      WHERE target_type = 'workshop' AND target_id = combo_item.target_id;
      
      SELECT capacity INTO capacity_check FROM workshops 
      WHERE id = combo_item.target_id;
      
      IF capacity_check IS NOT NULL AND capacity_check <= (
        SELECT COUNT(*) FROM registrations 
        WHERE target_type = 'workshop' AND target_id = combo_item.target_id
      ) THEN
        RAISE EXCEPTION 'Workshop capacity exceeded: %', combo_item.target_id;
      END IF;
    END IF;

    -- Create child registration
    INSERT INTO registrations (
      id, user_id, target_type, target_id,
      transaction_id, amount_paid, payment_status, selected, parent_registration_id
    ) VALUES (
      gen_random_uuid(), p_user_id, combo_item.target_type, combo_item.target_id,
      p_transaction_id, 0, 'pending', true, registration_id
    );

    -- Add to child registrations array
    child_registrations := child_registrations || jsonb_build_object(
      'id', gen_random_uuid(),
      'target_type', combo_item.target_type,
      'target_id', combo_item.target_id
    );
  END LOOP;

  RETURN jsonb_build_object(
    'parent_registration_id', registration_id,
    'child_registrations', child_registrations,
    'combo_name', combo_record.name,
    'total_items', jsonb_array_length(child_registrations)
  );
END;
$$;
*/ 