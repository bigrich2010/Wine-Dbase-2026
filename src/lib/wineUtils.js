import { supabase } from './supabase'

/**
 * Finds an existing wine record matching producer + wine_name + vintage.
 * Returns the existing wine id if found, null otherwise.
 */
export async function findExistingWine(producer, wine_name, vintage) {
  if (!producer) return null
  try {
    const { data, error } = await supabase
      .from('wines')
      .select('id, producer, wine_name, vintage')
      .ilike('producer', `%${producer.trim()}%`)

    if (error || !data || !data.length) return null

  // Find best match
  const match = data.find(w => {
    const producerMatch =
      w.producer.toLowerCase().includes(producer.toLowerCase()) ||
      producer.toLowerCase().includes(w.producer.toLowerCase())

    const nameMatch = !wine_name || !w.wine_name ||
      w.wine_name.toLowerCase().includes(wine_name.toLowerCase()) ||
      wine_name.toLowerCase().includes(w.wine_name.toLowerCase())

    const vintageMatch = !vintage || !w.vintage ||
      parseInt(w.vintage) === parseInt(vintage)

    return producerMatch && nameMatch && vintageMatch
  })

    return match?.id || null
  } catch(e) {
    console.error('findExistingWine error:', e)
    return null
  }
}

/**
 * Gets or creates a wine record.
 * Returns the wine id — existing if found, newly created if not.
 */
export async function getOrCreateWine(wineData) {
  try {
    const existing = await findExistingWine(
      wineData.producer,
      wineData.wine_name,
      wineData.vintage
    )

    if (existing) return existing

    const { data, error } = await supabase.from('wines').insert([{
    producer: wineData.producer,
    wine_name: wineData.wine_name || null,
    vintage: wineData.vintage ? parseInt(wineData.vintage) : null,
    type: wineData.type || 'Red',
    region: wineData.region || null,
    appellation: wineData.appellation || null,
    country: wineData.country || null,
    grape: wineData.grape || null,
  }]).select().single()

    if (error) throw error
    return data?.id || null
  } catch(e) {
    console.error('getOrCreateWine error:', e)
    return null
  }
}
