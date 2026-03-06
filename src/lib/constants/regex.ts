export const REGEX = {
    URL: /^(https?:\/\/)?(([a-z0-9-]+\.)+[a-z]{2,}|localhost)(:[0-9]+)?(\/.*)?$/i,
    YOUTUBE_URL: /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/i,
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/i,
    PHONE: /^\+?[1-9]\d{1,14}$/,
};
