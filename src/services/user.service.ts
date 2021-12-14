import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { User } from '@schemas/user.schema';
import { UserRepository } from '@repositories/user.repository';
import { IUserCreateDto, UserCreateDto } from '@dtos/user.create.dto';
import { hash, compare } from '@helpers/hash';
import { UserGetUserWithRptDto } from '@dtos/user.get_w_token.dto';
import { UserUpdateProfileDto } from '@dtos/user.update_profile.dto';
import { UserLoginDto } from '@dtos/user.login.dto';
import { ClientProxy } from '@nestjs/microservices';
import { ProfileResponse } from '@responses/profile.response';
import { Patterns } from '@patterns';
import { ProfileCreateDTO } from '@dtos/profile.create.dto';
import { lastValueFrom } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import { UserGoogleLoginDto } from '@dtos/user.google_login.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    @Inject('PROFILE_SERVICE') private readonly profileService: ClientProxy,
    private jwtService: JwtService,
  ) {}

  async createUser(
    userArgs: IUserCreateDto,
    profileArgs: ProfileCreateDTO,
  ): Promise<string> {
    if (userArgs.password) userArgs.password = await hash(userArgs.password);
    const createdUser = await this.userRepository.createUser(userArgs);
    profileArgs.userId = createdUser.id;

    const profileRes = await this.profileService.send<ProfileResponse>(
      Patterns.PROFILE_CREATE,
      profileArgs,
    );

    const profileData = await lastValueFrom(profileRes);
    if (profileData.error) {
      return `Error: ${profileData.error}`;
    }

    const user = await this.userRepository.updateUserProfileId({
      profileId: profileData.profile.id,
      userId: createdUser.id,
    });

    let token = {
      username: user.username,
      email: user.email,
      profileId: user.profileId,
      googleAccessToken: user.gooogleAccessToken,
    };

    return await this.jwtService.signAsync(token, {
      expiresIn: '365d',
      secret: process.env.JWT_SECRET,
    });
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
    const profileResponse = await this.profileService.send<ProfileResponse>(
      Patterns.PROFILE_GET_WITH_ID,
      {
        id: args.profileId,
      },
    );
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

  async ssoLogin({ email, password }: UserLoginDto): Promise<string> {
    const user = await this.userRepository.getUserWithEmail(email);
    const result = await compare(password, user.password);

    if (result === undefined || result === null) {
      return 'Error: Not Authorized';
    }

    return await this.jwtService.signAsync(
      {
        username: user.username,
        email: user.email,
        profileId: user.profileId,
        googleAccessToken: user.gooogleAccessToken,
      },
      { expiresIn: '365d', secret: process.env.JWT_SERVICE },
    );
  }

  async googleLogin(args: UserGoogleLoginDto): Promise<string> {
    const user = await this.userRepository.getWithGoogleToken(args);
    if (!user) {
      const withEmail = await this.userRepository.getUserWithEmail(args.email);
      if (withEmail) {
        const updatedUser = await this.userRepository.updateGoogleToken(
          withEmail.id,
          args.googleAccessToken,
        );

        if (!updatedUser) {
          return null;
        }

        return await this.jwtService.signAsync(
          {
            username: withEmail.username,
            email: args.email,
            profileId: withEmail.profileId,
            googleAccessToken: args.googleAccessToken,
          },
          { expiresIn: '365d', secret: process.env.JWT_SERVICE },
        );
      }
    }

    return await this.jwtService.signAsync(
      {
        username: user.username,
        email: user.email,
        profileId: user.profileId,
        googleAccessToken: user.gooogleAccessToken,
      },
      { expiresIn: '365d', secret: process.env.JWT_SERVICE },
    );
  }
}
