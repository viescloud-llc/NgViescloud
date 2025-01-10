import { Component, EventEmitter, forwardRef, Input, Output, SimpleChanges } from '@angular/core';
import { DataUtils } from '../../util/Data.utils';
import { MatFormFieldComponent } from '../mat-form-field/mat-form-field.component';

class KeyPair<K, V> {
  key!: K;
  value!: V;

  constructor(key: K, value: V) {
    this.key = key;
    this.value = value;
  }
}

@Component({
  selector: 'app-mat-form-field-input-record',
  templateUrl: './mat-form-field-input-record.component.html',
  styleUrls: ['./mat-form-field-input-record.component.scss'],
  providers: [{ provide: MatFormFieldComponent, useExisting: forwardRef(() => MatFormFieldInputRecordComponent) }],
})
export class MatFormFieldInputRecordComponent<K extends string | number, V> extends MatFormFieldComponent {

  override value!: Record<K, V>;
  override valueCopy!: Record<K, V>;
  override blankObject!: Record<K, V>;

  keypairs: KeyPair<K, V>[] = [];

  @Output()
  override valueChange: EventEmitter<Record<K, V>> = new EventEmitter();

  @Input()
  showSizeInput: boolean = true;

  @Input()
  showRemoveItemButton: boolean = true;

  @Input()
  showAddItemButton: boolean = true;

  @Input()
  maxSize: number = 100;

  @Input()
  minSize: number = 0;

  listLength!: number;

  validForm: boolean = false;
  validKeyPair: boolean = false;

  isMapKeyObject: boolean = false;
  isMapValueObject: boolean = false;

  override ngOnInit(): void {
    super.ngOnInit();

    if(this.value === undefined || typeof this.value !== 'object') {
      this.value = {} as Record<K, V>;
    }

    // this.isMapValueObject = (this.blankObject && this.blankObject.size > 0 && typeof this.blankObject.values().next().value === 'object') || (this.value && this.value.size > 0 && typeof this.value.values().next().value === 'object');
    this.isMapKeyObject = (this.blankObject && this.getRecordSize(this.blankObject) > 0 && typeof this.getRecordValueAtIndex(0, this.blankObject) === 'object') || (this.value && this.getRecordSize() > 0 && typeof this.getRecordValueAtIndex(0) === 'object');

    this.keypairs = [];
    if(this.getRecordSize() > 0) {
      this.foreachRecord((key, value) => {
        this.keypairs.push(new KeyPair<K, V>(key, value));
      })
    }

    this.checkValidKeyPair();
  }

  override isValidInput(): boolean {
    let superCheck = super.isValidInput();
    this.checkValidKeyPair();
    if(!superCheck)
      return superCheck;
    else if(this.getRecordSize() < this.minSize)
      return false;
    else
      return this.validForm && this.validKeyPair;
  }

  checkValidKeyPair() {
    this.validKeyPair = !this.hasDuplicateKeysInKeyPairs();
  }

  private hasDuplicateKeysInKeyPairs(keyPairs: KeyPair<K, V>[] = this.keypairs): boolean {
    const seenKeys = new Set<K>();

    for (const pair of keyPairs) {
      if (seenKeys.has(pair.key)) {
        return true; // Duplicate key found
      }
      seenKeys.add(pair.key);
    }

    return false; // No duplicates
  }

  private foreachRecord(fn: (key: K, value: V) => void) {
    for(let [key, value] of Object.entries(this.value)) {
      fn(key as K, value as V);
    }
  }

  private getRecordKeyAtIndex(index: number, record: Record<K, V> = this.value): K | undefined {
    const keys = Object.keys(record); // Get all keys as an array

    if(keys.length <= index) {
      return undefined; // Index out of bounds
    }

    return keys[index] as K; // Return the key at the specified index
  }

  private getRecordValueAtIndex(index: number, record: Record<K, V> = this.value): V | undefined {
    const key = this.getRecordKeyAtIndex(index, record);
    return key ? record[key] as V : undefined;
  }

  private setRecordValue(key: K, value: V, record: Record<K, V> = this.value) {
    record[key] = value;
  }

  private deleteRecordValue(key: K, record: Record<K, V> = this.value) {
    delete record[key];
  }

  getBlankKey() {
    return this.getRecordKeyAtIndex(0, this.blankObject)!;
  }

  getBlankValue() {
    return this.getRecordValueAtIndex(0, this.blankObject)!;
  }

  getRecordSize(record: Record<K, V> = this.value): number {
    return Object.keys(this.value).length;
  }

  getKeyPairsSize(): number {
    return this.keypairs.length;
  }

  updateListLength() {
    if(this.reachMaxSize())
      this.listLength = this.maxSize;

    while(this.getKeyPairsSize() < this.listLength)
      this.keypairs.push(new KeyPair<K, V>(this.getBlankKey(), this.getBlankValue()));

    if(this.getKeyPairsSize() > this.listLength) {
      let deleteSize = this.getKeyPairsSize() - this.listLength
      this.keypairs.splice(this.listLength, deleteSize);
    }

    this.listLength = this.getKeyPairsSize();
  }

  addNewItem() {
    this.keypairs.push(new KeyPair<K, V>(this.getBlankKey(), this.getBlankValue()));
    this.listLength = this.getKeyPairsSize();
    this.applyValue();
    this.checkValidKeyPair();
  }

  remove(index: number) {
    this.keypairs.splice(index, 1);
    this.listLength = this.getKeyPairsSize();
    this.applyValue();
    this.checkValidKeyPair();
  }

  reachMaxSize() {
    return this.getKeyPairsSize() >= this.maxSize;
  }

  isMapKeyOrValueObject(): boolean {
    return this.isMapKeyObject || this.isMapValueObject;
  }

  applyValue() {
    for(const keypair of this.keypairs) {
      if(keypair.key)
        this.setRecordValue(keypair.key, keypair.value);
    }

    this.foreachRecord((key, value) => {
      if(!this.keypairs.some(keypair => DataUtils.isEqual(keypair.key, key))) {
        this.deleteRecordValue(key);
      }
    })

    this.emitValue();
  }
}
