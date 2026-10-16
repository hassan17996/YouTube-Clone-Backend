// Define the relationships between models

import {User} from './user.model.js'
import { Video } from "./video.model.js";
import { Comment } from "./comment.model.js";
import { Reaction } from "./reaction.model.js";
import { Subscription } from "./subscription.model.js";
import { Otp } from "./otp.model.js";

// User -> Video

    // as => Association Alias => name will I use to reach the videos of users 
User.hasMany(Video, {foreignKey: "userId", onDelete: "CASCADE", as: "videos"});
Video.belongsTo(User, {foreignKey: "userId" , as: "user"});

// Video -> Comment
Video.hasMany(Comment, { foreignKey: "videoId", as: "comments", onDelete: "CASCADE" });
Comment.belongsTo(Video, { foreignKey: "videoId", as: "video" });

// User -> Comment 
User.hasMany(Comment, { foreignKey: "userId", as: "comments", onDelete: "CASCADE" });
Comment.belongsTo(User, { foreignKey: "userId", as: "user" })


// Video -> Reaction
Video.hasMany(Reaction, {foreignKey: "videoId", as: "reactions", onDelete: "CASCADE"});
Reaction.belongsTo(Video, {foreignKey: "videoId", as: "video"});

// User -> Reaction
User.hasMany(Reaction, {foreignKey: "userId", as: "reactions", onDelete: "CASCADE"});
Reaction.belongsTo(User, {foreignKey: "userId", as: "user"});

// Subscriptions (User <-> User)

    // user can subscribe in many channels ==> as will be subscriptions
    // so subscriberId is constant ==> so fk will be subscriberId
User.hasMany(Subscription, { foreignKey: "subscriberId", as: "subscriptions", onDelete: "CASCADE" });
Subscription.belongsTo(User, { foreignKey: "subscriberId", as: "subscriber" });

    // owner of channel has many subscribers, as will be subscribers
    // so channelId is constant ==> so fk will be channelId
User.hasMany(Subscription, { foreignKey: "channelId", as: "subscribers", onDelete: "CASCADE" });
Subscription.belongsTo(User, { foreignKey: "channelId", as: "channel" });

export { User, Video, Comment, Reaction, Subscription, Otp };