import { InjectionToken } from '@angular/core';

/**
 * One resource of an app's permission vocabulary, used purely for SUGGESTIONS
 * in the permission editor. The library knows the grammar, the consuming app
 * supplies the words by providing KNOWN_PERMISSIONS in its app config.
 */
export interface KnownPermission {
  resource: string;
  /** Concrete actions, e.g. ['read','create','update','delete','restock']. `*` is always offered too. */
  actions: string[];
  description?: string;
}

export const KNOWN_PERMISSIONS = new InjectionToken<KnownPermission[]>('KNOWN_PERMISSIONS', {
  providedIn: 'root',
  factory: () => []
});

/** Flatten the catalog into concrete suggestion strings: resource:action, resource:*, and the global *. */
export function flattenKnownPermissions(catalog: readonly KnownPermission[] | null | undefined): string[] {
  const out = new Set<string>(['*']);
  for (const kp of catalog ?? []) {
    if (!kp?.resource) continue;
    out.add(`${kp.resource}:*`);
    for (const action of kp.actions ?? []) out.add(`${kp.resource}:${action}`);
  }
  return [...out].sort();
}
