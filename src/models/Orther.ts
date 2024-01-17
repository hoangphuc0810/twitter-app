import { ObjectId } from 'mongodb';
import { MeidaType, TweetAudiance, TweetType } from '~/constants/enums'

export interface Media {
  url: string
  type: MeidaType
}

export interface newBodyType {
  hashtags: ObjectId[];
    user_id: string;
    type: TweetType;
    audience: TweetAudiance;
    content: string;
    parent_id: string | null;
    mentions: string[];
    medias: Media[];
    guest_views?: number | undefined;
    user_views?: number | undefined;
    created_at?: Date | undefined;
    updated_at?: Date | undefined;
}
