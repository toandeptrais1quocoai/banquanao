import { asyncHandler } from '../middleware/asyncHandler.js';
import * as chatService from '../services/chatService.js';

export const chat = asyncHandler(async (req, res) => {
  res.json(await chatService.chat(req.body || {}));
});
