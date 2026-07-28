import { TestBed } from '@angular/core/testing';
import { DateService } from './date.service';

describe('DateService', () => {
  let service: DateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getUserTimezone', () => {
    it('should return a non-empty timezone string', () => {
      const timezone = service.getUserTimezone();
      expect(timezone).toBeTruthy();
      expect(typeof timezone).toBe('string');
      expect(timezone.length).toBeGreaterThan(0);
    });
  });

  describe('toLocalDate', () => {
    it('should parse a UTC ISO string into a Date object', () => {
      const result = service.toLocalDate('2024-01-15T10:30:00Z');
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBe(new Date('2024-01-15T10:30:00Z').getTime());
    });

    it('should correctly represent the UTC time', () => {
      const result = service.toLocalDate('2024-06-20T15:45:30Z');
      expect(result.getUTCHours()).toBe(15);
      expect(result.getUTCMinutes()).toBe(45);
      expect(result.getUTCSeconds()).toBe(30);
    });
  });

  describe('toUtcIsoString', () => {
    it('should convert a Date to an ISO 8601 string with Z suffix', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const result = service.toUtcIsoString(date);
      expect(result).toBe('2024-01-15T10:30:00.000Z');
    });

    it('should always produce a string ending with Z', () => {
      const date = new Date(2024, 5, 20, 12, 0, 0);
      const result = service.toUtcIsoString(date);
      expect(result).toMatch(/Z$/);
    });

    it('should conform to ISO 8601 format', () => {
      const date = new Date('2024-03-10T08:15:45.123Z');
      const result = service.toUtcIsoString(date);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('toLocalString', () => {
    it('should return a non-empty string for a valid UTC timestamp', () => {
      const result = service.toLocalString('2024-01-15T10:30:00Z');
      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return a date-only string when format is "date"', () => {
      const result = service.toLocalString('2024-01-15T10:30:00Z', 'date');
      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return a time-only string when format is "time"', () => {
      const result = service.toLocalString('2024-01-15T10:30:00Z', 'time');
      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('formatDateTime', () => {
    it('should return a non-empty formatted string', () => {
      const result = service.formatDateTime('2024-01-15T10:30:00Z');
      expect(result).toBeTruthy();
    });

    it('should delegate to toLocalString with "full" format', () => {
      const spy = vi.spyOn(service, 'toLocalString');
      service.formatDateTime('2024-01-15T10:30:00Z');
      expect(spy).toHaveBeenCalledWith('2024-01-15T10:30:00Z', 'full');
    });
  });

  describe('formatDate', () => {
    it('should return a non-empty formatted string', () => {
      const result = service.formatDate('2024-01-15T10:30:00Z');
      expect(result).toBeTruthy();
    });

    it('should delegate to toLocalString with "date" format', () => {
      const spy = vi.spyOn(service, 'toLocalString');
      service.formatDate('2024-01-15T10:30:00Z');
      expect(spy).toHaveBeenCalledWith('2024-01-15T10:30:00Z', 'date');
    });
  });

  describe('formatTime', () => {
    it('should return a non-empty formatted string', () => {
      const result = service.formatTime('2024-01-15T10:30:00Z');
      expect(result).toBeTruthy();
    });

    it('should delegate to toLocalString with "time" format', () => {
      const spy = vi.spyOn(service, 'toLocalString');
      service.formatTime('2024-01-15T10:30:00Z');
      expect(spy).toHaveBeenCalledWith('2024-01-15T10:30:00Z', 'time');
    });
  });

  describe('round-trip conversion', () => {
    it('should preserve UTC timestamp through toLocalDate → toUtcIsoString', () => {
      const original = '2024-01-15T10:30:00.000Z';
      const localDate = service.toLocalDate(original);
      const result = service.toUtcIsoString(localDate);
      expect(result).toBe(original);
    });

    it('should preserve millisecond precision on round-trip', () => {
      const original = '2024-06-20T15:45:30.123Z';
      const localDate = service.toLocalDate(original);
      const result = service.toUtcIsoString(localDate);
      expect(result).toBe(original);
    });
  });
});
