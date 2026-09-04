import { Component, computed, EventEmitter, inject, Input, OnChanges, Output, signal, SimpleChanges } from '@angular/core';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { flattenKnownPermissions, KNOWN_PERMISSIONS } from '../../model/permission.model';
import { PermissionStrings } from '../../util/Permission.utils';

/**
 * Chips editor for permission grants (`orders:read`, `shipments:*`, `*`).
 *
 * - Type a grant and press Enter/comma (or pick a suggestion) to add it;
 *   click the × on a chip to remove it. Duplicates are ignored.
 * - Every entry is validated against the frozen grammar (PermissionStrings)
 *   with an inline message naming the problem — mirrors the server's 400.
 * - Suggestions come from the app-provided KNOWN_PERMISSIONS catalog (the lib
 *   itself is vocabulary-free), or from the `suggestions` input; the global
 *   `*` and `resource:*` wildcards are always offered.
 *
 * Emits the full normalized array on every change.
 */
@Component({
  selector: 'app-mat-form-field-input-permission',
  standalone: false,
  templateUrl: './mat-form-field-input-permission.component.html',
  styleUrls: ['./mat-form-field-input-permission.component.scss']
})
export class MatFormFieldInputPermissionComponent implements OnChanges {

  @Input() value: string[] = [];
  @Output() valueChange = new EventEmitter<string[]>();

  @Input() label = 'Permissions';
  @Input() placeholder = 'resource:action — e.g. orders:read, shipments:*, *';
  @Input() readonly = false;
  /** Overrides the KNOWN_PERMISSIONS catalog when given. */
  @Input() suggestions?: string[];

  readonly separatorKeys = [ENTER, COMMA];
  private readonly catalog = inject(KNOWN_PERMISSIONS, { optional: true }) ?? [];

  // Owned copy of the chips — never mutate the input reference.
  chips = signal<string[]>([]);
  inputText = signal<string>('');
  error = signal<string | null>(null);

  private allSuggestions = computed<string[]>(() => this.suggestions ?? flattenKnownPermissions(this.catalog));

  filteredSuggestions = computed<string[]>(() => {
    const typed = this.inputText().trim().toLowerCase();
    const have = new Set(this.chips());
    return this.allSuggestions()
      .filter(s => !have.has(s))
      .filter(s => !typed || s.includes(typed))
      .slice(0, 30);
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value']) {
      this.chips.set([...(this.value ?? [])]);
    }
  }

  onInput(event: Event) {
    this.inputText.set((event.target as HTMLInputElement).value ?? '');
    if (this.error()) this.error.set(null);
  }

  onTokenEnd(event: MatChipInputEvent) {
    const added = this.tryAdd(event.value);
    if (added) event.chipInput?.clear();
  }

  onSuggestionPicked(event: MatAutocompleteSelectedEvent, input: HTMLInputElement) {
    if (this.tryAdd(event.option.value)) {
      input.value = '';
      this.inputText.set('');
    }
  }

  remove(chip: string) {
    if (this.readonly) return;
    this.chips.set(this.chips().filter(c => c !== chip));
    this.emit();
  }

  /** Validate + normalize + add. Returns true when the chip was accepted. */
  private tryAdd(raw: string): boolean {
    const text = (raw ?? '').trim();
    if (!text) return false;
    const reason = PermissionStrings.explainInvalidGrant(text.toLowerCase());
    const normalized = PermissionStrings.normalizeGrant(text);
    if (reason || !normalized) {
      this.error.set(reason ?? `"${text}" is not a valid permission`);
      return false;
    }
    if (!this.chips().includes(normalized)) {
      this.chips.set([...this.chips(), normalized]);
      this.emit();
    }
    this.error.set(null);
    this.inputText.set('');
    return true;
  }

  private emit() {
    this.valueChange.emit([...this.chips()]);
  }
}
