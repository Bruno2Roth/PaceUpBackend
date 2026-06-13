import axios from 'axios';
import querystring from 'querystring';
import config from '../configs/environment.js';

export function generateState() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function buildAuthorizationUrl(baseUrl, params) {
  const qs = querystring.stringify(params);
  return `${baseUrl}?${qs}`;
}

export async function exchangeCode(url, data, authHeader = null) {
  const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
  if (authHeader) headers.Authorization = authHeader;
  const response = await axios.post(url, querystring.stringify(data), { headers });
  return response.data;
}

export async function refreshAccessToken(url, data, authHeader = null) {
  const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
  if (authHeader) headers.Authorization = authHeader;
  const response = await axios.post(url, querystring.stringify(data), { headers });
  return response.data;
}

export function isTokenExpired(expiresAt) {
  if (!expiresAt) return true;
  const expiry = new Date(expiresAt);
  return expiry.getTime() - Date.now() < 5 * 60 * 1000;
}

export default {
  generateState, buildAuthorizationUrl, exchangeCode,
  refreshAccessToken, isTokenExpired,
};
