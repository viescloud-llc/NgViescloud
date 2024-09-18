import { BehaviorSubject, Observable } from "rxjs";

export class ExpiableMap<K, V> {
    private cache = new Map<K, V>();
    private expiryMap = new Map<K, number>();
    
    // Subject to notify subscribers when new data is set
    private dataSubject = new BehaviorSubject<{ key: K; value: V } | null>(null);
  
    constructor() {}
  
    // Set a value in the map with a TTL
    set(key: K, value: V, ttl: number = 5000) {
      const expiryTime = Date.now() + ttl;
      this.cache.set(key, value);
      this.expiryMap.set(key, expiryTime);
  
      // Emit the new value to all subscribers
      this.dataSubject.next({ key, value });
  
      // Set timeout to delete the cache after TTL
      setTimeout(() => this.remove(key), ttl);
    }
  
    // Get a value from the map
    get(key: K): V | null {
      const expiryTime = this.expiryMap.get(key);
  
      // Check if the cache has expired
      if (expiryTime && Date.now() > expiryTime) {
        this.remove(key);
        return null;
      }
  
      return this.cache.get(key) || null;
    }
  
    // Check if a key exists in the map and is not expired
    has(key: K): boolean {
      const expiryTime = this.expiryMap.get(key);
      
      // Check if the cache is valid
      if (expiryTime && Date.now() > expiryTime) {
        this.remove(key);
        return false;
      }
  
      return this.cache.has(key);
    }
  
    // Remove a value from the map
    remove(key: K): void {
      this.cache.delete(key);
      this.expiryMap.delete(key);
    }
  
    // Clear the entire cache
    clear(): void {
      this.cache.clear();
      this.expiryMap.clear();
    }
  
    // Observable to watch for new set values
    watch(): Observable<{ key: K; value: V } | null> {
      return this.dataSubject.asObservable();
    }
}