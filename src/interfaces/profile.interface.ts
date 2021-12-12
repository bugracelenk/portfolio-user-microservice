import { User } from '@schemas/user.schema';

export interface IProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  profileImage: string;
  user: User;
}
