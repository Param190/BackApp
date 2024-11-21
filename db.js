const {MongoClient, GridFSBucket} = require('mongodb');
const dotenv = require('dotenv');

let gfsBucket;

const dbName = "test";

//loading env
dotenv.config();
const client = new MongoClient(process.env.MONGO_URI);

const connectDB = async () => {
    try {
      await client.connect();
      console.log(`MongoDB Connected `);

      const db = client.db(dbName);
      gfsBucket = new GridFSBucket(db,{bucketName: 'uploads'});
      return{db,gfsBucket};

    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
  }

module.exports = { connectDB, client };