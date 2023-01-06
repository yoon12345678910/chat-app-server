import mongoose, { Schema, Model, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export const CHAT_ROOM_TYPES = {
  CONSUMER_TO_CONSUMER: 'consumer-to-consumer',
  CONSUMER_TO_SUPPORT: 'consumer-to-support',
} as const;

export type ChatRoomTypeValue =
  typeof CHAT_ROOM_TYPES[keyof typeof CHAT_ROOM_TYPES];

export interface IChatRoom extends DocumentResult<IChatRoom> {
  _id: string;
  type: ChatRoomTypeValue;
  userIds: string[];
  chatInitiator: string;
}

export type InitiateChatResponse = {
  isNew: boolean;
  message: string;
  chatRoomId: string;
  type: ChatRoomTypeValue;
};

interface DocumentResult<T> extends Document {
  _doc: T;
}

interface IChatRoomModel extends Model<IChatRoom> {
  getChatRoomsByUserId: (userId: string) => Promise<IChatRoom[]>;
  getChatRoomByRoomId: (roomId: string) => Promise<IChatRoom>;
  initiateChat: (
    userIds: string[],
    type: ChatRoomTypeValue,
    chatInitiator: string
  ) => Promise<InitiateChatResponse>;
}

const ChatRoomSchema = new Schema(
  {
    _id: {
      type: String,
      default: () => uuidv4().replace(/\-/g, ''),
    },
    userIds: Array,
    type: String,
    chatInitiator: String,
  },
  {
    timestamps: true,
    collection: 'chatrooms',
  }
);

ChatRoomSchema.statics.getChatRoomsByUserId = async function (userId: string) {
  try {
    const rooms = await this.find({ userIds: { $all: [userId] } });
    return rooms;
  } catch (error) {
    throw error;
  }
};

ChatRoomSchema.statics.getChatRoomByRoomId = async function (roomId: string) {
  try {
    const room = await this.findOne({ _id: roomId });
    return room;
  } catch (error) {
    throw error;
  }
};

ChatRoomSchema.statics.initiateChat = async function (
  userIds: string[],
  type: ChatRoomTypeValue,
  chatInitiator: string
) {
  try {
    const availableRoom: IChatRoom = await this.findOne({
      userIds: {
        $size: userIds.length,
        $all: [...userIds],
      },
      type,
    });
    if (availableRoom) {
      return {
        isNew: false,
        message: '기존 채팅방',
        chatRoomId: availableRoom._doc._id,
        type: availableRoom._doc.type,
      };
    }
    const newRoom = (await this.create({
      userIds,
      type,
      chatInitiator,
    })) as IChatRoom;
    return {
      isNew: true,
      message: '새 채팅방',
      chatRoomId: newRoom._doc._id,
      type: newRoom._doc.type,
    };
  } catch (error) {
    console.log('채팅 시작 메소드 오류', error);
    throw error;
  }
};

export default mongoose.model<IChatRoom, IChatRoomModel>(
  'ChatRoom',
  ChatRoomSchema
);
