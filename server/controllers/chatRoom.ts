import { Request, Response } from 'express';
// utils
import makeValidation from '@withvoid/make-validation';
// models
import ChatRoomModel, {
  CHAT_ROOM_TYPES,
  ChatRoomTypeValue,
  InitiateChatResponse,
} from '../models/ChatRoom';
import ChatMessageModel, {
  IChatMessage,
  ChatMessage,
} from '../models/ChatMessage';
import UserModel, { IUser } from '../models/User';

export default {
  initiate: async (
    req: Request<any, any, { userIds: string[]; type: ChatRoomTypeValue }>,
    res: Response<{ chatRoom: InitiateChatResponse }>
  ) => {
    try {
      const validation = makeValidation((types) => ({
        payload: req.body,
        checks: {
          userIds: {
            type: types.array,
            options: { unique: true, empty: false, stringOnly: true },
          },
          type: { type: types.enum, options: { enum: CHAT_ROOM_TYPES } },
        },
      }));
      if (!validation.success) return res.status(400).json({ ...validation });

      const { userIds, type } = req.body;
      const { userId: chatInitiator } = req;
      const allUserIds = [...userIds, chatInitiator];
      const chatRoom = await ChatRoomModel.initiateChat(
        allUserIds,
        type,
        chatInitiator
      );
      return res.status(200).json({ success: true, data: { chatRoom } });
    } catch (error) {
      return res.status(500).json({ success: false, error: error });
    }
  },
  postMessage: async (
    req: Request<any, any, ChatMessage>,
    res: Response<{ post: IChatMessage }>
  ) => {
    try {
      const { roomId } = req.params;
      const validation = makeValidation((types) => ({
        payload: req.body,
        checks: {
          messageText: { type: types.string },
        },
      }));
      if (!validation.success) return res.status(400).json({ ...validation });

      const messagePayload = {
        messageText: req.body.messageText,
      };
      const currentLoggedUser = req.userId;
      const post = await ChatMessageModel.createPostInChatRoom(
        roomId,
        messagePayload,
        currentLoggedUser
      );
      global.io.sockets.in(roomId).emit('new message', { message: post });
      return res.status(200).json({ success: true, data: { post } });
    } catch (error) {
      return res.status(500).json({ success: false, error: error });
    }
  },
  getRecentConversation: async (
    req: Request,
    res: Response<{ conversation: IChatMessage[] }>
  ) => {
    try {
      const currentLoggedUser = req.userId;
      const options = {
        page: parseInt(req.query.page as string),
        limit: parseInt(req.query.limit as string),
      };
      const rooms = await ChatRoomModel.getChatRoomsByUserId(currentLoggedUser);
      const roomIds = rooms.map((room) => room._id);
      const recentConversation = await ChatMessageModel.getRecentConversation(
        roomIds,
        options
      );
      return res
        .status(200)
        .json({ success: true, data: { conversation: recentConversation } });
    } catch (error) {
      return res.status(500).json({ success: false, error: error });
    }
  },
  getConversationByRoomId: async (
    req: Request,
    res: Response<{ conversation: IChatMessage[]; users: IUser[] }>
  ) => {
    try {
      const { roomId } = req.params;
      const room = await ChatRoomModel.getChatRoomByRoomId(roomId);
      if (!room) {
        return res.status(400).json({
          success: false,
          message: `${roomId} ID를 가진 채팅방이 없습니다.`,
        });
      }
      const options = {
        page: parseInt(req.query.page as string),
        limit: parseInt(req.query.limit as string),
      };
      const conversation = await ChatMessageModel.getConversationByRoomId(
        roomId,
        options
      );
      const users = await UserModel.getUserByIds(room.userIds);
      return res.status(200).json({
        success: true,
        data: {
          conversation,
          users,
        },
      });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  },
  markConversationReadByRoomId: async (req: Request, res: Response) => {
    try {
      const { roomId } = req.params;
      const room = await ChatRoomModel.getChatRoomByRoomId(roomId);
      if (!room) {
        return res.status(400).json({
          success: false,
          message: `${roomId} ID를 가진 채팅방이 없습니다.`,
        });
      }

      const currentLoggedUser = req.userId;
      await ChatMessageModel.markMessageRead(roomId, currentLoggedUser);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, error });
    }
  },
};
