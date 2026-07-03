require("dotenv").config();
const app = require("../app");
const http = require("http");
const axios = require("axios");

async function testApi() {
  const server = http.createServer(app);
  server.listen(9000, async () => {
    console.log("Started temporary API server on port 9000...");
    try {
      const response = await axios.post("http://localhost:9000/api/v1/test/email", {
        email: "sanesh7644@gmail.com",
      });
      console.log("\nAPI RESPONSE STATUS:", response.status);
      console.log("API RESPONSE BODY:", JSON.stringify(response.data, null, 2));
      server.close();
      console.log("\nTemporary API server stopped.");
    } catch (err) {
      console.error("\n❌ API REQUEST FAILED!");
      console.error("API Response Error:", err.response ? err.response.data : err.message);
      server.close();
      process.exit(1);
    }
  });
}

testApi();
