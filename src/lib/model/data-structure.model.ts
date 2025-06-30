export class FixedSizeMap<K, V> {
    private map = new Map<K, V>();
  
    constructor(private maxSize: number) {}
  
    set(key: K, value: V): void {
      if (this.map.has(key)) {
        // Delete and re-add to update insertion order
        this.map.delete(key);
      }
  
      this.map.set(key, value);
  
      if (this.map.size > this.maxSize) {
        // Remove oldest entry
        const oldestKey = this.map.keys().next().value;
        this.map.delete(oldestKey!);
      }
    }
  
    get(key: K): V | undefined {
      return this.map.get(key);
    }
  
    has(key: K): boolean {
      return this.map.has(key);
    }
  
    delete(key: K): boolean {
      return this.map.delete(key);
    }
  
    clear(): void {
      this.map.clear();
    }
  
    entries(): IterableIterator<[K, V]> {
      return this.map.entries();
    }
  
    keys(): IterableIterator<K> {
      return this.map.keys();
    }
  
    values(): IterableIterator<V> {
      return this.map.values();
    }
  
    forEach(callback: (value: V, key: K, map: Map<K, V>) => void): void {
      this.map.forEach(callback);
    }
  
    get size(): number {
      return this.map.size;
    }
  
    toMap(): Map<K, V> {
      return new Map(this.map);
    }

    getMaxSize() {
        return this.maxSize;
    }
  }