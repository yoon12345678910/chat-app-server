import mongoose, { Schema, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IUser } from './User';
import { DateType } from '../types';

export const MESSAGE_TYPES = {
  TYPE_TEXT: 'text',
} as const;

export type MessageTypes = typeof MESSAGE_TYPES[keyof typeof MESSAGE_TYPES];

export type MessageData = {
  messageText: string;
};

export interface IReadByRecipient {
  readByUserId: string;
  readAt: DateType;
}

export interface IChatMessage {
  _id: string;
  chatRoomId: string;
  message: MessageData;
  postedByUser: IUser;
  readByRecipients: IReadByRecipient[];
  type: MessageTypes;
}

interface IChatMessageModel extends Model<IChatMessage> {
  getMessagesByRoomIds: <ResponseType>(
    chatRoomIds: string[],
    paginationPipeline?: object[]
  ) => Promise<ResponseType>;
  createPostInChatRoom: (
    chatRoomId: string,
    message: MessageData,
    postedByUser: string
  ) => Promise<IChatMessage & { userProfiles: IUser[] }>;
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

ChatMessageSchema.statics.getMessagesByRoomIds = async function (
  chatRoomIds: string[],
  paginationPipeline: object[] = [{}]
) {
  try {
    const aggregate = await this.aggregate([
      { $match: { chatRoomId: { $in: chatRoomIds } } },
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
      { $sort: { createdAt: 1 } },
      ...paginationPipeline,
    ]);
    return aggregate[0];
  } catch (error) {
    throw error;
  }
};

ChatMessageSchema.statics.createPostInChatRoom = async function (
  chatRoomId: string,
  message: MessageData,
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
          userProfiles: { $addToSet: '$chatRoomInfo.userProfile' },
          createdAt: { $last: '$createdAt' },
          updatedAt: { $last: '$updatedAt' },
        },
      },
    ]);
    return aggregate[0];
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
  'MessageData',
  ChatMessageSchema
);
