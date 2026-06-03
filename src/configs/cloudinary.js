import cloudinary from 'cloudinary';
import config from './environment.js';

cloudinary.v2.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

export const uploadToCloudinary = async (file, folder = 'paceup') => {
  try {
    const result = await cloudinary.v2.uploader.upload(file.path, {
      folder: `paceup/${folder}`,
      resource_type: 'auto',
    });
    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      size: result.bytes,
      format: result.format,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

export const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.v2.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

export const getCloudinaryUrl = (publicId, options = {}) => {
  return cloudinary.v2.url(publicId, {
    secure: true,
    ...options,
  });
};

export default {
  uploadToCloudinary,
  deleteFromCloudinary,
  getCloudinaryUrl,
};
