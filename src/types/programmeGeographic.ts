export interface Province {
  id: number
  province_name: string
}

export interface District {
  id: number
  province_id: number
  name: string
}

export interface Commune {
  id: number
  district_id: number
  name: string
}

export interface Village {
  id: number
  commune_id: number
  name: string
}

export interface ProgrammeGeographicData {
  provinceIds: number[]
  districts: Record<number, number[]>
  communes: Record<number, number[]>
  villages: Record<number, number[]>
  otherCountries: string
}
