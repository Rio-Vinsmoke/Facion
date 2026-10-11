import { supabase } from '../lib/supabase'
import type { DeliveryAddress } from '../types/address'

type AddressRow = {
  full_name: string
  phone: string
  address_line: string
  city: string
  state: string
  postal_code: string
}

export async function fetchDeliveryAddress(
  userId: string,
): Promise<DeliveryAddress | null> {
  const { data, error } = await supabase
    .from('delivery_addresses')
    .select('full_name, phone, address_line, city, state, postal_code')
    .eq('user_id', userId)
    .maybeSingle<AddressRow>()

  if (error) throw error
  if (!data) return null

  return {
    fullName: data.full_name,
    phone: data.phone,
    addressLine: data.address_line,
    city: data.city,
    state: data.state,
    postalCode: data.postal_code,
  }
}

export async function saveDeliveryAddress(
  userId: string,
  address: DeliveryAddress,
): Promise<void> {
  const { error } = await supabase
    .from('delivery_addresses')
    .upsert(
      {
        user_id: userId,
        full_name: address.fullName.trim(),
        phone: address.phone.trim(),
        address_line: address.addressLine.trim(),
        city: address.city.trim(),
        state: address.state.trim(),
        postal_code: address.postalCode.trim(),
        country: 'India',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )

  if (error) throw error
}