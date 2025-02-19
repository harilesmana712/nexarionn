const express = require('express');
const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState } = require('@whiskeysockets/baileys');
const P = require('pino');
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const PREFIXES = ['!', '.', '#', '/' , '$'];

// Load settings from file
const settingsPath = path.join(__dirname, 'settings.json');
let settings = { welcomeMessage: 'Welcome @user!', leftMessage: 'Goodbye @user!', menuMessage: 'Default menu', menuImage: 'menu.jpg' };
if (fs.existsSync(settingsPath)) {
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
}
// Load custom cases from file
const casesPath = path.join(__dirname, 'cases.json');
let customCases = {};
if (fs.existsSync(casesPath)) {
    customCases = JSON.parse(fs.readFileSync(casesPath, 'utf8'));
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: P({ level: 'silent' })
    });

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', (update) => {
        const { connection } = update;
        if (connection === 'close') {
            console.log('Connection closed, reconnecting...');
            startBot();
        } else if (connection === 'open') {
            console.log('Bot connected!');
        }
    });

    sock.ev.on('group-participants.update', async (update) => {
        const { id, participants, action } = update;
        for (const participant of participants) {
            const message = action === 'add' ? settings.welcomeMessage : settings.leftMessage;
            const renderedMessage = message.replace('@user', `@${participant.split('@')[0]}`);
            await sock.sendMessage(id, { text: renderedMessage, mentions: [participant] });
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
      const msg = m.messages[0];
      if (!msg.message || msg.key.fromMe) return;
  
      // Pastikan pesan memiliki teks (termasuk caption dari gambar/video)
      const text = msg.message.conversation ||
                   msg.message.extendedTextMessage?.text ||
                   msg.message.imageMessage?.caption ||
                   msg.message.videoMessage?.caption;
  
      if (!text || !PREFIXES.some(prefix => text.startsWith(prefix))) return;
      
      const sender = msg.key.remoteJid;
      const groupMetadata = sender.endsWith('@g.us') ? await sock.groupMetadata(sender) : null;
      
      const prefixUsed = PREFIXES.find(prefix => text.startsWith(prefix));
      const [command, ...args] = text.slice(prefixUsed.length).split(' ');
  
      if (command === 'menu') {
          const menuImagePath = path.join(__dirname, 'public/uploads/menu.jpg');
          if (fs.existsSync(menuImagePath)) {
              const imageBuffer = fs.readFileSync(menuImagePath);
              await sock.sendMessage(sender, {
                  image: imageBuffer,
                  caption: settings.menuMessage,
                  quoted: msg // Pastikan quoted ada di sini
              });
          } else {
              await sock.sendMessage(sender, { text: 'Menu image not found.', quoted: msg });
          }
          return;
      }
  
      if (command !== 'welcome') {
          switch (command) {
            case 'tagall':
              if (!groupMetadata) return;
              const tagallMessage = args.join(' ') || '🚀 *Tagging All Members!* 🚀';
              const tagallParticipants = groupMetadata.participants.map(p => `➤ @${p.id.split('@')[0]}`).join('\n');
              await sock.sendMessage(sender, {
                  text: `🔥 *TAGALL* 🔥\n\n${tagallMessage}\n\n${tagallParticipants}`,
                  mentions: groupMetadata.participants.map(p => p.id),
                  quoted: msg
              });
              break;

          case 'hidetag':
              if (!groupMetadata) return;
              const hidetagMessage = args.join(' ') || '📢 *Hidetag Message!*';
              await sock.sendMessage(sender, {
                  text: `💬 *HIDETAG* 💬\n\n${hidetagMessage}`,
                  mentions: groupMetadata.participants.map(p => p.id),
                  quoted: msg
              });
              break;
              case 'hoki':
                  const hokiValue = Math.floor(Math.random() * 100) + 1;
                  let hokiMessage = '';

                  if (hokiValue <= 25) {
                      hokiMessage = `😢 *Hokimu Busuk* (${hokiValue}%)\n💰 Kasih owner uang biar hoki!`;
                  } else if (hokiValue <= 50) {
                      hokiMessage = `☕ *Hokimu Cukup Buruk* (${hokiValue}%)\n☕ Bayarin owner kopi dulu biar hoki!`;
                  } else if (hokiValue <= 75) {
                      hokiMessage = `😊 *Hokimu Lumayan Lah* (${hokiValue}%)\n✨ Bisa dicoba lagi nih!`;
                  } else {
                      hokiMessage = `🎉 *LUAR BIASAAA!* (${hokiValue}%)\n🔥 Hoki tingkat dewa!`;
                  }
                  
                  await sock.sendMessage(sender, {
                      text: hokiMessage,
                      quoted: msg
                  });
                  break;
                  case 'guy':
                    const guyValue = Math.floor(Math.random() * 100) + 1;
                    let guyMessage = '';
  
                    if (guyValue <= 25) {
                        guyMessage = `😵 *Kamu Gak Guy* (${guyValue}%)\n👎 Masih normal, bro.`;
                    } else if (guyValue <= 50) {
                        guyMessage = `🤔 *Kamu Agak Guy* (${guyValue}%)\n😏 Hati-hati, dikit lagi.`;
                    } else if (guyValue <= 75) {
                        guyMessage = `🌈 *Kamu Setengah Guy* (${guyValue}%)\n👀 Udah mulai keliatan...`;
                    } else {
                        guyMessage = `🌟 *FULL GUY MODE!* (${guyValue}%)\n🔥 Wah, udah 100% nih!`;
                    }
                    
                    await sock.sendMessage(sender, {
                        text: guyMessage,
                        quoted: msg
                    });
                    break;
  
                case 'pedo':
                    const pedoValue = Math.floor(Math.random() * 100) + 1;
                    let pedoMessage = '';
  
                    if (pedoValue <= 25) {
                        pedoMessage = `🍼 *Aman* (${pedoValue}%)\n✅ Tidak ada tanda-tanda mencurigakan.`;
                    } else if (pedoValue <= 50) {
                        pedoMessage = `😨 *Agak Mencurigakan* (${pedoValue}%)\n🤨 Perlu diawasi lebih lanjut.`;
                    } else if (pedoValue <= 75) {
                        pedoMessage = `🚨 *Waspada!* (${pedoValue}%)\n🧐 Mungkin perlu intervensi.`;
                    } else {
                        pedoMessage = `💀 *BAHAYA!!* (${pedoValue}%)\n🔥 Langsung panggil FBI!`;
                    }
                    
                    await sock.sendMessage(sender, {
                        text: pedoMessage,
                        quoted: msg
                    });
                    break;
  
              case 'promote':
                  if (!groupMetadata || args.length === 0) return;
                  await sock.groupParticipantsUpdate(sender, args.map(a => a + '@s.whatsapp.net'), 'promote');
                  await sock.sendMessage(sender, {
                      text: `Promoted: ${args.join(', ')}`,
                      quoted: msg
                  });
                  break;
  
              case 'demote':
                  if (!groupMetadata || args.length === 0) return;
                  await sock.groupParticipantsUpdate(sender, args.map(a => a + '@s.whatsapp.net'), 'demote');
                  await sock.sendMessage(sender, {
                      text: `Demoted: ${args.join(', ')}`,
                      quoted: msg
                  });
                  break;
          }
  
          // Custom cases dari file cases.json
          if (customCases[command]) {
              await sock.sendMessage(sender, {
                  text: customCases[command],
                  quoted: msg
              });
          }
      }
  });
  
}  


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
const storage = multer.diskStorage({
  destination: 'public/uploads/',
  filename: (req, file, cb) => {
      cb(null, 'menu.jpg'); // Semua file yang diunggah akan memiliki nama 'menu.jpg'
  }
});
// Configure file upload
const upload = multer({ storage });

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.render('index', { 
    menuImage: settings.menuImage,
    menuMessage: settings.menuMessage,
    leftMessage: settings.leftMessage,
    welcomeMessage: settings.welcomeMessage,
    customCases // Tambahkan customCases agar bisa diakses di index.ejs
  });
});
app.post('/delete-case', (req, res) => {
  const { command } = req.body;
  if (!command || !customCases[command]) {
      return res.status(400).json({ error: 'Command not found' });
  }
  delete customCases[command];
  fs.writeFileSync(casesPath, JSON.stringify(customCases, null, 2));
  res.json({ success: true, message: `Command '${command}' deleted successfully!` });
});
app.post('/add-case', (req, res) => {
  const { command, response } = req.body;
  if (!command || !response) {
      return res.status(400).json({ error: 'Command and response are required' });
  }

  customCases[command] = response;
  fs.writeFileSync(casesPath, JSON.stringify(customCases, null, 2));

  res.json({ success: true, message: `Command '${command}' added successfully!` });
});

app.post('/set-welcome', (req, res) => {
    settings.welcomeMessage = req.body.message || settings.welcomeMessage;
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    res.json({ success: true, message: 'Welcome message updated' });
});

app.post('/set-left', (req, res) => {
    settings.leftMessage = req.body.message || settings.leftMessage;
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    res.json({ success: true, message: 'Left message updated' });
});

app.post('/set-menu', (req, res) => {
    settings.menuMessage = req.body.message || settings.menuMessage;
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    res.json({ success: true, message: 'Menu message updated' });
});

app.post('/upload-menu-image', upload.single('menuImage'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  settings.menuImage = 'uploads/menu.jpg'; // Path tetap ke menu.jpg
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));

  res.json({ success: true, message: 'Menu image updated', imagePath: settings.menuImage });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

startBot();
