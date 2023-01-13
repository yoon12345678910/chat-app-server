import mongoose from 'mongoose';
import config from './index';

const CONNECTION_URL = `mongodb://${config.db.url}/${config.db.name}`;

mongoose.connect(CONNECTION_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});

mongoose.connection.on('connected', () => {
  console.log('Mongo 성공적으로 연결되었습니다.');
});
mongoose.connection.on('reconnected', () => {
  console.log('Mongo 다시 연결되었습니다.');
});
mongoose.connection.on('error', (error) => {
  console.log('Mongo 연결에 오류가 있습니다.', error);
  mongoose.disconnect();
});
mongoose.connection.on('disconnected', () => {
  console.log('Mongo 연결이 끊어졌습니다.');
});
