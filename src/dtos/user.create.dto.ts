import { ProfileCreateDTO } from './profile.create.dto';

export type IUserCreateDto = {
  username?: string;
  email: string;
  password?: string;
  googleAccessToken: string;
  profileId?: string;
};

export type UserCreateDto = {
  userArgs: IUserCreateDto;
  profileArgs: ProfileCreateDTO;
};
