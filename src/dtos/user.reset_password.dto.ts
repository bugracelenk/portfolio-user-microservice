export type UserUpdateResetTokenDto = {
  email: string;
  resetPasswordToken: string;
  rptExpires: Date;
};
