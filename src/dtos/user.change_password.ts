export type UserChangePasswordDto = {
  email: string;
  resetPasswordToken: string;
  rptExpires: Date;
  password: string;
};
