import { IProfile } from '@interfaces/profile.interface';

export type ProfileResponse = {
  status: number;
  message?: string;
  error?: string;
  profile?: IProfile;
};
