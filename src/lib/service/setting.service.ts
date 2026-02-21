import { Injectable, Injector, OnDestroy } from '@angular/core';
import { ObjectStorageService } from './object-storage-manager.service';
import { VFile } from '../model/vies.model';
import { MatDialog } from '@angular/material/dialog';
import { MatTheme } from '../model/theme.model';
import { AuthenticatorService } from './authenticator.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialog } from '../dialog/confirm-dialog/confirm-dialog.component';
import { PopupArgs, PopupType } from '../model/popup.model';
import { RxJSUtils } from '../util/RxJS.utils';
import { DataUtils } from '../util/Data.utils';
import { FileUtils } from '../util/File.utils';
import { StringUtils } from '../util/String.utils';
import { Subject } from 'rxjs';
import { Router } from '@angular/router';
import { ViesService } from './rest.service';
import { environment } from '../../environments/environment.prod';
import DynamicJsonObject from '../model/dynamic-json-object.model';

/**
 * Configuration options for SettingService
 * Allows customization for reusability across different projects
 */
export interface SettingServiceConfig {
  /** The filename for storing settings (default: 'generalSetting.json') */
  settingFileName?: string;
  /** Whether to auto-sync settings from server on login (default: true) */
  autoSyncOnLogin?: boolean;
  /** Whether to show prompt when user is logged out due to timeout (default: true) */
  promptOnTimeoutLogout?: boolean;
  /** Enable debug logging (default: false) */
  debugMode?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SettingService implements OnDestroy {
  // Configuration
  protected GENERAL_SETTING_KEY = 'generalSetting.json';
  protected config: Required<SettingServiceConfig> = {
    settingFileName: 'generalSetting.json',
    autoSyncOnLogin: true,
    promptOnTimeoutLogout: true,
    debugMode: false
  };

  // Setting paths - can be extended/overridden by child classes
  DEFAULT_GENERAL_SETTING_PATHS = {
    initalDisplayDrawer: ['general', 'initalDisplayDrawer'],
    displayDrawer: ['general', 'displayDrawer'],
    initalDisplayHeader: ['general', 'initalDisplayHeader'],
    displayHeader: ['general', 'displayHeader'],
    initalAutoFetchGeneralSetting: ['general', 'initalAutoFetchGeneralSetting'],
    promptLoginWhenTimeoutLogout: ['general', 'promptLoginWhenTimeoutLogout'],
    backgroundImageUrl: ['general', 'backgroundImageUrl'],
    theme: ['general', 'theme']
  };

  applicationSetting: DynamicJsonObject = new DynamicJsonObject();

  protected matThemes = DataUtils.getEnumValues(MatTheme) as string[];
  protected authenticatorService: AuthenticatorService | undefined;

  protected onLoginSubscription: any = null;
  protected onTimeoutLogoutSubscription: any = null;

  protected onGeneralSettingChangeSubject = new Subject<void>();
  onGeneralSettingChange = this.onGeneralSettingChangeSubject.asObservable();

  prefix = '';
  currentMenu = "main";
  apiGatewayUrl: string = ViesService.getGatewayApi();
  matThemeOptions = DataUtils.getEnumMatOptions(MatTheme);

  constructor(
    protected objectStorageService: ObjectStorageService,
    protected matDialog: MatDialog,
    protected snackBar: MatSnackBar,
    protected router: Router,
    protected injector: Injector
  ) { }

  /**
   * Configure the service with custom options
   * Should be called before init() if customization is needed
   */
  configure(config: SettingServiceConfig): void {
    this.config = { ...this.config, ...config };
    this.GENERAL_SETTING_KEY = this.config.settingFileName;

    if (this.config.debugMode) {
      console.log('[SettingService] Configured with options:', this.config);
    }
  }

  /**
   * Log debug messages if debug mode is enabled
   */
  protected log(...args: any[]): void {
    if (this.config.debugMode) {
      console.log('[SettingService]', ...args);
    }
  }

  /**
   * Log error messages
   */
  protected logError(...args: any[]): void {
    console.error('[SettingService]', ...args);
  }

  /**
   * Log warning messages
   */
  protected logWarn(...args: any[]): void {
    console.warn('[SettingService]', ...args);
  }

  /**
   * Detect and fix double (or triple, etc.) encoded JSON
   * Returns the properly decoded JSON string
   */
  protected fixDoubleEncodedJson(jsonString: string): string {
    let fixed = jsonString;
    let iterations = 0;
    const maxIterations = 5; // Prevent infinite loops

    try {
      while (iterations < maxIterations) {
        const parsed = JSON.parse(fixed);

        // If the parsed result is a string, it was double-encoded
        if (typeof parsed === 'string') {
          this.logWarn(`Detected ${iterations + 1}x encoded JSON, fixing...`);
          fixed = parsed;
          iterations++;
        } else {
          // Successfully parsed to an object, stop
          if (iterations > 0) {
            this.log(`Fixed ${iterations}x encoded JSON successfully`);
            // Return the corrected JSON string
            fixed = JSON.stringify(parsed);
          }
          break;
        }
      }

      if (iterations >= maxIterations) {
        this.logWarn('Stopped decoding after', maxIterations, 'iterations');
      }
    } catch (e) {
      this.logWarn('Error while fixing double-encoded JSON:', e);
      return jsonString; // Return original if fix fails
    }

    return fixed;
  }

  /**
   * Initialize the settings service
   * Loads settings from localStorage and subscribes to auth events
   */
  init(): void {
    this.prefix = environment.name;
    this.authenticatorService = this.injector.get(AuthenticatorService);

    this.log('Initializing with prefix:', this.prefix);

    if (this.config.autoSyncOnLogin) {
      this.subscribeToSubject();
    }

    // Get the raw JSON string from localStorage (not parsed)
    let settingJson = FileUtils.localStorageGetRawString(this.GENERAL_SETTING_KEY);

    if (settingJson) {
      this.log('Found settings in localStorage, length:', settingJson.length);

      // Try to detect and fix double-encoded JSON
      settingJson = this.fixDoubleEncodedJson(settingJson);

      const success = this.applicationSetting.fromJson(settingJson);
      if (!success) {
        this.logWarn('Failed to parse settings from localStorage, using defaults');
      } else {
        this.log('Successfully loaded settings:', this.applicationSetting.toObject());
      }
    } else {
      this.log('No settings found in localStorage, using defaults');
    }

    this.applySetting();
    this.onGeneralSettingChangeSubject.next();
  }

  /**
   * Subscribe to authentication events
   */
  private subscribeToSubject(): void {
    this.unsubscribeToSubject();

    if (!this.authenticatorService) {
      this.logWarn('AuthenticatorService not available, skipping event subscriptions');
      return;
    }

    // Subscribe to login events to sync settings from server
    if (this.onLoginSubscription == null && this.config.autoSyncOnLogin) {
      this.onLoginSubscription = this.authenticatorService.onLogin(() => {
        this.log('User logged in, syncing settings from server');
        this.syncFromServer(this.prefix);
      });
    }

    // Subscribe to timeout logout events
    if (this.onTimeoutLogoutSubscription == null && this.config.promptOnTimeoutLogout) {
      this.onTimeoutLogoutSubscription = this.authenticatorService.onTimeoutLogout(() => {
        const shouldPrompt = this.applicationSetting.get<boolean>(
          'primitive',
          ...this.DEFAULT_GENERAL_SETTING_PATHS.promptLoginWhenTimeoutLogout
        );

        if (shouldPrompt) {
          this.log('Session timeout, prompting for re-login');
          this.promptLoginWhenTimeoutLogout();
        }
      });
    }
  }

  /**
   * Unsubscribe from all authentication event subscriptions
   */
  unsubscribeToSubject(): void {
    if (this.onLoginSubscription) {
      this.onLoginSubscription.unsubscribe();
      this.onLoginSubscription = null;
    }
    if (this.onTimeoutLogoutSubscription) {
      this.onTimeoutLogoutSubscription.unsubscribe();
      this.onTimeoutLogoutSubscription = null;
    }
  }

  /**
   * Angular lifecycle hook - cleanup when service is destroyed
   */
  ngOnDestroy(): void {
    this.log('Destroying SettingService, cleaning up...');
    this.unsubscribeToSubject();
    this.onGeneralSettingChangeSubject.complete();
    // Dispose of the DynamicJsonObject to clean up its reactive bindings
    this.applicationSetting.dispose();
  }

  /**
   * Sync settings from the server
   * @param prefix The prefix to use for the file path (usually environment name)
   */
  syncFromServer(prefix: string): void {
    const filePath = `${prefix}/${this.GENERAL_SETTING_KEY}`;
    this.log('Syncing settings from server:', filePath);

    this.objectStorageService.getFileByFileName(filePath)
      .pipe(RxJSUtils.waitLoadingDynamicStringSnackBar(
        this.snackBar,
        `Loading ${filePath}`,
        40,
        'Dismiss',
        10
      ))
      .subscribe({
        next: (blob) => {
          StringUtils.readBlobAsText(blob).then((jsonString) => {
            this.log('Received settings from server, length:', jsonString.length);
            this.log('First 200 chars:', jsonString.substring(0, 200));

            // Try to detect and fix double-encoded JSON
            const fixedJson = this.fixDoubleEncodedJson(jsonString);

            // Try to parse the JSON string
            const success = this.applicationSetting.fromJson(fixedJson);

            if (success) {
              this.log('Successfully parsed settings from server');
              this.saveSettingLocally(this.applicationSetting);
              this.applySetting();
              this.onGeneralSettingChangeSubject.next();

              // If we had to fix double-encoding, re-save to server with correct encoding
              if (fixedJson !== jsonString) {
                this.log('Re-saving fixed settings to server...');
                this.saveSettingToServer(prefix, this.applicationSetting);
              }
            } else {
              this.logError('Failed to parse settings from server even after fixes');
            }
          }).catch((error) => {
            this.logError('Failed to read blob as text:', error);
          });
        },
        error: (error) => {
          this.logWarn('Failed to load settings from server:', error);

          // Check if we have local settings to fall back on
          const localSettings = FileUtils.localStorageGetRawString(this.GENERAL_SETTING_KEY);
          if (!localSettings) {
            this.log('No local settings available, using defaults');
            this.applySetting();
          } else {
            this.log('Using cached local settings');
          }
        }
      });
  }

  /**
   * Get the current theme setting
   * @returns The current theme or default theme if not set
   */
  getCurrentTheme(): MatTheme {
    const theme = this.applicationSetting.get<MatTheme>('anything', ...this.DEFAULT_GENERAL_SETTING_PATHS.theme);
    return theme ?? MatTheme.IndigoPinkLight;
  }

  /**
   * Apply all settings (currently just theme)
   */
  applySetting(): void {
    const currentTheme = this.getCurrentTheme();
    this.log('Applying settings, theme:', currentTheme);
    this.changeTheme(currentTheme);
  }

  /**
   * Save settings to localStorage
   * @param applicationSetting The settings to save (defaults to current settings)
   */
  saveSettingLocally(applicationSetting?: DynamicJsonObject): void {
    if (!applicationSetting) {
      applicationSetting = this.applicationSetting;
    }

    // Store the JSON string directly without double-encoding
    const jsonString = applicationSetting.toJson();
    this.log('Saving settings to localStorage, size:', jsonString.length, 'bytes');

    FileUtils.localStorageSetRawString(this.GENERAL_SETTING_KEY, jsonString);

    // Update the current instance with the saved data
    if (applicationSetting !== this.applicationSetting) {
      this.applicationSetting.fromJson(jsonString);
    }

    this.log('Settings saved to localStorage successfully');
  }

  /**
   * Save settings to the server
   * @param prefix The prefix to use for the file path (usually environment name)
   * @param applicationSetting The settings to save (defaults to current settings)
   */
  saveSettingToServer(prefix: string, applicationSetting?: DynamicJsonObject): void {
    if (!applicationSetting) {
      applicationSetting = this.applicationSetting;
    }

    // Save locally first
    this.saveSettingLocally(applicationSetting);

    // Get the JSON string (already stringified, don't double-encode!)
    const jsonString = applicationSetting.toJson();
    this.log('Saving settings to server, path:', `${prefix}/${this.GENERAL_SETTING_KEY}`);
    this.log('JSON string length:', jsonString.length, 'bytes');
    this.log('JSON content (first 200 chars):', jsonString.substring(0, 200));

    // Create the blob with the JSON string
    const blob = new Blob([jsonString], { type: 'application/json' });

    const vFile: VFile = {
      name: `${prefix}/${this.GENERAL_SETTING_KEY}`,
      type: 'application/json',
      extension: 'json',
      rawFile: blob,
      objectUrl: '' // objectUrl should be a browser URL, not file contents
    };

    this.objectStorageService.postOrPutFile(vFile, { type: PopupType.LOADING_DIALOG })
      .then((_data) => {
        this.log('Settings saved to server successfully');
      })
      .catch((error) => {
        this.logError('Failed to save settings to server:', error);
        window.alert(`Failed to save settings: ${error}`);
      });
  }

  /**
   * Change the application theme
   * @param matTheme The theme to apply
   */
  changeTheme(matTheme: MatTheme): void {
    if (ViesService.isNotCSR()) {
      this.log('Skipping theme change (not in browser)');
      return;
    }

    if (!matTheme) {
      this.logWarn('No theme provided, using default');
      matTheme = MatTheme.IndigoPinkLight;
    }

    this.log('Changing theme to:', matTheme);

    // Remove any previous theme class from the body
    document.body.classList.remove(...this.matThemes);

    // Add the selected theme class
    document.body.classList.add(matTheme);

    this.log('Theme applied successfully');
  }

  /**
   * Apply the current theme from settings
   */
  changeToCurrentTheme(): void {
    const theme = this.getCurrentTheme();
    this.changeTheme(theme);
  }

  promptLoginWhenTimeoutLogout() {
    let dialog = this.matDialog.open(ConfirmDialog, {
      data: {
        title: 'Login?',
        message: 'You have been logged out due to inactivity.\nDo you want to login again?',
        yes: 'Login',
        no: 'Cancel'
      },
      width: '100%'
    })

    dialog.afterClosed().subscribe({
      next: res => {
        if(res) {
          this.router.navigate([environment.endpoint_login])
        }
      }
    })
  }

  getCurrentThemeTextColor(): string {
    let theme = this.getCurrentTheme();
    if(theme.toLowerCase().includes('light'))
      return 'black';
    else
      return 'white';
  }

  loadBackgroundImage(url: string, popupArgs?: PopupArgs): void {
    this.log('Loading background image from:', url);

    this.objectStorageService.fetchFileAndGenerateObjectUrl(url, popupArgs)
      .then((objectUrl) => {
        this.applicationSetting.set(objectUrl, ...this.DEFAULT_GENERAL_SETTING_PATHS.backgroundImageUrl);
        this.log('Background image loaded successfully');
      })
      .catch((error) => {
        this.logError('Failed to load background image:', error);
      });
  }

  /**
   * Get a setting value by path
   * @param path The path to the setting
   * @returns The setting value or undefined
   */
  getSetting<T = any>(...path: (string | number)[]): T | undefined {
    return this.applicationSetting.get<T>('anything', ...path);
  }

  /**
   * Set a setting value by path
   * @param value The value to set
   * @param path The path to the setting
   * @param saveLocally Whether to save to localStorage immediately (default: true)
   */
  setSetting(value: any, path: (string | number)[], saveLocally: boolean = true): void {
    this.applicationSetting.set(value, ...path);
    if (saveLocally) {
      this.saveSettingLocally();
    }
    this.onGeneralSettingChangeSubject.next();
  }

  /**
   * Update theme setting and apply it
   * @param theme The theme to set
   * @param save Whether to save the setting (default: true)
   */
  updateTheme(theme: MatTheme, save: boolean = true): void {
    this.log('Updating theme to:', theme);
    this.applicationSetting.set(theme, ...this.DEFAULT_GENERAL_SETTING_PATHS.theme);
    this.changeTheme(theme);

    if (save) {
      this.saveSettingLocally();
    }

    this.onGeneralSettingChangeSubject.next();
  }

  /**
   * Reset settings to defaults
   * @param saveLocally Whether to save after reset (default: false)
   */
  resetSettings(saveLocally: boolean = false): void {
    this.log('Resetting settings to defaults');
    this.applicationSetting.clear();
    this.applySetting();

    if (saveLocally) {
      this.saveSettingLocally();
    }

    this.onGeneralSettingChangeSubject.next();
  }

  /**
   * Get all settings as a plain object
   */
  getAllSettings(): any {
    return this.applicationSetting.toObject();
  }

  /**
   * Import settings from a plain object
   * @param settings The settings object to import
   * @param saveLocally Whether to save after import (default: true)
   */
  importSettings(settings: any, saveLocally: boolean = true): void {
    this.log('Importing settings');
    this.applicationSetting.fromObject(settings);
    this.applySetting();

    if (saveLocally) {
      this.saveSettingLocally();
    }

    this.onGeneralSettingChangeSubject.next();
  }

  /**
   * Clear all settings from localStorage and reset to defaults
   * Useful for fixing corrupted data
   */
  clearLocalSettings(): void {
    this.log('Clearing local settings');
    FileUtils.localStorageRemoveItem(this.GENERAL_SETTING_KEY);
    this.resetSettings(false);
  }

  /**
   * Fix corrupted settings in localStorage
   * Detects and fixes double-encoded JSON data
   * @returns true if settings were fixed, false otherwise
   */
  fixCorruptedLocalSettings(): boolean {
    this.log('Attempting to fix corrupted local settings');

    const settingJson = FileUtils.localStorageGetRawString(this.GENERAL_SETTING_KEY);
    if (!settingJson) {
      this.log('No local settings to fix');
      return false;
    }

    const fixedJson = this.fixDoubleEncodedJson(settingJson);

    if (fixedJson !== settingJson) {
      this.log('Settings were corrupted, saving fixed version');
      FileUtils.localStorageSetRawString(this.GENERAL_SETTING_KEY, fixedJson);
      this.applicationSetting.fromJson(fixedJson);
      this.applySetting();
      this.onGeneralSettingChangeSubject.next();
      return true;
    } else {
      this.log('Settings were not corrupted');
      return false;
    }
  }
}
