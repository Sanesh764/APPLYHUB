const mongoose = require("mongoose");
const logger = require("./logger");

const dns=require("dns");
dns.setServers([
  '1.1.1.1',
  '8.8.8.8'
]);
const connectDB = async () => {
  try {
    const connString = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/applyhub";
    
    logger.info(`Connecting to MongoDB...`);
    
    const conn = await mongoose.connect(connString); 
    //   {//autoIndex: true, // Build indexes automatically in dev, but can configure differently for production
    // });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`, { error });
    process.exit(1);
  }
};

// Post-connection listeners: surface runtime DB failures in the logs rather
// than letting them fail silently after the initial connection succeeds.
mongoose.connection.on("error", (error) => {
  logger.error(`MongoDB connection error: ${error.message}`, { error });
});

mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB disconnected. Attempting to reconnect...");
});

mongoose.connection.on("reconnected", () => {
  logger.info("MongoDB reconnected successfully.");
});

module.exports = connectDB;
