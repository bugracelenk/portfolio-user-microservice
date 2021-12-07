export type UserCreateDto = {
  username?: string;
  email: string;
  password?: string;
  googleAccessToken: string;
  profileId?: string;
};
