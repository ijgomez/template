import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';
/**
 * 
 *    var encrypted = this.crytoService.encrypt('123456$#@$^@1ERF', 'password@123456');
 *   var decrypted = this.crytoService.decrypt('123456$#@$^@1ERF', encrypted);
 *  
 *   console.log('Encrypted : password@123456 => ' + encrypted);
 *   console.log('Encrypted :' + encrypted + ' => ' + decrypted);
 *
 *
 */
@Injectable({
  providedIn: 'root'
})
export class CrytoService {

  constructor() { }

  /**
   * Use for encrypt the value
   * @param keys 
   * @param value 
   * @returns 
   */
  encrypt(keys:string, value:string): string {
    var key = CryptoJS.enc.Utf8.parse(keys);
    var iv = CryptoJS.enc.Utf8.parse(keys);
    var encrypted = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(value), key, {
        keySize: 128 / 8,
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

    return encrypted.toString();
  }

  /**
   * Use for decrypt the value.
   * @param keys 
   * @param value 
   * @returns 
   */
  decrypt(keys:string, value:string): string {
    var key = CryptoJS.enc.Utf8.parse(keys);
    var iv = CryptoJS.enc.Utf8.parse(keys);
    var decrypted = CryptoJS.AES.decrypt(value, key, {
        keySize: 128 / 8,
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

    return decrypted.toString(CryptoJS.enc.Utf8);
  }
}
