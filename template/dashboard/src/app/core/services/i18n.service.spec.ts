import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { I18nService } from './i18n.service';

describe('I18nService', () => {
  let service: I18nService;
  let translateServiceMock: {
    use: ReturnType<typeof vi.fn>;
    getCurrentLang: ReturnType<typeof vi.fn>;
  };

  function createService(options?: { savedLang?: string | null; browserLang?: string }): void {
    if (options?.savedLang !== undefined) {
      if (options.savedLang === null) {
        localStorage.removeItem('app_language');
      } else {
        localStorage.setItem('app_language', options.savedLang);
      }
    } else {
      localStorage.removeItem('app_language');
    }

    if (options?.browserLang) {
      vi.spyOn(navigator, 'language', 'get').mockReturnValue(options.browserLang);
    }

    TestBed.configureTestingModule({
      providers: [
        I18nService,
        {
          provide: TranslateService,
          useValue: translateServiceMock,
        },
      ],
    });

    service = TestBed.inject(I18nService);
  }

  beforeEach(() => {
    translateServiceMock = {
      use: vi.fn(),
      getCurrentLang: vi.fn().mockReturnValue('en'),
    };
    localStorage.clear();
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('en-US');
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should use saved language from localStorage if supported', () => {
      createService({ savedLang: 'es' });

      expect(translateServiceMock.use).toHaveBeenCalledWith('es');
    });

    it('should ignore saved language if not supported and detect browser language', () => {
      createService({ savedLang: 'fr', browserLang: 'es' });

      expect(translateServiceMock.use).toHaveBeenCalledWith('es');
    });

    it('should detect browser language when no saved preference exists', () => {
      createService({ savedLang: null, browserLang: 'es-AR' });

      expect(translateServiceMock.use).toHaveBeenCalledWith('es');
    });

    it('should fallback to default language when browser language is unsupported', () => {
      createService({ savedLang: null, browserLang: 'fr-FR' });

      expect(translateServiceMock.use).toHaveBeenCalledWith('en');
    });

    it('should persist detected browser language to localStorage', () => {
      createService({ savedLang: null, browserLang: 'es' });

      expect(localStorage.getItem('app_language')).toBe('es');
    });

    it('should persist default language when browser language is unsupported', () => {
      createService({ savedLang: null, browserLang: 'de' });

      expect(localStorage.getItem('app_language')).toBe('en');
    });

    it('should not overwrite localStorage when using saved preference', () => {
      createService({ savedLang: 'es' });

      expect(localStorage.getItem('app_language')).toBe('es');
      expect(translateServiceMock.use).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCurrentLanguage', () => {
    it('should return the current language from TranslateService', () => {
      translateServiceMock.getCurrentLang.mockReturnValue('es');
      createService({ savedLang: 'es' });

      expect(service.getCurrentLanguage()).toBe('es');
    });

    it('should return default language when TranslateService has no current language', () => {
      translateServiceMock.getCurrentLang.mockReturnValue(null);
      createService({ savedLang: null, browserLang: 'en' });

      expect(service.getCurrentLanguage()).toBe('en');
    });
  });

  describe('setLanguage', () => {
    beforeEach(() => {
      createService({ savedLang: 'en', browserLang: 'en' });
      translateServiceMock.use.mockClear();
    });

    it('should switch to a supported language', () => {
      service.setLanguage('es');

      expect(translateServiceMock.use).toHaveBeenCalledWith('es');
      expect(localStorage.getItem('app_language')).toBe('es');
    });

    it('should fallback to default language when unsupported language is provided', () => {
      service.setLanguage('fr');

      expect(translateServiceMock.use).toHaveBeenCalledWith('en');
      expect(localStorage.getItem('app_language')).toBe('en');
    });

    it('should persist the language preference to localStorage', () => {
      service.setLanguage('es');

      expect(localStorage.getItem('app_language')).toBe('es');
    });
  });

  describe('getSupportedLanguages', () => {
    it('should return the supported languages from environment config', () => {
      createService({ savedLang: 'en', browserLang: 'en' });

      expect(service.getSupportedLanguages()).toEqual(['en', 'es']);
    });
  });
});
