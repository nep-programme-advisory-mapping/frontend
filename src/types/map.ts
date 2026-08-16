/**
 * UI-facing filter state for the map view.
 *
 * Each field maps to a filter control in MapFilterBar. Values are display-oriented
 * strings (category codes, province names, etc.) rather than the numeric IDs used
 * by the export API (MapFilters).
 */
export interface MapFilters {
  entry_ids?: string | null
  category_id?: number | null
  subcategory_id?: number | null
  item_id?: number | null
  education_level_id?: number | null
  inclusion_group?: string | null
  inclusion_type?: string | null
  province_id?: number | null
  district_id?: number | null
  commune_id?: number | null
  keyword?: string | null
  organisation_name?: string | null
  agreement_counterpart_type?: string | null
}

export interface MapViewFilters {
  category: string
  level: string
  inclusion: string
  province: string
  district: string
  commune: string
  village: string
  counterpart: string
  keyword: string
}
