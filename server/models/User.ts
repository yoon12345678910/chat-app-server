import mongoose, { Schema, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export const USER_TYPES = {
  CONSUMER: 'consumer',
  SUPPORT: 'support',
} as const;

export type IUser = {
  _id: string;
  firstName: string;
  lastName: string;
  type: string;
};

interface IUserModel extends Model<IUser> {
  createUser: (
    firstName: string,
    lastName: string,
    type: string
  ) => Promise<IUser>;
  getUserById: (id: string) => Promise<IUser>;
  getUsers: () => Promise<IUser[]>;
  getUserByIds: (ids: string[]) => Promise<IUser[]>;
  deleteByUserById: (id: string) => Promise<any>;
}

const UserSchema = new Schema<Model<IUser, IUserModel>>(
  {
    _id: {
      type: String,
      default: () => uuidv4().replace(/\-/g, ''),
    },
    firstName: String,
    lastName: String,
    type: String,
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

UserSchema.statics.createUser = async function (
  firstName: string,
  lastName: string,
  type: string
) {
  try {
    const user = await this.create({ firstName, lastName, type });
    return user;
  } catch (error) {
    throw error;
  }
};

UserSchema.statics.getUserById = async function (id: string) {
  try {
    const user = await this.findOne({ _id: id });
    if (!user) throw { error: `${id} ID를 가진 사용자를 찾을 수 없습니다.` };
    return user;
  } catch (error) {
    throw error;
  }
};

UserSchema.statics.getUsers = async function () {
  try {
    const users = await this.find();
    return users;
  } catch (error) {
    throw error;
  }
};

UserSchema.statics.getUserByIds = async function (ids: string[]) {
  try {
    const users = await this.find({ _id: { $in: ids } });
    return users;
  } catch (error) {
    throw error;
  }
};

UserSchema.statics.deleteByUserById = async function (id) {
  try {
    const result = await this.remove({ _id: id });
    return result;
  } catch (error) {
    throw error;
  }
};

export default mongoose.model<IUser, IUserModel>('User', UserSchema);
