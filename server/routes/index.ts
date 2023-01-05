import express, { Request, Response } from 'express';
import core, { Send } from 'express-serve-static-core';
// controllers
import users from '../controllers/user';
// middlewares
import { AuthToken, encode } from '../middlewares/jwt';
import { APIResponse } from '../types';

const router = express.Router();

export interface TypedResponse<ResBody> extends Response {
  json: Send<APIResponse<ResBody>, this>;
}

router.post(
  '/login/:userId',
  encode,
  (req: core.Request, res: Response<{ authorization: AuthToken }>) => {
    return res.status(200).json({
      success: true,
      data: {
        authorization: req?.authToken as AuthToken,
      },
    });
  }
);

export default router;
