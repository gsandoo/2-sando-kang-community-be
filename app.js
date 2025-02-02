const express = require('express');
const timeout = require('connect-timeout');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const morgan = require('morgan');
const moment = require('moment-timezone');
const rotatingFileStream = require('rotating-file-stream');
const fs = require('fs');
const dotenv = require('dotenv');

const globalErrorHandler = require('./middleware/globalErrorHandler');

const app = express();
const PORT = 3000;


if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
  console.log('Loaded .env.local');
} else {
  console.log('.env.local file not found');
}

app.set('trust proxy', 1); 

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,
  message: 'api 과다 요청 발생. 5분 뒤에 다시 요청하세요',
  standardHeaders: true,
  legacyHeaders: false,
});

// 로그 파일 설정
morgan.token('date', () => moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'));

const logDirectory = path.join(__dirname, 'log');
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

const accessLogStream = rotatingFileStream.createStream('access.log', {
  interval: '1d',
  path: logDirectory,
});

// Middleware
app.use(
  morgan(
    ':remote-addr - :remote-user [:date[Asia/Seoul]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"',
    { stream: accessLogStream }
  )
);

app.use(express.json());
app.use(timeout('30s'));
app.use(haltOnTimedout);
app.use(limiter);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(globalErrorHandler);

const corsOptions = {
  origin: "*",
  methods: ['GET', 'POST', 'PUT', 'DELETE' , 'PATCH'],
  credentials: true, 
};
app.use(cors(corsOptions));


// Helmet 보안 설정
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https://*.community.com"],
        fontSrc: ["'self'"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
  })
);

// 라우터 설정
const authRouter = require('./routes/authRoutes');
const postRouter = require('./routes/postRoutes');
const commentRouter = require('./routes/commentRoutes');
const healthRouter = require('./routes/healthRoutes');

app.use('/api/auth', authRouter);
app.use('/api/post', postRouter);
app.use('/api/comment', commentRouter);
app.use('/api/health', healthRouter);

app.get('/', (req, res) => {
  res.send('Hello, Express new EC2 Deployed!');
});

app.get('/terms', (req, res) => {
  res.sendFile(path.join(__dirname, 'terms', 'terms.html'));
});

app.get('/privacy', (req, res) => {
  res.sendFile(path.join(__dirname, 'terms', 'privacy.html'));
});

// 서버 실행
app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});

// 타임아웃 핸들러
function haltOnTimedout(req, res, next) {
  if (!req.timedout) next();
}
