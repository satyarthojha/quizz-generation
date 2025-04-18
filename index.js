
const dbConnection = require('./config/db');
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const session = require('express-session');
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const NodeCache = require('node-cache');
const downloadAudio = require('./utils/download');
const { uploadAudio, transcribeAudio, getTranscript } = require('./utils/transcribe');
const generateQuiz = require('./utils/quiz');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const cache = new NodeCache({ stdTTL: 3600 });

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: "secret",
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

// Local Strategy
passport.use(new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
  const user = await User.findOne({ email });
  if (!user) return done(null, false);
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return done(null, false);
  return done(null, user);
}));

// Google Strategy
passport.use(new GoogleStrategy({
  clientID: "378577685465-pequ1j6uchfgvd5c43a90pespuq4e4kq.apps.googleusercontent.com",
  clientSecret: "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",
  callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  let user = await User.findOne({ googleId: profile.id });
  if (!user) {
    user = await User.create({
      googleId: profile.id,
      name: profile.displayName,
      email: profile.emails[0].value
    });
  }
  done(null, user);
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => done(null, await User.findById(id)));

// Routes
app.use("/auth", require("./routes/auth"));// 🔄 Modular auth route

// Views and Routes
app.get('/', (req, res) => {
  res.render('homepage'); // Make sure the EJS file is named 'homepage.ejs' inside the 'views' folder
});
app.get('/getstarted', (req, res) =>{res.render('home');});
app.get('/contact', (req, res) => res.render('contact'));
app.get('/feature', (req, res) => res.render('feature'));
app.get('/about', (req, res) => res.render('about'));
app.get('/leaderboard', (req, res) => res.render('leaderboard'));
app.get('/home', (req, res) => res.render('home'));
app.get("/dashboard", (req, res) => {
  if (req.isAuthenticated()) {
      res.render("dashboard", { user: req.user }); // ✅ pass user to EJS
  } else {
      res.redirect("/auth/login");
  }
});

app.get('/login',(req,res)=>{
   res.render('login');
});

app.get('/playlists', (req, res) => {
  const playlists = [
    { 
      title: "Blockchain", 
      description: "A collection of videos covering JS fundamentals.", 
      id: 1,
      thumbnail: "https://i.ytimg.com/vi/YJyXfjbBmc8/hqdefault.jpg",
      videoCount: 5,
      lastUpdated: "2 weeks ago"
    },
    { 
      title: "cloud computing", 
      description: "Deep dive into advanced JS concepts.", 
      id: 2,
      thumbnail: "https://i.ytimg.com/vi/8aGhZQkoFbQ/hqdefault.jpg",
      videoCount: 5,
      lastUpdated: "1 month ago"
    },
    { 
      title: "Cryptocurrency", 
      description: "Learn Node.js from beginner to advanced.", 
      id: 3,
      thumbnail: "https://i.ytimg.com/vi/fBNz5xF-Kx4/hqdefault.jpg",
      videoCount: 5,
      lastUpdated: "3 weeks ago"
    },
    { 
      title: "Hyperledger", 
      description: "Complete guide to modern web development.", 
      id: 4,
      thumbnail: "https://i.ytimg.com/vi/dGcsHMXbSOA/hqdefault.jpg",
      videoCount: 5,
      lastUpdated: "5 days ago"
    },
    { 
      title: "Mixed playlist", 
      description: "Everything you need to become a frontend expert.", 
      id: 5,
      thumbnail: "https://i.ytimg.com/vi/qJzyRSJq_T8/hqdefault.jpg",
      videoCount: 5,
      lastUpdated: "1 week ago"
    }
  ];
  res.render('playlists', { playlists });
});

app.get('/playlists/:id', (req, res) => {
  const { id } = req.params;
  const playlistVideos = {
    1:[
      {
        title: "All about Blockchain | Simply Explained",
        embedUrl: "https://www.youtube.com/embed/YJyXfjbBmc8",
        youtubeUrl: "https://www.youtube.com/watch?v=YJyXfjbBmc8",
        channel: "Apna College",
        channelUrl: "https://www.youtube.com/c/ApnaCollegeOfficial",
        publishedDate: "3.9 years ago",
        duration: "5:26",
        views: "1.2M views",
        description: "An introduction to blockchain technology, explaining its fundamentals and applications.",
        thumbnail: "https://i.ytimg.com/vi/YJyXfjbBmc8/hqdefault.jpg",
        likes: "45K",
        comments: "1.2K"
      },
      {
        title: "What is Blockchain?",
        embedUrl: "https://www.youtube.com/embed/frK972EBj38",
        youtubeUrl: "https://www.youtube.com/watch?v=frK972EBj38",
        channel: "Telusko",
        channelUrl: "https://www.youtube.com/c/Telusko",
        publishedDate: "2.3 years ago",
        duration: "15:04",
        views: "856K views",
        description: "A comprehensive explanation of blockchain technology and its working principles.",
        thumbnail: "https://i.ytimg.com/vi/frK972EBj38/hqdefault.jpg",
        likes: "32K",
        comments: "890"
      },
      {
        title: "Blockchain In 7 Minutes | What Is Blockchain | Blockchain Explained | How Blockchain Works | Simplilearn",
        embedUrl: "https://www.youtube.com/embed/yubzJw0uiE4",
        youtubeUrl: "https://www.youtube.com/watch?v=yubzJw0uiE4",
        channel: "Simplilearn",
        channelUrl: "https://www.youtube.com/c/SimplilearnOfficial",
        publishedDate: "6.1 years ago",
        duration: "7:13",
        views: "856K views",
        description: "A concise explanation of blockchain technology, covering its key features and how it operates.",
        thumbnail: "https://i.ytimg.com/vi/yubzJw0uiE4/hqdefault.jpg",
        likes: "32K",
        comments: "890"
      },
      {
        title: "How does a blockchain work - Simply Explained",
        embedUrl: "https://www.youtube.com/embed/SSo_EIwHSd4",
        youtubeUrl: "https://www.youtube.com/watch?v=SSo_EIwHSd4",
        channel: "Simply Explained",
        channelUrl: "https://www.youtube.com/c/SimplyExplained",
        publishedDate: "7.4 years ago",
        duration: "6:27",
        views: "1.5M views",
        description: "An easy-to-understand explanation of how blockchain technology functions.",
        thumbnail: "https://i.ytimg.com/vi/SSo_EIwHSd4/hqdefault.jpg",
        likes: "52K",
        comments: "2.1K"
      },
      {
        title: "Smart contracts - Simply Explained",
        embedUrl: "https://www.youtube.com/embed/ZE2HxTmxfrI",
        youtubeUrl: "https://www.youtube.com/watch?v=ZE2HxTmxfrI",
        channel: "Simply Explained",
        channelUrl: "https://www.youtube.com/c/SimplyExplained",
        publishedDate: "7.4 years ago",
        duration: "5:26",
        views: "980K views",
        description: "An explanation of smart contracts and their role in blockchain technology.",
        thumbnail: "https://i.ytimg.com/vi/ZE2HxTmxfrI/hqdefault.jpg",
        likes: "38K",
        comments: "1.5K"
      }
    ],

    2:[
      {
        title: "The Basics of Google Cloud Platform",
        embedUrl: "https://www.youtube.com/embed/HYmVPhO_CRw",
        youtubeUrl: "https://www.youtube.com/watch?v=HYmVPhO_CRw",
        channel: "iCert Global",
        channelUrl: "https://www.youtube.com/c/iCertGlobal",
        publishedDate: "March 29, 2025",
        duration: "5:26",
        views: "1.2M views",
        description: "An introduction to the fundamentals of Google Cloud Platform (GCP) and its core services.",
        thumbnail: "https://i.ytimg.com/vi/HYmVPhO_CRw/hqdefault.jpg",
        likes: "45K",
        comments: "1.2K"
      },
      {
        title: "Cloud Computing for Beginners",
        embedUrl: "https://www.youtube.com/embed/HJp8NP1HOn8",
        youtubeUrl: "https://www.youtube.com/watch?v=HJp8NP1HOn8",
        channel: "Simplilearn",
        channelUrl: "https://www.youtube.com/c/SimplilearnOfficial",
        publishedDate: "January 15, 2025",
        duration: "10:15",
        views: "856K views",
        description: "A comprehensive guide to understanding the basics of cloud computing and its applications.",
        thumbnail: "https://i.ytimg.com/vi/HJp8NP1HOn8/hqdefault.jpg",
        likes: "32K",
        comments: "890"
      },
      {
        title: "Cloud computing in 6 minutes",
        embedUrl: "https://www.youtube.com/embed/M988_fsOSWo",
        youtubeUrl: "https://www.youtube.com/watch?v=M988_fsOSWo",
        channel: "Simplilearn",
        channelUrl: "https://www.youtube.com/c/SimplilearnOfficial",
        publishedDate: "February 20, 2025",
        duration: "6:00",
        views: "1.5M views",
        description: "A quick overview of cloud computing concepts explained in just six minutes.",
        thumbnail: "https://i.ytimg.com/vi/M988_fsOSWo/hqdefault.jpg",
        likes: "52K",
        comments: "2.1K"
      },
      {
        title: "What is Bitcoin?",
        embedUrl: "https://www.youtube.com/embed/xvo_m_r2ubg",
        youtubeUrl: "https://www.youtube.com/watch?v=xvo_m_r2ubg",
        channel: "Bitcoin Explained",
        channelUrl: "https://www.youtube.com/c/BitcoinExplained",
        publishedDate: "April 5, 2025",
        duration: "8:45",
        views: "980K views",
        description: "An easy-to-understand explanation of what Bitcoin is and how it works.",
        thumbnail: "https://i.ytimg.com/vi/xvo_m_r2ubg/hqdefault.jpg",
        likes: "38K",
        comments: "1.5K"
      },
      {
        title: "What is Bitcoin",
        embedUrl: "https://www.youtube.com/embed/BL5vUVQvmX4",
        youtubeUrl: "https://www.youtube.com/watch?v=BL5vUVQvmX4",
        channel: "Crypto Basics",
        channelUrl: "https://www.youtube.com/c/CryptoBasics",
        publishedDate: "March 10, 2025",
        duration: "7:30",
        views: "723K views",
        description: "A beginner-friendly introduction to Bitcoin and its underlying technology.",
        thumbnail: "https://i.ytimg.com/vi/BL5vUVQvmX4/hqdefault.jpg",
        likes: "28K",
        comments: "750"
      }
    ],

    3: [
      {
        title: "What is Cryptocurrency and How Does it Work?",
        embedUrl: "https://www.youtube.com/embed/Zoz9gvhLgpM",
        youtubeUrl: "https://www.youtube.com/watch?v=Zoz9gvhLgpM",
        channel: "Simply Explained",
        channelUrl: "https://www.youtube.com/c/SimplyExplained",
        publishedDate: "4.2 years ago",
        duration: "6:45",
        views: "1.1M views",
        description: "An easy-to-understand video explaining what cryptocurrency is and how it works.",
        thumbnail: "https://i.ytimg.com/vi/Zoz9gvhLgpM/hqdefault.jpg",
        likes: "41K",
        comments: "1.1K"
      },
      {
        title: "Signing transactions",
        embedUrl: "https://www.youtube.com/embed/kWQ84S13-hw",
        youtubeUrl: "https://www.youtube.com/watch?v=kWQ84S13-hw",
        channel: "Simply Explained",
        channelUrl: "https://www.youtube.com/c/SimplyExplained",
        publishedDate: "3.9 years ago",
        duration: "5:30",
        views: "870K views",
        description: "Learn how digital signatures work in the world of blockchain and cryptocurrency.",
        thumbnail: "https://i.ytimg.com/vi/kWQ84S13-hw/hqdefault.jpg",
        likes: "29K",
        comments: "860"
      },
      {
        title: "Mining rewards & transactions",
        embedUrl: "https://www.youtube.com/embed/fRV6cGXVQ4I",
        youtubeUrl: "https://www.youtube.com/watch?v=fRV6cGXVQ4I",
        channel: "Simply Explained",
        channelUrl: "https://www.youtube.com/c/SimplyExplained",
        publishedDate: "3.7 years ago",
        duration: "6:12",
        views: "950K views",
        description: "Understand the role of mining in cryptocurrency networks and how rewards work.",
        thumbnail: "https://i.ytimg.com/vi/fRV6cGXVQ4I/hqdefault.jpg",
        likes: "33K",
        comments: "990"
      },
      {
        title: "Implementing Proof of Work in JavaScript",
        embedUrl: "https://www.youtube.com/embed/HneatE69814",
        youtubeUrl: "https://www.youtube.com/watch?v=HneatE69814",
        channel: "Simply Explained",
        channelUrl: "https://www.youtube.com/c/SimplyExplained",
        publishedDate: "3.5 years ago",
        duration: "7:20",
        views: "800K views",
        description: "A hands-on JavaScript tutorial to implement proof-of-work algorithm step by step.",
        thumbnail: "https://i.ytimg.com/vi/HneatE69814/hqdefault.jpg",
        likes: "30K",
        comments: "730"
      },
      {
        title: "Creating a blockchain with JavaScript",
        embedUrl: "https://www.youtube.com/embed/zVqczFZr124",
        youtubeUrl: "https://www.youtube.com/watch?v=zVqczFZr124",
        channel: "Simply Explained",
        channelUrl: "https://www.youtube.com/c/SimplyExplained",
        publishedDate: "3.3 years ago",
        duration: "10:15",
        views: "1.3M views",
        description: "A complete beginner's tutorial to build a blockchain in JavaScript from scratch.",
        thumbnail: "https://i.ytimg.com/vi/zVqczFZr124/hqdefault.jpg",
        likes: "47K",
        comments: "1.3K"
      }
    ],

    4: [
      {
        title: "What is Blockchain",
        embedUrl: "https://www.youtube.com/embed/93E_GzvpMA0",
        youtubeUrl: "https://www.youtube.com/watch?v=93E_GzvpMA0",
        channel: "Simplilearn",
        channelUrl: "https://www.youtube.com/c/SimplilearnOfficial",
        publishedDate: "4.6 years ago",
        duration: "6:20",
        views: "1.1M views",
        description: "A beginner-friendly video explaining what blockchain is and how it is transforming industries.",
        thumbnail: "https://i.ytimg.com/vi/93E_GzvpMA0/hqdefault.jpg",
        likes: "42K",
        comments: "1.2K"
      },
      {
        title: "What is Hyperledger",
        embedUrl: "https://www.youtube.com/embed/Y177TCUc4g0",
        youtubeUrl: "https://www.youtube.com/watch?v=Y177TCUc4g0",
        channel: "Simply Explained",
        channelUrl: "https://www.youtube.com/c/SimplyExplained",
        publishedDate: "3.8 years ago",
        duration: "5:02",
        views: "784K views",
        description: "An introduction to Hyperledger, its frameworks, and how it's used in blockchain development.",
        thumbnail: "https://i.ytimg.com/vi/Y177TCUc4g0/hqdefault.jpg",
        likes: "27K",
        comments: "810"
      },
      {
        title: "What is Hyperledger?",
        embedUrl: "https://www.youtube.com/embed/wBWiqssisuQ",
        youtubeUrl: "https://www.youtube.com/watch?v=wBWiqssisuQ",
        channel: "Simplilearn",
        channelUrl: "https://www.youtube.com/c/SimplilearnOfficial",
        publishedDate: "4.1 years ago",
        duration: "7:10",
        views: "912K views",
        description: "A complete overview of Hyperledger and how it's revolutionizing enterprise blockchain.",
        thumbnail: "https://i.ytimg.com/vi/wBWiqssisuQ/hqdefault.jpg",
        likes: "31K",
        comments: "950"
      },
      {
        title: "Power BI Installation Tutorial for Beginners",
        embedUrl: "https://www.youtube.com/embed/40DSxuI9vXA",
        youtubeUrl: "https://www.youtube.com/watch?v=40DSxuI9vXA",
        channel: "Tech with Tim",
        channelUrl: "https://www.youtube.com/c/TechWithTim",
        publishedDate: "2.9 years ago",
        duration: "8:33",
        views: "670K views",
        description: "Step-by-step Power BI installation and setup tutorial for beginners.",
        thumbnail: "https://i.ytimg.com/vi/40DSxuI9vXA/hqdefault.jpg",
        likes: "24K",
        comments: "710"
      },
      {
        title: "What is Power BI - Complete Introduction",
        embedUrl: "https://www.youtube.com/embed/4Z4hEq7hyC8",
        youtubeUrl: "https://www.youtube.com/watch?v=4Z4hEq7hyC8",
        channel: "Simplilearn",
        channelUrl: "https://www.youtube.com/c/SimplilearnOfficial",
        publishedDate: "3.3 years ago",
        duration: "9:10",
        views: "1M views",
        description: "A complete beginner introduction to Power BI, its tools, and visualization features.",
        thumbnail: "https://i.ytimg.com/vi/4Z4hEq7hyC8/hqdefault.jpg",
        likes: "39K",
        comments: "1.1K"
      }
    ],
    5: [
      {
        title: "NFT Explained In 5 Minutes",
        embedUrl: "https://www.youtube.com/embed/NNQLJcJEzv0",
        youtubeUrl: "https://www.youtube.com/watch?v=NNQLJcJEzv0",
        channel: "Simplilearn",
        channelUrl: "https://www.youtube.com/c/SimplilearnOfficial",
        publishedDate: "3.2 years ago",
        duration: "5:10",
        views: "812K views",
        description: "A short and clear explanation of NFTs (Non-Fungible Tokens) and how they work in the digital world.",
        thumbnail: "https://i.ytimg.com/vi/NNQLJcJEzv0/hqdefault.jpg",
        likes: "36K",
        comments: "970"
      },
      {
        title: "Cryptocurrency In 5 Minutes",
        embedUrl: "https://www.youtube.com/embed/1YyAzVmP9xQ",
        youtubeUrl: "https://www.youtube.com/watch?v=1YyAzVmP9xQ",
        channel: "Simplilearn",
        channelUrl: "https://www.youtube.com/c/SimplilearnOfficial",
        publishedDate: "3.7 years ago",
        duration: "5:01",
        views: "1.1M views",
        description: "Learn the basics of cryptocurrency in just 5 minutes — perfect for beginners entering the crypto space.",
        thumbnail: "https://i.ytimg.com/vi/1YyAzVmP9xQ/hqdefault.jpg",
        likes: "42K",
        comments: "1.1K"
      },
      {
        title: "What is Fintech",
        embedUrl: "https://www.youtube.com/embed/BAI91qOmaSs",
        youtubeUrl: "https://www.youtube.com/watch?v=BAI91qOmaSs",
        channel: "Simplilearn",
        channelUrl: "https://www.youtube.com/c/SimplilearnOfficial",
        publishedDate: "2.5 years ago",
        duration: "7:20",
        views: "543K views",
        description: "An overview of the fintech industry, exploring how technology is transforming financial services.",
        thumbnail: "https://i.ytimg.com/vi/BAI91qOmaSs/hqdefault.jpg",
        likes: "28K",
        comments: "620"
      },
      {
        title: "How does a blockchain work - Simply Explained",
        embedUrl: "https://www.youtube.com/embed/SSo_EIwHSd4",
        youtubeUrl: "https://www.youtube.com/watch?v=SSo_EIwHSd4",
        channel: "Simply Explained",
        channelUrl: "https://www.youtube.com/c/SimplyExplained",
        publishedDate: "7.4 years ago",
        duration: "6:27",
        views: "1.5M views",
        description: "An easy-to-understand explanation of how blockchain technology functions.",
        thumbnail: "https://i.ytimg.com/vi/SSo_EIwHSd4/hqdefault.jpg",
        likes: "52K",
        comments: "2.1K"
      },
      {
        title: "Fintech: How it works",
        embedUrl: "https://www.youtube.com/embed/PuAbqwTDeh0",
        youtubeUrl: "https://www.youtube.com/watch?v=PuAbqwTDeh0",
        channel: "World Economic Forum",
        channelUrl: "https://www.youtube.com/c/wef",
        publishedDate: "1.9 years ago",
        duration: "4:58",
        views: "389K views",
        description: "A quick explanation of how fintech operates, with real-world examples and its role in innovation.",
        thumbnail: "https://i.ytimg.com/vi/PuAbqwTDeh0/hqdefault.jpg",
        likes: "18K",
        comments: "510"
      }
    ]
    
    
    


    
    
    
    // Add other playlists with similar structure...
  };

  const videos = playlistVideos[id] || [];
  const playlistInfo = {
    1: { title: "JavaScript Basics", description: "Master JavaScript fundamentals" },
    2: { title: "Advanced JavaScript", description: "Deep dive into advanced concepts" },
    3: { title: "Node.js Tutorials", description: "Learn Node.js from scratch" },
    4: { title: "Web Development Crash Course", description: "Full stack development guide" },
    5: { title: "Frontend Mastery", description: "Become a frontend expert" }
  };

  res.render('playlist', {
    videos,
    playlistTitle: playlistInfo[id]?.title || `Playlist ${id}`,
    playlistDescription: playlistInfo[id]?.description || "",
    playlistId: id
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

app.get('/transcribe', async (req, res) => {
  const videoUrl = req.query.videoUrl;

  if (!videoUrl) {
    return res.status(400).json({ error: 'YouTube URL is required' });
  }

  try {
    const cached = cache.get(videoUrl);
    if (cached) return res.json(cached);

    const audioPath = await downloadAudio(videoUrl, './public');
    const uploadUrl = await uploadAudio(audioPath);
    const transcriptId = await transcribeAudio(uploadUrl);
    const transcript = await getTranscript(transcriptId);
    const quiz = await generateQuiz(transcript);

    cache.set(videoUrl, { quiz });
    res.json({ quiz });

  } catch (error) {
    console.error(`Error processing ${videoUrl}:`, error);
    const status = error.response?.status || 500;
    res.status(status).json({
      error: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
