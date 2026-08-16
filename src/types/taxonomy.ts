export interface TaxonomyItem {
  id: number;
  name: string;
  label?: string;
  is_active: boolean;
}

export type InclusionGroup =
  | 'Disability'
  | 'Gender'
  | 'LGBTIQ+'
  | 'Ethnicity/language'
  | 'Displacement'
  | 'Migrant families'
  | 'Statelessness'
  | 'Other';

export interface ActivityInclusionDimension {
  group: InclusionGroup;
  type?: 'A' | 'B';
  otherText?: string;
}

export interface ActivityInclusion {
  hasInclusion: boolean;
  dimensions: ActivityInclusionDimension[];
}

export interface SelectedTaxonomyItem extends TaxonomyItem {
  inclusion?: ActivityInclusion;
}

export interface SubCategory {
  id: number;
  name: string;
  label?: string;
  is_active?: boolean;
  items: TaxonomyItem[];
}

export interface Category {
  id: number;
  name: string;
  label?: string;
  is_active?: boolean;
  subCategories: SubCategory[];
}

export interface SelectedActivity extends TaxonomyItem {
  educationLevelIds: number[];
  inclusion?: ActivityInclusion;
  is_primary?: boolean;
}

export type TaxonomyNodeType = 'category' | 'subCategory' | 'item'
export type TaxonomyItemStatus = 'active' | 'deprecated'

export interface TaxonomyCreatePayload {
  name: string
  label?: string
  code?: string
  category_id?: number
  sub_category_id?: number
  subcategory_id?: number
}

export interface TaxonomyRenamePayload {
  label: string
}

export interface OtherQueuePayload {
  text: string
  suggested_category: string
  category_code?: string
  subcategory_label?: string
}
