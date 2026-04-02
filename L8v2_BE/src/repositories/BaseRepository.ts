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
    console.log('BaseRepository: Creating entity with data:', data);
    const entity = this.repository.create(data);
    console.log('BaseRepository: Created entity:', entity);
    return this.repository.save(entity);
  }

  async save(entity: T): Promise<T> {
    return this.repository.save(entity);
  }

  async update(id: string, data: DeepPartial<T>): Promise<T | null> {
    await this.repository.update(id, data as any);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
} 