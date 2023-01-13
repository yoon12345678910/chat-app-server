import express, { Request, Response } from 'express';
import { Send } from 'express-serve-static-core';
// middlewares
import { AuthToken, encode } from '../middlewares/jwt';

const router = express.Router();

router.post(
  '/login/:userId',
  encode,
  (req: Request, res: Response<{ authorization: AuthToken }>) => {
    return res.status(200).json({
      success: true,
      data: {
        authorization: req?.authToken as AuthToken,
      },
    });
  }
);

export default router;
