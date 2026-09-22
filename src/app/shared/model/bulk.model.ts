import { ProductStatus } from './product.model';

// CSV import/export + bulk product actions (api.md §7.21).
export interface ImportIssue { row: number; message: string; }
export interface ImportChange { row: number; action: 'CREATE' | 'UPDATE' | 'UNCHANGED' | 'ADJUST'; key: string; details: string; }
export interface ImportResult {
  dryRun: boolean;
  applied: boolean;
  mode: string;
  rows: number;
  created: number;
  updated: number;
  unchanged: number;
  errors: ImportIssue[];
  changes: ImportChange[];
}

export type BulkAction = 'SET_STATUS' | 'ADJUST_PRICE' | 'ADD_TAGS' | 'REMOVE_TAGS' | 'MOVE_CATEGORY';
export interface BulkProductRequest {
  ids: string[];
  action: BulkAction;
  dryRun: boolean;
  status?: ProductStatus | null;
  percent?: string | number | null;
  amount?: string | number | null;
  applyToVariants?: boolean;
  tagIds?: string[];
  categoryId?: string | null;
}
export interface BulkFieldChange { field: string; from: string; to: string; }
export interface BulkProductItem { id: string; name: string; changes: BulkFieldChange[]; }
export interface BulkProductResult { dryRun: boolean; action: BulkAction; count: number; items: BulkProductItem[]; notes: string[]; }
