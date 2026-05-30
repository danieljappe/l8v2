import { DeepPartial } from 'typeorm';
import { User } from '../models/User';
import { UserRepository } from '../repositories/UserRepository';
import bcrypt from 'bcryptjs';

export type CreateUserResult =
  | { status: 'duplicate' }
  | { status: 'created'; user: User };

export type ChangePasswordResult =
  | { status: 'not_found' }
  | { status: 'wrong_password' }
  | { status: 'ok' };

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async getAllUsers(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  async getUserById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  /** Creates a user, rejecting a duplicate email. Password is hashed. */
  async createUser(userData: { firstName: string; lastName: string; email: string; password: string }): Promise<CreateUserResult> {
    const existing = await this.userRepository.findByEmail(userData.email);
    if (existing) return { status: 'duplicate' };

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = await this.userRepository.create({
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      password: hashedPassword,
    });
    return { status: 'created', user };
  }

  /** Merges updates into a user (hashing the password if present). Null if absent. */
  async updateUser(id: string, userData: Record<string, unknown>): Promise<User | null> {
    const updates = { ...userData };
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password as string, 10);
    }
    return this.userRepository.mergeAndSave(id, updates as DeepPartial<User>);
  }

  async deleteUser(id: string): Promise<boolean> {
    const user = await this.userRepository.findById(id);
    if (!user) return false;
    await this.userRepository.delete(id);
    return true;
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  /** Verifies the current password and sets a new (hashed) one. */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<ChangePasswordResult> {
    const user = await this.userRepository.findById(userId);
    if (!user) return { status: 'not_found' };

    const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentValid) return { status: 'wrong_password' };

    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);
    return { status: 'ok' };
  }
}
