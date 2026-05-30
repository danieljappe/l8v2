import { User } from '../models/User';
import { BaseRepository } from './BaseRepository';
import { FindOptionsWhere, DeepPartial } from 'typeorm';

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super(User);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOneBy({ email } as FindOptionsWhere<User>);
  }

  /** Loads, merges the patch and saves — returns null when the user is absent. */
  async mergeAndSave(id: string, data: DeepPartial<User>): Promise<User | null> {
    const user = await this.repository.findOne({ where: { id } });
    if (!user) return null;
    this.repository.merge(user, data);
    return this.repository.save(user);
  }
} 