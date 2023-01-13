import { Request, Response } from 'express';

import makeValidation from '@withvoid/make-validation';

import UserModel, { IUser } from '../models/User';

export default {
  getAllUsers: async (_: Request, res: Response<{ users: IUser[] }>) => {
    try {
      const users = await UserModel.getUsers();
      return res.status(200).json({ success: true, data: { users } });
    } catch (error) {
      return res.status(500).json({ success: false, error: error });
    }
  },
  getUserById: async (req: Request, res: Response<{ user: IUser }>) => {
    try {
      const user = await UserModel.getUserById(req.params.id);
      return res.status(200).json({ success: true, data: { user } });
    } catch (error) {
      return res.status(500).json({ success: false, error: error });
    }
  },
  createUser: async (
    req: Request<any, any, Omit<IUser, '_id'>>,
    res: Response<{ user: IUser }>
  ) => {
    try {
      const validation = makeValidation((types) => ({
        payload: req.body,
        checks: {
          name: { type: types.string },
        },
      }));
      if (!validation.success) return res.status(400).json({ ...validation });

      const { name } = req.body;
      const user = await UserModel.createUser(name);
      return res.status(200).json({ success: true, data: { user } });
    } catch (error) {
      return res.status(500).json({ success: false, error: error });
    }
  },
  deleteUserById: async (req: Request, res: Response) => {
    try {
      const user = await UserModel.deleteByUserById(req.params.id);
      return res.status(200).json({
        success: true,
        message: `${user.deletedCount} 명의 사용자를 삭제했습니다.`,
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: error });
    }
  },
};
