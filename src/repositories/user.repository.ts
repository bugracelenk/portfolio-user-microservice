import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '@schemas/user.schema';
import { IUserCreateDto, UserCreateDto } from '@dtos/user.create.dto';
import { UserUpdateProfileDto } from '@dtos/user.update_profile.dto';
import { UserChangePasswordDto } from '@dtos/user.change_password';
import { UserUpdateResetTokenDto } from '@dtos/user.reset_password.dto';
import { UserGetUserWithRptDto } from '@dtos/user.get_w_token.dto';
import { UserGoogleLoginDto } from '@dtos/user.google_login.dto';

@Injectable()
export class UserRepository {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async createUser(args: IUserCreateDto): Promise<User> {
    return await this.userModel.create(args);
  }

  async getUserWithEmail(email: string): Promise<User> {
    return await this.userModel
      .findOne({ email })
      .select('googleAccessToken email id password profileId')
      .exec();
  }

  async getUserWithId(id: string): Promise<User> {
    return await this.userModel.findById(id).select('email username');
  }

  async getUserWithRpt({ email, resetPasswordToken }: UserGetUserWithRptDto) {
    return await this.userModel
      .findOne({ email, resetPasswordToken })
      .select('id')
      .exec();
  }

  async updateUserProfileId({
    userId,
    profileId,
  }: UserUpdateProfileDto): Promise<User> {
    return await this.userModel
      .findByIdAndUpdate(
        userId,
        { $set: { profileId } },
        { new: true, upsert: true },
      )
      .select('-password -googleAccessToken');
  }

  async updateResetPasswordToken({
    email,
    resetPasswordToken,
    rptExpires,
  }: UserUpdateResetTokenDto): Promise<User> {
    return await this.userModel
      .findOneAndUpdate(
        { email },
        { $set: { resetPasswordToken, rptExpires } },
        { upsert: true, new: true },
      )
      .select('-password -googleAccessToken');
  }

  async updatePassword({
    userId,
    password,
  }: {
    userId: string;
    password: string;
  }): Promise<User> {
    return await this.userModel
      .findByIdAndUpdate(
        userId,
        {
          $set: {
            password,
            resetPasswordToken: '',
            rptExpires: new Date(Date.now()),
          },
        },
        { new: true, upsert: true },
      )
      .select('-password -googleAccessToken');
  }

  async getWithGoogleToken(args: UserGoogleLoginDto): Promise<User> {
    return await this.userModel
      .findOne(args)
      .select('email username id profileId');
  }
}
