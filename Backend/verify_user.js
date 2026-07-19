const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.findOne({ email: 'testadmin@gmail.com' });
    if (user) {
      user.isVerified = true;
      user.verificationToken = undefined;
      user.verificationTokenExpiry = undefined;
      await user.save();
      console.log("SUCCESS_VERIFIED");
    } else {
      console.log("USER_NOT_FOUND");
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.connection.close();
  }
}
run();
