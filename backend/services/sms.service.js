const logger = require("../config/logger");

class SMSService {
  constructor() {
    this.client = null;
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_FROM_NUMBER;

    if (accountSid && authToken && this.fromNumber) {
      try {
        // Dynamically require twilio in case it's not installed or optional
        const twilio = require("twilio");
        this.client = twilio(accountSid, authToken);
        logger.info("SMS Service: Twilio initialized successfully.");
      } catch (err) {
        logger.error("SMS Service: Failed to initialize Twilio client:", err);
      }
    } else {
      logger.info(
        "SMS Service: Twilio credentials missing. Running in DEV MODE (OTP will print to console)."
      );
    }
  }

  /**
   * Send an OTP code to a phone number
   * @param {string} phone 
   * @param {string} code 
   */
  async sendOTP(phone, code) {
    const messageBody = `[ApplyHub] Your verification code is ${code}. It expires in 5 minutes. Please do not share this code.`;

    if (this.client && this.fromNumber) {
      try {
        const message = await this.client.messages.create({
          body: messageBody,
          from: this.fromNumber,
          to: phone,
        });
        logger.info(`SMS Service: SMS sent to ${phone}. Message SID: ${message.sid}`);
        return true;
      } catch (error) {
        logger.error(`SMS Service: Failed to send SMS to ${phone}: ${error.message}`, { error });
        throw new Error("Failed to send OTP via SMS. Please try again later.");
      }
    } else {
      // DEV MODE
      logger.warn(`
==================================================
[SMS Service] [DEV MODE]
To: ${phone}
Body: ${messageBody}
==================================================
      `);
      return true;
    }
  }
}

module.exports = new SMSService();
