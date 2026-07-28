import { Pipe, PipeTransform, inject } from '@angular/core';
import { DateService } from '../../core/services/date.service';

/**
 * Pipe that transforms a UTC ISO 8601 string into a localized date/time string
 * using the user's local timezone.
 *
 * Usage:
 *   {{ timestamp | localDate }}          → full date-time
 *   {{ timestamp | localDate:'date' }}   → date only
 *   {{ timestamp | localDate:'time' }}   → time only
 */
@Pipe({
  name: 'localDate',
  standalone: true,
})
export class LocalDatePipe implements PipeTransform {
  private readonly dateService = inject(DateService);

  transform(value: string | null | undefined, format: 'full' | 'date' | 'time' = 'full'): string {
    if (!value) {
      return '';
    }

    return this.dateService.toLocalString(value, format);
  }
}
