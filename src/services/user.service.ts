import { Injectable } from '@nestjs/common';
import { User } from '@schemas/user.schema';
import { UserRepository } from '@repositories/user.repository';
import { UserCreateDto } from '@dtos/user.create.dto';
import { hash, compare } from '@helpers/hash';
import { UserGetUserWithRptDto } from '@dtos/user.get_w_token.dto';
import { UserUpdateProfileDto } from '@dtos/user.update_profile.dto';
import { UserChangePasswordDto } from '@dtos/user.change_password';
import { UserLoginDto } from '@dtos/user.login.dto';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async createUser(args: UserCreateDto): Promise<User> {
    if (args.password) args.password = await hash(args.password);
    return await this.userRepository.createUser(args);
  }

  async getUserWithEmail(email: string): Promise<User> {
    return await this.userRepository.getUserWithEmail(email);
  }

  async getUserWithId(id: string): Promise<User> {
    return await this.userRepository.getUserWithId(id);
  }

  async getUserWithRpt(args: UserGetUserWithRptDto): Promise<User> {
    return await this.userRepository.getUserWithRpt(args);
  }

  async updateUserProfileId(args: UserUpdateProfileDto): Promise<User> {
    //implement check profile
    return await this.updateUserProfileId(args);
  }

  async updateResetPasswordToken(email: string): Promise<{ rptExpires: Date }> {
    const resetPasswordToken = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    const rptExpires = new Date(Date.now() + 86400000);
    const args = {
      email,
      resetPasswordToken,
      rptExpires,
    };
    const user = await this.userRepository.updateResetPasswordToken(args);
    if (user) return { rptExpires };
  }

  async updatePassword(args: {
    password: string;
    userId: string;
  }): Promise<User> {
    args.password = await hash(args.password);
    return await this.userRepository.updatePassword(args);
  }

  async comparePassword({ email, password }: UserLoginDto): Promise<boolean> {
    const user = await this.userRepository.getUserWithEmail(email);
    return await compare(password, user.password);
  }
}
