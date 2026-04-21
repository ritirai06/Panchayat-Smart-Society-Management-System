const cloudinary = require('cloudinary').v2;

let _configured = false;

const configure = () => {
  if (_configured) return true;
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) return false;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  _configured = true;
  return true;
};

/**
 * Upload a file buffer to Cloudinary.
 * @param {Buffer} buffer  - file buffer from multer memoryStorage
 * @param {string} folder  - Cloudinary folder name
 * @returns {Promise<{url: string, publicId: string}>}
 */
const uploadImage = (buffer, folder = 'panchayat/complaints') => {
  if (!configure()) throw new Error('Cloudinary not configured');
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'auto', transformation: [{ quality: 'auto', fetch_format: 'auto' }] },
      (err, result) => {
        if (err) return reject(err);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
};

/**
 * Delete an image from Cloudinary by publicId.
 */
const deleteImage = async (publicId) => {
  if (!configure()) return;
  await cloudinary.uploader.destroy(publicId).catch(() => {});
};

module.exports = { uploadImage, deleteImage };
