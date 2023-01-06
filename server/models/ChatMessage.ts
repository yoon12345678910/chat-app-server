import mongoose, { Schema, Model, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IUser } from './User';
import { DateType, PaginationOptions } from '../types';

export const MESSAGE_TYPES = {
  TYPE_TEXT: 'text',
} as const;

export type MessageTypeValue = typeof MESSAGE_TYPES[keyof typeof MESSAGE_TYPES];

export interface IReadByRecipient {
  readByUserId: string;
  readAt: DateType;
}

export type ChatMessage = {
  messageText: string;
};

export interface IChatMessage {
  _id: string;
  chatRoomId: string;
  message: ChatMessage;
  type: MessageTypeValue;
  postedByUser: IUser;
  readByRecipients: IReadByRecipient[];
  users: IUser[];
}

interface IChatMessageModel extends Model<IChatMessage> {
  createPostInChatRoom: (
    chatRoomId: string,
    message: ChatMessage,
    postedByUser: string
  ) => Promise<IChatMessage>;
  getRecentConversation: (
    chatRoomIds: string[],
    options: PaginationOptions
  ) => Promise<IChatMessage[]>;
  getConversationByRoomId: (
    chatRoomId: string,
    options: PaginationOptions
  ) => Promise<IChatMessage[]>;
  markMessageRead: (
    chatRoomId: string,
    currentUserOnlineId: string
  ) => Promise<any>;
}

const ReadByRecipientSchema = new Schema(
  {
    _id: false,
    readByUserId: String,
    readAt: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    timestamps: false,
  }
);

const ChatMessageSchema = new Schema(
  {
    _id: {
      type: String,
      default: () => uuidv4().replace(/\-/g, ''),
    },
    chatRoomId: String,
    message: Schema.Types.Mixed,
    type: {
      type: String,
      default: () => MESSAGE_TYPES.TYPE_TEXT,
    },
    postedByUser: String,
    readByRecipients: [ReadByRecipientSchema],
  },
  {
    timestamps: true,
    collection: 'chatmessages',
  }
);

ChatMessageSchema.statics.createPostInChatRoom = async function (
  chatRoomId: string,
  message: ChatMessage,
  postedByUser: string
) {
  try {
    const post = await this.create({
      chatRoomId,
      message,
      postedByUser,
      readByRecipients: { readByUserId: postedByUser },
    });
    const aggregate = await this.aggregate([
      { $match: { _id: post._id } },
      {
        $lookup: {
          from: 'users',
          localField: 'postedByUser',
          foreignField: '_id',
          as: 'postedByUser',
        },
      },
      { $unwind: '$postedByUser' },
      {
        $lookup: {
          from: 'chatrooms',
          localField: 'chatRoomId',
          foreignField: '_id',
          as: 'chatRoomInfo',
        },
      },
      { $unwind: '$chatRoomInfo' },
      { $unwind: '$chatRoomInfo.userIds' },
      {
        $lookup: {
          from: 'users',
          localField: 'chatRoomInfo.userIds',
          foreignField: '_id',
          as: 'chatRoomInfo.userProfile',
        },
      },
      { $unwind: '$chatRoomInfo.userProfile' },
      {
        $group: {
          _id: '$chatRoomInfo._id',
          postId: { $last: '$_id' },
          chatRoomId: { $last: '$chatRoomInfo._id' },
          message: { $last: '$message' },
          type: { $last: '$type' },
          postedByUser: { $last: '$postedByUser' },
          readByRecipients: { $last: '$readByRecipients' },
          users: { $addToSet: '$chatRoomInfo.userProfile' },
          createdAt: { $last: '$createdAt' },
          updatedAt: { $last: '$updatedAt' },
        },
      },
    ]);
    return aggregate[0] as IChatMessage;
  } catch (error) {
    throw error;
  }
};

ChatMessageSchema.statics.getRecentConversation = async function (
  chatRoomIds: string[],
  options: PaginationOptions = { page: 0, limit: 10 }
) {
  try {
    return this.aggregate([
      { $match: { chatRoomId: { $in: chatRoomIds } } },
      {
        $group: {
          _id: '$chatRoomId',
          messageId: { $last: '$_id' },
          chatRoomId: { $last: '$chatRoomId' },
          message: { $last: '$message' },
          type: { $last: '$type' },
          postedByUser: { $last: '$postedByUser' },
          createdAt: { $last: '$createdAt' },
          readByRecipients: { $last: '$readByRecipients' },
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'users',
          localField: 'postedByUser',
          foreignField: '_id',
          as: 'postedByUser',
        },
      },
      { $unwind: '$postedByUser' },
      {
        $lookup: {
          from: 'chatrooms',
          localField: '_id',
          foreignField: '_id',
          as: 'roomInfo',
        },
      },
      { $unwind: '$roomInfo' },
      { $unwind: '$roomInfo.userIds' },
      {
        $lookup: {
          from: 'users',
          localField: 'roomInfo.userIds',
          foreignField: '_id',
          as: 'roomInfo.userProfile',
        },
      },
      { $unwind: '$readByRecipients' },
      {
        $lookup: {
          from: 'users',
          localField: 'readByRecipients.readByUserId',
          foreignField: '_id',
          as: 'readByRecipients.readByUser',
        },
      },
      {
        $group: {
          _id: '$roomInfo._id',
          messageId: { $last: '$messageId' },
          chatRoomId: { $last: '$chatRoomId' },
          message: { $last: '$message' },
          type: { $last: '$type' },
          postedByUser: { $last: '$postedByUser' },
          readByRecipients: { $addToSet: '$readByRecipients' },
          users: { $addToSet: '$roomInfo.userProfile' },
          createdAt: { $last: '$createdAt' },
        },
      },
      { $skip: options.page * options.limit },
      { $limit: options.limit },
    ]);
  } catch (error) {
    throw error;
  }
};

ChatMessageSchema.statics.getConversationByRoomId = async function (
  chatRoomId: string,
  options: PaginationOptions = { page: 0, limit: 10 }
) {
  try {
    return this.aggregate([
      { $match: { chatRoomId } },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'users',
          localField: 'postedByUser',
          foreignField: '_id',
          as: 'postedByUser',
        },
      },
      { $unwind: '$postedByUser' },
      { $skip: options.page * options.limit },
      { $limit: options.limit },
      { $sort: { createdAt: 1 } },
    ]);
  } catch (error) {
    throw error;
  }
};

ChatMessageSchema.statics.markMessageRead = async function (
  chatRoomId: string,
  currentUserOnlineId: string
) {
  try {
    return this.updateMany(
      {
        chatRoomId,
        'readByRecipients.readByUserId': { $ne: currentUserOnlineId },
      },
      {
        $addToSet: {
          readByRecipients: { readByUserId: currentUserOnlineId },
        },
      },
      {
        multi: true,
      }
    );
  } catch (error) {
    throw error;
  }
};

export default mongoose.model<IChatMessage, IChatMessageModel>(
  'ChatMessage',
  ChatMessageSchema
);
