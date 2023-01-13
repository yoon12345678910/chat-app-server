import mongoose, { Schema, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IChatRoom {
  _id: string;
  name: string;
  userIds: string[];
  chatInitiator: string;
}

interface IChatRoomModel extends Model<IChatRoom> {
  getChatRooms: <ResponseType>(paginationPipeline?: object[]) => Promise<ResponseType>;
  getChatRoomsByUserId: (userId: string) => Promise<IChatRoom[]>;
  getChatRoomByRoomId: (roomId: string) => Promise<IChatRoom>;
  getUsersInChatRoom: (roomId: string) => Promise<string[]>;
  createChatRoom: (name: string, chatInitiator: string) => Promise<IChatRoom>;
  joinChatRoom: (roomId: string, userId: string) => Promise<IChatRoom>;
  leaveChatRoom: (roomId: string, userId: string) => Promise<IChatRoom>;
}

const ChatRoomSchema = new Schema(
  {
    _id: {
      type: String,
      default: () => uuidv4().replace(/\-/g, ''),
    },
    name: String,
    userIds: Array,
    chatInitiator: String,
  },
  {
    timestamps: true,
    collection: 'chatrooms',
  }
);

ChatRoomSchema.statics.getChatRooms = async function (
  paginationPipeline: object[] = [{}]
) {
  try {
    const aggregate = await this.aggregate([
      { $match: {} },
      ...paginationPipeline
    ]);
    return aggregate[0];
  } catch (error) {
    throw error;
  }
};

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

ChatRoomSchema.statics.getUsersInChatRoom = async function (roomId: string) {
  try {
    const room = await this.findOne({ _id: roomId });
    return room.userIds;
  } catch (error) {
    throw error;
  }
};

ChatRoomSchema.statics.createChatRoom = async function (
  name: string,
  chatInitiator: string
) {
  try {
    const newRoom = await this.create({
      name,
      userIds: [chatInitiator],
      chatInitiator,
    });
    return newRoom;
  } catch (error) {
    throw error;
  }
};

ChatRoomSchema.statics.joinChatRoom = async function (
  roomId: string,
  userId: string
) {
  try {
    const room = await this.findOneAndUpdate(
      { _id: roomId },
      { $push: { userIds: userId } },
      { upsert: true, new: true }
    );
    return room;
  } catch (error) {
    throw error;
  }
};

ChatRoomSchema.statics.leaveChatRoom = async function (
  roomId: string,
  userId: string
) {
  try {
    const room = await this.findOneAndUpdate(
      { _id: roomId },
      { $pull: { userIds: userId } },
      { upsert: true, new: true }
    );
    return room;
  } catch (error) {
    throw error;
  }
};

export default mongoose.model<IChatRoom, IChatRoomModel>(
  'ChatRoom',
  ChatRoomSchema
);
