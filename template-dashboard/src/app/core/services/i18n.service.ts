import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../../../environments/environment';

const STORAGE_KEY = 'app_language';

/**
 * Service responsible for internationalization management.
 * Handles language detection, persistence, and runtime switching
 * without requiring a page reload.
 */
@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly translateService = inject(TranslateService);

  constructor() {
    this.initializeLanguage();
  }

  /**
   * Returns the currently active language code.
   */
  getCurrentLanguage(): string {
    return this.translateService.getCurrentLang() || environment.defaultLanguage;
  }

  /**
   * Changes the active language, updates the translation service,
   * and persists the preference to localStorage.
   * If the language is not supported, falls back to the default language.
   */
  setLanguage(lang: string): void {
    const resolvedLang = this.isSupported(lang) ? lang : environment.defaultLanguage;
    this.translateService.use(resolvedLang);
    this.persistLanguage(resolvedLang);
  }

  /**
   * Returns the list of supported language codes from environment config.
   */
  getSupportedLanguages(): string[] {
    return environment.supportedLanguages;
  }

  private initializeLanguage(): void {
    const savedLang = this.getSavedLanguage();

    if (savedLang && this.isSupported(savedLang)) {
      this.translateService.use(savedLang);
      return;
    }

    const browserLang = this.detectBrowserLanguage();

    if (this.isSupported(browserLang)) {
      this.translateService.use(browserLang);
      this.persistLanguage(browserLang);
      return;
    }

    this.translateService.use(environment.defaultLanguage);
    this.persistLanguage(environment.defaultLanguage);
  }

  private detectBrowserLanguage(): string {
    const navigatorLang = navigator?.language ?? '';
    return navigatorLang.substring(0, 2).toLowerCase();
  }

  private isSupported(lang: string): boolean {
    return environment.supportedLanguages.includes(lang);
  }

  private getSavedLanguage(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  private persistLanguage(lang: string): void {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // localStorage unavailable (e.g., private browsing); ignore silently
    }
  }
}
