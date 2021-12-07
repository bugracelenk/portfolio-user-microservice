import { User } from '@schemas/user.schema';

export type UserResponse = {
  status: number;
  message?: string;
  error?: string;
  id?: string;
  token?: string;
  user?: User;
  rptExpires?: Date;
  compareResult?: boolean;
};
