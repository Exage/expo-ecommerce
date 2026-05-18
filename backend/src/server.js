import { ENV } from "./config/env.js";
import { connectDB } from "./config/db.js";
import app from "./app.js";

const startServer = async () => {
  await connectDB();
  app.listen(ENV.PORT, () => {
    console.log("Server is up and running");
  });
};

startServer();

export default app;
