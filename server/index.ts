import http from 'http';
import express, { Response } from 'express';
import logger from 'morgan';
import cors from 'cors';
import { Server } from 'socket.io';
// mongo connection
import './config/mongo';
// socket configuration
import WebSockets from './socket/WebSockets';
// routes
import indexRouter from './routes/index';
import userRouter from './routes/user';
import chatRoomRouter from './routes/chatRoom';
// middlewares
import { decode } from './middlewares/jwt';

const app = express();

/** Express 포트 설정 */
const port = process.env.PORT || '3000';
app.set('port', port);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/', indexRouter);
app.use('/users', userRouter);
app.use('/room', decode, chatRoomRouter);

/** 404 오류 처리 */
app.use('*', (_, res: Response) => {
  return res.status(404).json({
    success: false,
    message: 'API endpoint 가 없습니다.',
  });
});

/** HTTP 서버 생성 */
const server = http.createServer(app);
global.io = new Server(server);
global.io.on('connection', WebSockets.connection);
server.listen(port);
server.on('listening', () => {
  console.log(`Listening on port:: http://localhost:${port}/`);
});
