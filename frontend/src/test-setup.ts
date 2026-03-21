/**
 * Jest Global Setup
 * 
 * Wird vor allen Tests geladen. Mockt Module die import.meta.env
 * verwenden, da Jest dies nicht nativ unterstützt.
 */

// TextEncoder/TextDecoder are used by react-router-dom but missing in older jsdom versions
import { TextEncoder, TextDecoder } from 'util';
Object.assign(global, { TextEncoder, TextDecoder });

// config.ts verwendet import.meta.env — global mocken
jest.mock('../config', () => ({
  BACKEND_URL: 'http://localhost:8081',
}));
