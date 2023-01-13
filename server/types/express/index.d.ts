import { AuthToken, Payload } from '../../middlewares/jwt';
import {
  Response as coreResponse,
  Send as coreSend,
} from 'express-serve-static-core';
import { APIResponse } from '../';

declare module 'express-serve-static-core' {
  interface Request extends Payload {
    authToken?: AuthToken;
  }
}
declare module 'express' {
  interface Response<
    ResBody = any,
    Locals extends Record<string, any> = Record<string, any>
  > extends coreResponse<ResBody, Locals> {
    json: coreSend<APIResponse<ResBody>, this>;
  }
}
