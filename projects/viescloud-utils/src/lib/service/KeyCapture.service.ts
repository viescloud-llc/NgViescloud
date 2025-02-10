import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface KeyCaptureEvent {
  key: string;
  isCombination: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class KeyCaptureService {
  private keyQueue: { key: string; timestamp: number; isCombination: boolean }[] = [];
  private expiryTime = 5000; // Default expiry time (5 seconds)
  private keySubject = new Subject<KeyCaptureEvent>();
  private captureEnabled = true; // Safety lock to enable/disable key capturing

  // Observable for key events
  keyEvents$ = this.keySubject.asObservable();

  // Enable key capturing
  enableCapture() {
    this.captureEnabled = true;
  }

  // Disable key capturing
  disableCapture() {
    this.captureEnabled = false;
  }

  // Method to add key press
  captureKey(event: KeyboardEvent) {
    if (!this.captureEnabled) {
      // If capturing is disabled, ignore the key
      return;
    }

    const isCombination = event.ctrlKey || event.shiftKey || event.altKey || event.metaKey;
    const key = this.buildKey(event);

    // Add to the queue
    this.keyQueue.push({ key, timestamp: Date.now(), isCombination });

    // Emit the key event for subscribers
    this.keySubject.next({ key, isCombination });

    // Schedule key removal after expiry time
    setTimeout(() => this.removeExpiredKeys(), this.expiryTime);
  }

  // Build the key string to handle combination or single key
  private buildKey(event: KeyboardEvent): string {
    let keyCombination = '';

    if (event.ctrlKey) keyCombination += 'Ctrl + ';
    if (event.shiftKey) keyCombination += 'Shift + ';
    if (event.altKey) keyCombination += 'Alt + ';
    if (event.metaKey) keyCombination += 'Meta + ';

    return keyCombination + event.key;
  }

  // Remove expired keys
  private removeExpiredKeys() {
    const currentTime = Date.now();
    this.keyQueue = this.keyQueue.filter((entry) => currentTime - entry.timestamp < this.expiryTime);
  }

  // Get the current keys in the queue (can be used to verify what keys are being held)
  getCapturedKeys() {
    this.removeExpiredKeys();
    return this.keyQueue;
  }

  // Optional method to set a custom expiry time
  setExpiryTime(milliseconds: number) {
    this.expiryTime = milliseconds;
  }

  static isKeyCombination(event: KeyCaptureEvent, keys: string[]): boolean {
    if(!event.isCombination) {
      return false;
    }

    let eventKeys = event.key.split("+").map(e => e.trim());
    return JSON.stringify(eventKeys) === JSON.stringify(keys);
  }

  static isKeyCombinationIgnoreCase(event: KeyCaptureEvent, keys: string[]): boolean {
    if(!event.isCombination) {
      return false;
    }
    
    let lowserCaseKeys = [...keys.map(e => e.toLowerCase())];
    let eventKeys = event.key.split("+").map(e => e.trim().toLowerCase());
    return JSON.stringify(eventKeys) === JSON.stringify(lowserCaseKeys);
  }
}
