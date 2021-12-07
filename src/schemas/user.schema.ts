import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type UserDocument = User & Document;

@Schema({
  versionKey: false,
  timestamps: true,
})
export class User {
  id: string;

  @Prop({
    required: true,
    unique: true,
  })
  username: string;

  @Prop({
    required: true,
    unique: true,
  })
  email: string;

  @Prop({
    required: false,
  })
  password: string;

  @Prop({
    required: false,
    default: '',
  })
  profileId: string;

  @Prop({
    required: false,
    default: '',
  })
  gooogleAccessToken: string;

  @Prop({
    default: '',
    required: false,
  })
  resetPasswordToken: string;

  @Prop({
    required: false,
    default: Date.now(),
  })
  rptExpires: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
