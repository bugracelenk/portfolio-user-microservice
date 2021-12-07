import { Controller, HttpStatus } from '@nestjs/common';
import {
  MessagePattern,
  RmqContext,
  Ctx,
  Payload,
} from '@nestjs/microservices';
import { UserService } from '@services/user.service';
import { sendAck } from '@helpers/sendAck';
import { UserCreateDto } from '@dtos/user.create.dto';
import { UserUpdateProfileDto } from '@dtos/user.update_profile.dto';
import { UserChangePasswordDto } from '@dtos/user.change_password';
import { UserLoginDto } from '@dtos/user.login.dto';
import { UserResponse } from '@responses/user.response';
import { Patterns } from '@patterns';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern(Patterns.CREATE_USER)
  async createUser(
    @Payload() args: UserCreateDto,
    @Ctx() context: RmqContext,
  ): Promise<UserResponse> {
    const user = await this.userService.createUser(args);
    if (!user) {
      //implement errorLog Microservice
      sendAck(context);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'User create error!',
      };
    }

    delete user.password;
    sendAck(context);
    return {
      status: HttpStatus.OK,
      message: 'User created successfully',
    };
  }

  @MessagePattern(Patterns.GET_WITH_EMAIL)
  async getUserWithEmail(
    @Payload() { email }: { email: string },
    @Ctx() context: RmqContext,
  ): Promise<UserResponse> {
    const user = await this.userService.getUserWithEmail(email);
    if (!user) {
      //implement errorLog Microservice
      sendAck(context);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'User get email error!',
      };
    }

    delete user.password;
    sendAck(context);
    return {
      status: HttpStatus.OK,
      user,
    };
  }

  @MessagePattern(Patterns.GET_WITH_ID)
  async getUserWithId(
    @Payload() { id }: { id: string },
    @Ctx() context: RmqContext,
  ): Promise<UserResponse> {
    const user = await this.userService.getUserWithId(id);
    if (!user) {
      //implement errorLog Microservice
      sendAck(context);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'User get id error!',
      };
    }

    delete user.password;
    sendAck(context);
    return {
      status: HttpStatus.OK,
      user,
    };
  }

  @MessagePattern(Patterns.UPDATE_PROFILE_ID)
  async updateUserProfileId(
    @Payload() args: UserUpdateProfileDto,
    @Ctx() context: RmqContext,
  ): Promise<UserResponse> {
    const user = await this.userService.updateUserProfileId(args);
    if (!user) {
      //implement errorLog Microservice
      sendAck(context);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'User update profile id error!',
      };
    }

    delete user.password;
    sendAck(context);
    return {
      status: HttpStatus.OK,
      user,
    };
  }

  @MessagePattern(Patterns.UPDATE_RPT)
  async forgotPasswordRequest(
    @Payload() { email }: { email: string },
    @Ctx() context: RmqContext,
  ): Promise<UserResponse> {
    const { rptExpires } = await this.userService.updateResetPasswordToken(
      email,
    );
    if (!rptExpires) {
      //implement errorLog Microservice
      sendAck(context);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'User update rpt error!',
      };
    }

    sendAck(context);
    return {
      status: HttpStatus.OK,
      message: 'RPT SET',
      rptExpires,
    };
  }

  @MessagePattern(Patterns.UPDATE_PASSWORD)
  async updatePassword(
    @Payload()
    { email, resetPasswordToken, rptExpires, password }: UserChangePasswordDto,
    @Ctx() context: RmqContext,
  ): Promise<UserResponse> {
    if (rptExpires < new Date(Date.now())) {
      return {
        status: HttpStatus.PRECONDITION_FAILED,
        message: 'RPT_EXPIRED',
      };
    }

    const user = await this.userService.getUserWithRpt({
      email,
      resetPasswordToken,
    });
    if (!user) {
      //implement errorLog Microservice
      sendAck(context);
      return {
        status: HttpStatus.NOT_FOUND,
        message: 'RPT_OR_EMAIL_INVALID',
      };
    }

    const updatedUser = await this.userService.updatePassword({
      userId: user.id,
      password,
    });

    if (!user) {
      //implement errorLog Microservice
      sendAck(context);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'USER_PASSWORD_UPDATE_FAILED',
      };
    }

    sendAck(context);
    return {
      status: HttpStatus.OK,
      message: 'USER_PASSWORD_CHANGED',
      user,
    };
  }

  @MessagePattern(Patterns.COMPARE_PASSWORD)
  async ssoLogin(
    @Payload() args: UserLoginDto,
    @Ctx() context: RmqContext,
  ): Promise<UserResponse> {
    const compareResult = await this.userService.comparePassword(args);

    if (compareResult === null || compareResult === undefined) {
      sendAck(context);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'USER_COMPARE_ERROR',
      };
    }

    sendAck(context);
    return {
      status: HttpStatus.OK,
      compareResult,
    };
  }
}
