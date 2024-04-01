import crypto from "crypto";
import { UsernameOptions } from "./helper.interface";

/**
 * Generates a unique username.
 * @param {Object} options - Options for generating the username.
 * @param {number} options.size - The length of the username (default: 12).
 * @param {string} options.prefix - A prefix to add to the username (default: '').
 * @param {string} options.suffix - A suffix to add to the username (default: '').
 * @param {boolean} options.lowercase - Whether to convert the username to lowercase (default: true).
 * @returns {string} A unique username.
 */
export function generateUniqueUsername(options: UsernameOptions = {}): string {
  const { size = 12, prefix = "", suffix = "", lowercase = true } = options;

  const buffer = crypto.randomBytes(Math.ceil(size / 2));
  let username = buffer.toString("hex").slice(0, size);

  if (prefix) {
    username = `${prefix}${username}`;
  }

  if (suffix) {
    username = `${username}${suffix}`;
  }

  if (lowercase) {
    username = username.toLowerCase();
  }

  return username;
}
