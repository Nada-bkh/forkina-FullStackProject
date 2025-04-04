const mongoose = require('mongoose');
const User = require('./models/userModel'); // Adjust path if needed
const Class = require('./models/classModel'); // Adjust path if needed

// Set strictQuery to true to suppress the deprecation warning
mongoose.set('strictQuery', true);

async function updateUserClasses() {
    try {
        // Connect to your MongoDB database
        await mongoose.connect('mongodb://localhost:27017/yourDatabase', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB');

        // Map class names to their ObjectIds
        const classes = await Class.find({});
        const classMap = {};
        classes.forEach((cls) => {
            classMap[cls.name] = cls._id;
        });

        // Find users with string classe values
        const users = await User.find({ classe: { $type: 'string' } });
        console.log(`Found ${users.length} users with string classe values`);

        for (const user of users) {
            if (classMap[user.classe]) {
                // Update to ObjectId
                user.classe = classMap[user.classe];
                await user.save();
                console.log(`Updated user ${user.email} to class ${user.classe}`);
            } else if (user.classe === '--') {
                // Set unassigned classes to null
                user.classe = null;
                await user.save();
                console.log(`Set user ${user.email} classe to null`);
            } else {
                console.log(`Class ${user.classe} not found for user ${user.email}`);
            }
        }

        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        // Disconnect from MongoDB
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run the migration script
updateUserClasses().catch(console.error);