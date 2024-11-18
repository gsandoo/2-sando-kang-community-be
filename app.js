const express = require('express');
const timeout = require('connect-timeout');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const path = require('path');
const morgan = require('morgan');
const moment = require('moment-timezone');
const rotatingFileStream = require('rotating-file-stream');
const fs = require('fs');
const db = require('./db/db'); // 데이터베이스 연결 가져오기

const app = express();
const PORT = 3000;

// 세션 저장소 설정
const sessionStore = new MySQLStore({}, db);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
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
app.use(cors());
app.use(express.json());
app.use(timeout('15s'));
app.use(haltOnTimedout);
app.use(limiter);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Helmet 보안 설정
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https://*.example.com"],
        fontSrc: ["'self'"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
  })
);

// 세션 설정
app.use(
  session({
    secret: 'my_secret_key',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: { secure: false }, // https 환경에서는 true로 변경
  })
);

// 라우터 설정
const authRouter = require('./routes/authRoutes');
const postRouter = require('./routes/postRoutes');
const commentRouter = require('./routes/commentRoutes');

app.use('/api/auth', authRouter);
app.use('/api/post', postRouter);
app.use('/api/comment', commentRouter);

app.get('/', (req, res) => {
  res.send('Hello, Express!');
});

app.get('/terms', (req, res) => {
  res.sendFile(path.join(__dirname, 'terms', 'terms.html'));
});

app.get('/privacy', (req, res) => {
  res.sendFile(path.join(__dirname, 'terms', 'privacy.html'));
});

// 서버 실행
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// 타임아웃 핸들러
function haltOnTimedout(req, res, next) {
  if (!req.timedout) next();
}