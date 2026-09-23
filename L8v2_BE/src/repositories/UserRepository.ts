import { User } from '../models/User';
import { BaseRepository } from './BaseRepository';
import { FindOptionsWhere, DeepPartial } from 'typeorm';

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super(User);
  }

  /** Lookup without the hash — used for the duplicate-email check on create. */
  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOneBy({ email } as FindOptionsWhere<User>);
  }

  /**
   * Lookup including the hash, for credential verification only.
   * User.password is select: false, so it must be requested explicitly.
   */
  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.repository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  /** Lookup including the hash, for the change-password flow. */
  async findByIdWithPassword(id: string): Promise<User | null> {
    return this.repository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :id', { id })
      .getOne();
  }

  /**
   * Loads, merges the patch and saves — returns null when the user is absent.
   *
   * The row is loaded *with* the password even though callers never read it:
   * with select: false the loaded entity would carry password: undefined, and
   * saving that back would wipe the hash and lock the user out on any ordinary
   * profile update. The hash is stripped from the returned entity so it cannot
   * escape through the route's response.
   */
  async mergeAndSave(id: string, data: DeepPartial<User>): Promise<User | null> {
    const user = await this.findByIdWithPassword(id);
    if (!user) return null;
    this.repository.merge(user, data);
    const saved = await this.repository.save(user);
    return { ...saved, password: undefined } as unknown as User;
  }
}
