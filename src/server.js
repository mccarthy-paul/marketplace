// src/server.js (marketplace API)
// ...
import authCallbackRouter from './routes/authCallback.js';
app.use('/auth/juno', authCallbackRouter);     // GET /auth/juno/callback
