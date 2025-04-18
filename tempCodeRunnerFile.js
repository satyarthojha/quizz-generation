const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const downloadAudio = require('./utils/download');
const { uploadAudio, transcribeAudio, getTranscript } = require('./utils/transcribe');
const generateQuiz = require('./utils/quiz');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
  res.render('home');
});

app.get('/transcribe', async (req, res) => {
  const videoUrl = req.query.videoUrl;
  try {
    const audioPath = await downloadAudio(videoUrl, './public');
    const uploadUrl = await uploadAudio(audioPath);
    const transcriptId = await transcribeAudio(uploadUrl);
    const transcript = await getTranscript(transcriptId);
    const quiz = await generateQuiz(transcript);
    res.json({ quiz });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
