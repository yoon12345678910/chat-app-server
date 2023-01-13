import { Request, Response } from 'express';

import makeValidation from '@withvoid/make-validation';

import ChatRoomModel, { IChatRoom } from '../models/ChatRoom';
import ChatMessageModel, {
  IChatMessage,
  MessageData,
} from '../models/ChatMessage';
import UserModel, { IUser } from '../models/User';

import { PaginationOptions, PaginationResponse, APIResponse } from '../types';
import { PaginationPipelineResponse, paginationPipeline } from '../libs';
import { parsePaginationQuery } from '../utils';

const getChatRoomsWithRelevantInfo = async (
  roomId: string,
  options: PaginationOptions
): Promise<
  APIResponse<{
    chatRoom: IChatRoom;
    messages: IChatMessage[];
    userProfiles: IUser[];
    pagination: PaginationResponse;
  }>
> => {
  const chatRoom = await ChatRoomModel.getChatRoomByRoomId(roomId);
  if (!chatRoom) {
    return {
      success: false,
      message: '채팅방이 존재하지 않습니다.',
    };
  }

  const { items: messages, pagination } =
    await ChatMessageModel.getMessagesByRoomIds<
      PaginationPipelineResponse<IChatMessage>
    >([roomId], paginationPipeline(options));

  const userProfiles = await UserModel.getUserByIds(chatRoom.userIds);

  return {
    success: true,
    data: {
      chatRoom,
      messages,
      pagination,
      userProfiles,
    },
  };
};

export default {
  getChatRooms: async (
    req: Request,
    res: Response<{
      chatRooms: IChatRoom[];
      pagination: PaginationResponse;
    }>
  ) => {
    try {
      const { items: chatRooms, pagination } = await ChatRoomModel.getChatRooms<
        PaginationPipelineResponse<IChatRoom>
      >(paginationPipeline(parsePaginationQuery(req.query)));

      return res
        .status(200)
        .json({ success: true, data: { chatRooms, pagination } });
    } catch (error) {
      return res.status(500).json({ success: false, error: error });
    }
  },
  getChatRoomsWithRelevantInfo: async (
    req: Request,
    res: Response<{
      chatRoom: IChatRoom;
      messages: IChatMessage[];
      userProfiles: IUser[];
      pagination: PaginationResponse;
    }>
  ) => {
    try {
      const { roomId } = req.params;

      const { success, message, data } = await getChatRoomsWithRelevantInfo(
        roomId,
        parsePaginationQuery(req.query)
      );

      if (!success) {
        return { success: false, message };
      }

      return res.status(200).json({ success: true, data });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  },
  getMessages: async (
    req: Request,
    res: Response<{
      messages: IChatMessage[];
      pagination: PaginationResponse;
    }>
  ) => {
    try {
      const { roomId } = req.params;

      const room = await ChatRoomModel.getChatRoomByRoomId(roomId);
      if (!room) {
        return {
          success: false,
          message: '채팅방이 존재하지 않습니다.',
        };
      }

      const { items: messages, pagination } =
        await ChatMessageModel.getMessagesByRoomIds<
          PaginationPipelineResponse<IChatMessage>
        >([roomId], paginationPipeline(parsePaginationQuery(req.query)));

      return res.status(200).json({
        success: true,
        data: { messages, pagination },
      });
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
  },
  createChatRoom: async (
    req: Request<any, any, { name: string }>,
    res: Response<{ chatRoom: IChatRoom }>
  ) => {
    try {
      const validation = makeValidation((types) => ({
        payload: req.body,
        checks: {
          name: {
            type: types.string,
            options: { empty: false },
          },
        },
      }));
      if (!validation.success) return res.status(400).json({ ...validation });

      const { name } = req.body;
      const { userId } = req;

      const chatRoom = await ChatRoomModel.createChatRoom(name, userId);

      return res.status(200).json({ success: true, data: { chatRoom } });
    } catch (error) {
      return res.status(500).json({ success: false, error: error });
    }
  },
  joinChatRoom: async (
    req: Request,
    res: Response<{
      chatRoom: IChatRoom;
      messages: IChatMessage[];
      pagination: PaginationResponse;
      userProfiles: IUser[];
    }>
  ) => {
    try {
      const { roomId } = req.params;
      const { userId } = req;

      const usersInChatRoom = await ChatRoomModel.getUsersInChatRoom(roomId);
      if (usersInChatRoom.includes(userId)) {
        return res.status(400).json({
          success: false,
          message: '이미 이 채팅방에 참가하고 있습니다.',
        });
      }

      await ChatRoomModel.joinChatRoom(roomId, userId);

      const { success, message, data } = await getChatRoomsWithRelevantInfo(
        roomId,
        parsePaginationQuery(req.query)
      );

      if (!success) {
        return { success: false, message };
      }

      return res.status(200).json({ success: true, data });
    } catch (error) {
      return res.status(500).json({ success: false, error: error });
    }
  },
  leaveChatRoom: async (req: Request, res: Response) => {
    try {
      const { roomId } = req.params;
      const { userId } = req;

      const usersInChatRoom = await ChatRoomModel.getUsersInChatRoom(roomId);
      if (!usersInChatRoom.includes(userId)) {
        return res.status(400).json({
          success: false,
          message: '이 채팅방을 참가하고 있지 않습니다.',
        });
      }

      await ChatRoomModel.leaveChatRoom(roomId, userId);

      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ success: false, error: error });
    }
  },
  postMessage: async (
    req: Request<any, any, MessageData>,
    res: Response<{ post: IChatMessage & { userProfiles: IUser[] } }>
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

      global.io.sockets.in(roomId).emit('message.new', { message: post });

      return res.status(200).json({ success: true, data: { post } });
    } catch (error) {
      return res.status(500).json({ success: false, error: error });
    }
  },
  markMessageRead: async (req: Request, res: Response) => {
    try {
      const { roomId } = req.params;
      const { userId } = req;

      const room = await ChatRoomModel.getChatRoomByRoomId(roomId);
      if (!room) {
        return res.status(400).json({
          success: false,
          message: `${roomId} ID를 가진 채팅방이 없습니다.`,
        });
      }

      await ChatMessageModel.markMessageRead(roomId, userId);

      return res.status(200).json({ success: true });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, error });
    }
  },
};
