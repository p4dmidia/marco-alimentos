import { supabase } from "./supabaseClient";
import { ORGANIZATION_ID } from "../../shared/tenant";

export function orgSelect(table: string, columns: string = "*") {
  return supabase.from(table).select(columns).eq("organization_id", ORGANIZATION_ID);
}

export function orgInsert(table: string, payload: Record<string, any>) {
  return supabase.from(table).insert([{ ...payload, organization_id: ORGANIZATION_ID }]);
}

export function orgUpdate(table: string, match: Record<string, any>, patch: Record<string, any>) {
  return supabase
    .from(table)
    .update({ ...patch, organization_id: ORGANIZATION_ID })
    .match({ ...match, organization_id: ORGANIZATION_ID });
}
