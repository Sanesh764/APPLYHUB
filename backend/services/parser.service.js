const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const logger = require("../config/logger");

class ParserService {
  /**
   * Extract raw text from file buffer based on MIME type
   * @param {Buffer} fileBuffer 
   * @param {string} mimeType 
   * @returns {Promise<string>}
   */
  async extractText(fileBuffer, mimeType) {
    logger.info(`Parser Service: Initiating text extraction for MIME type: ${mimeType}`);

    try {
      if (mimeType === "application/pdf") {
        return await this.parsePDF(fileBuffer);
      } else if (
        mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        mimeType === "application/msword"
      ) {
        return await this.parseDOCX(fileBuffer);
      } else if (mimeType === "text/plain") {
        if (!fileBuffer || fileBuffer.length === 0) {
          throw new Error("The text document is empty.");
        }
        return fileBuffer.toString("utf-8");
      } else {
        throw new Error("Unsupported document type. Please upload a PDF, DOC, or DOCX file.");
      }
    } catch (error) {
      logger.error(`Parser Service: Text extraction failed: ${error.message}`, { error });
      throw new Error(error.message);
    }
  }

  /**
   * Parse PDF files using pdf-parse version 2.x (class-based)
   */
  async parsePDF(fileBuffer) {
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error("The PDF document is empty.");
    }

    try {
      // 1. Convert Buffer to Uint8Array as required by newer PDFJS-based parsers
      const uint8Array = new Uint8Array(fileBuffer);
      
      // 2. Instantiate and run class-based parser
      const parser = new pdfParse.PDFParse(uint8Array);
      const result = await parser.getText();
      
      if (!result || !result.text || !result.text.trim()) {
        throw new Error("The PDF document contains no readable text contents.");
      }

      // Clean up whitespace issues or extra carriage returns
      return result.text.replace(/\r\n/g, "\n").replace(/\n+/g, "\n");
    } catch (error) {
      logger.error("Parser Service: PDF parsing error details", { error: error.message, stack: error.stack });

      // Handle specific exceptions from pdf-parse 2.x
      if (error.name === "PasswordException" || error instanceof pdfParse.PasswordException) {
        throw new Error("The PDF document is password-protected. Please unlock the file and try again.");
      }
      if (error.name === "InvalidPDFException" || error instanceof pdfParse.InvalidPDFException) {
        throw new Error("The document is not a valid PDF or is corrupted.");
      }
      if (error.name === "FormatError" || error instanceof pdfParse.FormatError) {
        throw new Error("The PDF document format is invalid or unsupported.");
      }
      
      throw new Error("Could not parse PDF document: " + error.message);
    }
  }

  /**
   * Parse Word documents using mammoth
   */
  async parseDOCX(fileBuffer) {
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error("The DOCX document is empty.");
    }

    try {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      if (!result || !result.value || !result.value.trim()) {
        throw new Error("The DOCX document contains no readable text contents.");
      }
      return result.value.replace(/\r\n/g, "\n").replace(/\n+/g, "\n");
    } catch (error) {
      logger.error("Parser Service: mammoth docx failure", { error: error.message });
      throw new Error("Could not parse Word document: " + error.message);
    }
  }
}

module.exports = new ParserService();
