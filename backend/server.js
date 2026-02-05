import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

const app = express();
const port = 3001;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

const music = [
    { id: 1, title: "Summer Vibes", artist: "Alex Rivers", duration: 180, url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", cover: "https://images.unsplash.com/photo-1514525253344-99a429994c41?q=80&w=600&auto=format" },
    { id: 2, title: "Night Drive", artist: "Jordan Sky", duration: 210, url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", cover: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=600&auto=format" }
];

app.get('/api/music', (req, res) => {
    res.json(music);
});

app.get('/api/health', (req, res) => {
    res.status(200).send('OK');
});

app.listen(port, () => {
    console.log(`Backend server running at http://localhost:${port}`);
});
