import { TestBed } from '@angular/core/testing';
import { LocalDatePipe } from './local-date.pipe';
import { DateService } from '../../core/services/date.service';

describe('LocalDatePipe', () => {
  let pipe: LocalDatePipe;
  let dateService: DateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LocalDatePipe],
    });
    pipe = TestBed.inject(LocalDatePipe);
    dateService = TestBed.inject(DateService);
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  describe('transform', () => {
    it('should return empty string for null value', () => {
      expect(pipe.transform(null)).toBe('');
    });

    it('should return empty string for undefined value', () => {
      expect(pipe.transform(undefined)).toBe('');
    });

    it('should return empty string for empty string value', () => {
      expect(pipe.transform('')).toBe('');
    });

    it('should return a formatted string for a valid UTC timestamp', () => {
      const result = pipe.transform('2024-01-15T10:30:00Z');
      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should delegate to DateService.toLocalString with default "full" format', () => {
      const spy = vi.spyOn(dateService, 'toLocalString');
      pipe.transform('2024-01-15T10:30:00Z');
      expect(spy).toHaveBeenCalledWith('2024-01-15T10:30:00Z', 'full');
    });

    it('should delegate to DateService.toLocalString with "date" format', () => {
      const spy = vi.spyOn(dateService, 'toLocalString');
      pipe.transform('2024-01-15T10:30:00Z', 'date');
      expect(spy).toHaveBeenCalledWith('2024-01-15T10:30:00Z', 'date');
    });

    it('should delegate to DateService.toLocalString with "time" format', () => {
      const spy = vi.spyOn(dateService, 'toLocalString');
      pipe.transform('2024-01-15T10:30:00Z', 'time');
      expect(spy).toHaveBeenCalledWith('2024-01-15T10:30:00Z', 'time');
    });

    it('should produce different output for "date" vs "time" format', () => {
      const dateResult = pipe.transform('2024-01-15T10:30:00Z', 'date');
      const timeResult = pipe.transform('2024-01-15T10:30:00Z', 'time');
      expect(dateResult).not.toBe(timeResult);
    });
  });
});
