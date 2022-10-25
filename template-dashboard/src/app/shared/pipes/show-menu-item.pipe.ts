import { Pipe, PipeTransform } from '@angular/core';
import { AuthService } from '../../core/services/security/auth.service';

@Pipe({
  name: 'showMenuItem'
})
export class ShowMenuItemPipe implements PipeTransform {

  constructor(private authService: AuthService) { }

  transform(menuItemName: string): boolean {

    console.log('Menu Item Name: ' + menuItemName + ', hasInRole: ' + this.authService.hasInRole(menuItemName) );

    return true;
  }

}
