import { Injectable } from '@nestjs/common';
import { PasswordHasher } from '../../application/ports/password-hasher.port.js';
import { hashPassword, verifyPassword } from '../../../../common/utils/password.util.js';

@Injectable()
export class ScryptPasswordHasher implements PasswordHasher {
  hash(plain: string): Promise<string> {
    return hashPassword(plain);
  }

  verify(plain: string, hash: string): Promise<boolean> {
    return verifyPassword(plain, hash);
  }
}
