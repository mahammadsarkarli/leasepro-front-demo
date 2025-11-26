import { supabase } from '../services/supabaseClient';

/**
 * Utility function to remove any constraints that prevent changing company_id for vehicles
 * This should be run once to fix the database constraint issue
 */
export async function removeVehicleCompanyConstraint(): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Attempting to remove vehicle company_id constraints...');

    // Try to execute the constraint removal SQL directly
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Drop any triggers that might prevent company_id changes on vehicles
        DO $$ 
        BEGIN
            DROP TRIGGER IF EXISTS prevent_vehicle_company_change ON vehicles;
        EXCEPTION
            WHEN undefined_object THEN null;
        END $$;

        -- Drop any functions that might prevent company_id changes
        DO $$ 
        BEGIN
            DROP FUNCTION IF EXISTS prevent_vehicle_company_change();
        EXCEPTION
            WHEN undefined_object THEN null;
        END $$;

        -- Remove any check constraints that might prevent company_id changes
        DO $$ 
        BEGIN
            ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_company_id_immutable;
        EXCEPTION
            WHEN undefined_object THEN null;
        END $$;

        -- Ensure company_id can be updated
        ALTER TABLE vehicles ALTER COLUMN company_id SET NOT NULL;

        -- Add a comment to document that company changes are allowed
        COMMENT ON COLUMN vehicles.company_id IS 'Company ID - can be changed to move vehicle between companies';
      `
    });

    if (error) {
      console.error('Error removing vehicle company constraint:', error);
      return { success: false, error: error.message };
    }

    console.log('Successfully removed vehicle company_id constraints');
    return { success: true };
  } catch (error) {
    console.error('Error in removeVehicleCompanyConstraint:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Test function to verify that company_id can be updated
 */
export async function testVehicleCompanyUpdate(vehicleId: string, newCompanyId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`Testing vehicle company update for vehicle ${vehicleId} to company ${newCompanyId}`);

    // First, get the current vehicle data
    const { data: currentVehicle, error: fetchError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', vehicleId)
      .single();

    if (fetchError) {
      return { success: false, error: `Failed to fetch vehicle: ${fetchError.message}` };
    }

    console.log('Current vehicle data:', currentVehicle);

    // Try to update the company_id
    const { data: updatedVehicle, error: updateError } = await supabase
      .from('vehicles')
      .update({ company_id: newCompanyId })
      .eq('id', vehicleId)
      .select()
      .single();

    if (updateError) {
      return { success: false, error: `Failed to update vehicle company: ${updateError.message}` };
    }

    console.log('Successfully updated vehicle company:', updatedVehicle);

    // Revert the change to avoid affecting the actual data
    const { error: revertError } = await supabase
      .from('vehicles')
      .update({ company_id: currentVehicle.company_id })
      .eq('id', vehicleId);

    if (revertError) {
      console.warn('Failed to revert test change:', revertError);
    }

    return { success: true };
  } catch (error) {
    console.error('Error in testVehicleCompanyUpdate:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
