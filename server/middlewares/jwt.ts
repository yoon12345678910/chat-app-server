import { Request, Response, NextFunction } from 'express';
import jwt, { Secret, JwtPayload } from 'jsonwebtoken';
// models
import UserModel from '../models/User';

const SECRET_KEY: Secret = '#some-secret-key';

export interface Payload {
  userId: string;
}

export type AuthToken = string | JwtPayload;

export const encode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const user = await UserModel.getUserById(userId);
    const payload: Payload = {
      userId: user._id,
    };
    const authToken = jwt.sign(payload, SECRET_KEY);
    console.log('Auth', authToken);
    req.authToken = authToken;
    next();
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.error });
  }
};

export const decode = (req: Request, res: Response, next: NextFunction) => {
  if (!req.headers['authorization']) {
    return res
      .status(400)
      .json({ success: false, message: '액세스 토큰이 없습니다.' });
  }
  try {
    const accessToken = req.headers.authorization.replace('Bearer ', '');
    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: '제공된 액세스 토큰이 정상이 아닙니다.',
      });
    }
    const decoded = jwt.verify(accessToken, SECRET_KEY) as Payload;
    req.userId = decoded.userId;
    return next();
  } catch (error: any) {
    return res.status(401).json({ success: false, message: error.message });
  }
};
