import express from 'express';
import { uploadFile, handleUploadError } from '../controllers/uploadController.js';

const router = express.Router();

// Single file upload route
// Field name in form-data should be 'file'
router.post('/', uploadFile, handleUploadError);

export default router;
