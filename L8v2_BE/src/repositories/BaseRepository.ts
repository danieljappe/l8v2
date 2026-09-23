import { Repository, EntityTarget, FindOptionsWhere, ObjectLiteral, DeepPartial } from 'typeorm';
import { AppDataSource } from '../config/database';

export class BaseRepository<T extends ObjectLiteral> {
  protected repository: Repository<T>;

  constructor(entity: EntityTarget<T>) {
    this.repository = AppDataSource.getRepository(entity);
  }

  async findAll(): Promise<T[]> {
    return this.repository.find();
  }

  async findById(id: string): Promise<T | null> {
    return this.repository.findOneBy({ id } as unknown as FindOptionsWhere<T>);
  }

  async create(data: DeepPartial<T>): Promise<T> {
    // Deliberately unlogged: this is the create path for every entity, so
    // dumping `data` here wrote bcrypt hashes (UserService.createUser) and the
    // full text of contact-form submissions to the application log.
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async save(entity: T): Promise<T> {
    return this.repository.save(entity);
  }

  async update(id: string, data: DeepPartial<T>): Promise<T | null> {
    // TypeORM update() requires QueryDeepPartialEntity which differs from DeepPartial
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await this.repository.update(id, data as any);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
} 