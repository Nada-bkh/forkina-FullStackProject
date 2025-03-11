// src/utils/errorHandler.js
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error
    const message = error.response.data?.message || 'Server error occurred';
    const status = error.response.status;
    return { message, status };
  } else if (error.request) {
    // Request made but no response
    return { message: 'No response from server', status: 503 };
  } else {
    // Request setup error
    return { message: 'Failed to make request', status: 500 };
  }
};