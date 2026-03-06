const mongoose = require('mongoose');
const User = require('./backend/models/User');

mongoose.connect('mongodb+srv://strideadmin:strideadmin@cluster0.edd4ioz.mongodb.net/stride?retryWrites=true&w=majority&appName=Cluster0')
  .then(async () => {
    const user = await User.findOne({ username: 'purushotham' });
    console.log("Followers:", user.followers);
    console.log("Following:", user.following);

    const ids = user.following || [];
    console.log("IDs to batch fetch:", ids);

    const users = await User.find({
        $or: [
            { _id: { $in: ids.filter(id => mongoose.Types.ObjectId.isValid(id)) } },
            { email: { $in: ids } },
            { username: { $in: ids } }
        ]
    }, 'username name email avatar activeAvatarFrame');
    
    console.log("Found users length:", users.length);
    console.log("Found users:", users);

    mongoose.connection.close();
  });
