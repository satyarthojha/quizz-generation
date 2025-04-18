const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
require('dotenv').config();

const assemblyApiKey = process.env.ASSEMBLYAI_API_KEY;

const uploadAudio = async (filePath) => {
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));

    const response = await axios.post('https://api.assemblyai.com/v2/upload', formData, {
      headers: {
        authorization: assemblyApiKey,
        ...formData.getHeaders(),
      },
    });

    console.log('Upload response:', response.data);  // Logging the response

    if (!response.data || !response.data.upload_url) {
      throw new Error('Failed to upload audio.');
    }

    return response.data.upload_url;
  } catch (error) {
    console.error('Upload error:', error.message);
    throw new Error(`Upload failed: ${error.message}`);
  }
};

const transcribeAudio = async (audioUrl) => {
  try {
    const response = await axios.post('https://api.assemblyai.com/v2/transcript', {
      audio_url: audioUrl,
    }, {
      headers: { authorization: assemblyApiKey },
    });

    console.log('Transcription response:', response.data);  // Logging the response

    if (!response.data || !response.data.id) {
      throw new Error('Failed to initiate transcription.');
    }

    return response.data.id;
  } catch (error) {
    console.error('Transcription error:', error.message);
    throw new Error(`Transcription failed: ${error.message}`);
  }
};

const getTranscript = async (transcriptId) => {
  try {
    const url = `https://api.assemblyai.com/v2/transcript/${transcriptId}`;
    let transcript;

    while (true) {
      const response = await axios.get(url, {
        headers: { authorization: assemblyApiKey },
      });

      console.log('Transcript status:', response.data.status);  // Logging the status

      transcript = response.data;

      if (transcript.status === 'completed') break;
      if (transcript.status === 'failed') throw new Error('Transcription failed');
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    console.log('Final transcript:', transcript.text);  // Logging the transcript

    return transcript.text;
  } catch (error) {
    console.error('Transcript fetching error:', error.message);
    throw new Error(`Fetching transcript failed: ${error.message}`);
  }
};

module.exports = { uploadAudio, transcribeAudio, getTranscript };
