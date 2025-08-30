const express = require('express');
const cors = require('cors');
const multer = require('multer');
const {GoogleAuth} = require('google-auth-library');
const textToSpeech = require('@google-cloud/text-to-speech');
const speech = require('@google-cloud/speech');
const {Translate} = require('@google-cloud/translate').v2;
const vision = require('@google-cloud/vision');
const videoIntelligence = require('@google-cloud/video-intelligence').v1;
const fetch = require('node-fetch');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
app.use(cors());
app.use(express.json());

const ttsClient = new textToSpeech.TextToSpeechClient();
const sttClient = new speech.SpeechClient();
const translateClient = new Translate();
const visionClient = new vision.ImageAnnotatorClient();
const videoClient = new videoIntelligence.VideoIntelligenceServiceClient();
const auth = new GoogleAuth({ scopes: 'https://www.googleapis.com/auth/cloud-platform' });

const getAccessToken = async () => {
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return token.token || token;
};

app.post('/api/tts', async (req, res) => {
  try {
    const { text } = req.body;
    const request = {
      input: { text },
      voice: { languageCode: 'en-US', ssmlGender: 'NEUTRAL' },
      audioConfig: { audioEncoding: 'MP3' },
    };
    const [response] = await ttsClient.synthesizeSpeech(request);
    res.set('Content-Type', 'audio/mpeg');
    res.send(response.audioContent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/stt', upload.single('file'), async (req, res) => {
  try {
    const audioBytes = req.file.buffer.toString('base64');
    const request = {
      audio: { content: audioBytes },
      config: { encoding: 'LINEAR16', languageCode: 'en-US' },
    };
    const [response] = await sttClient.recognize(request);
    const transcript = response.results.map(r => r.alternatives[0].transcript).join('\n');
    res.json({ transcript });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/translate', async (req, res) => {
  try {
    const { text, target } = req.body;
    const [translation] = await translateClient.translate(text, target);
    res.json({ translation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/vision', upload.single('file'), async (req, res) => {
  try {
    const [labelResult] = await visionClient.labelDetection(req.file.buffer);
    const [textResult] = await visionClient.textDetection(req.file.buffer);
    res.json({
      labels: labelResult.labelAnnotations,
      text: textResult.fullTextAnnotation ? textResult.fullTextAnnotation.text : ''
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/video', upload.single('file'), async (req, res) => {
  try {
    const inputContent = req.file.buffer.toString('base64');
    const request = {
      inputContent,
      features: ['LABEL_DETECTION', 'SHOT_CHANGE_DETECTION'],
    };
    const [operation] = await videoClient.annotateVideo(request);
    const [operationResult] = await operation.promise();
    const annotations = operationResult.annotationResults[0];
    res.json({
      labels: annotations.segmentLabelAnnotations,
      shots: annotations.shotAnnotations
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/gemini', async (req, res) => {
  try {
    const { prompt } = req.body;
    const token = await getAccessToken();
    const url = `https://${process.env.VERTEX_LOCATION}-aiplatform.googleapis.com/v1/projects/${process.env.GCP_PROJECT}/locations/${process.env.VERTEX_LOCATION}/publishers/google/models/gemini-pro:generateContent`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      })
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/imagen', async (req, res) => {
  try {
    const { prompt } = req.body;
    const token = await getAccessToken();
    const url = `https://${process.env.VERTEX_LOCATION}-aiplatform.googleapis.com/v1/projects/${process.env.GCP_PROJECT}/locations/${process.env.VERTEX_LOCATION}/publishers/google/models/imagen-2.0:generateContent`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        parameters: { sampleCount: 1 }
      })
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/veo', async (req, res) => {
  try {
    const { prompt } = req.body;
    const token = await getAccessToken();
    const url = `https://${process.env.VERTEX_LOCATION}-aiplatform.googleapis.com/v1/projects/${process.env.GCP_PROJECT}/locations/${process.env.VERTEX_LOCATION}/publishers/google/models/veo-1.5:generateContent`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      })
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
