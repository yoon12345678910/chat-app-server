import express from 'express';
// controllers
import chatRoom from '../controllers/chatRoom';

const router = express.Router();

router
  .get('/', chatRoom.getChatRooms)
  .post('/', chatRoom.createChatRoom)
  .get('/:roomId', chatRoom.getChatRoomsWithRelevantInfo)
  .post('/:roomId/join', chatRoom.joinChatRoom)
  .post('/:roomId/leave', chatRoom.leaveChatRoom)
  .post('/:roomId/postmessage', chatRoom.postMessage)
  .get('/:roomId/messages', chatRoom.getMessages)
  .put('/:roomId/mark-read', chatRoom.markMessageRead);

export default router;
