
const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose(); 
const jwt =require('jsonwebtoken');
const app = express();
const cors = require('cors'); 
const PORT = process.env.PORT || 3000;
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { Builder } = require('xml2js');
const config = require('./config');
const { vpsUrl } = require('./config');
const compression = require('compression');
const cron = require('node-cron');
const puppeteer = require('puppeteer');
const fetch = require('node-fetch'); 

// --- MASTER ADMIN PASSWORD ---
// IMPORTANT: In a real application, store this securely (e.g., environment variable)
// and use proper password hashing and comparison for the master password itself.
// For this exercise, it's a plain string as per the prompt's simplified example.
const MASTER_ADMIN_PROMOTION_PASSWORD = process.env.MASTER_ADMIN_PASSWORD || "SUPER_ADMIN_PASSWORD_123"; 
// -----------------------------

app.use(compression());
app.use(bodyParser.json({ limit: '50mb' })); 
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.use(cors());

const dbPath = path.resolve(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error("Error opening database", err.message);
    else console.log("Database connected successfully.");
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'uploads/imagens/perfil';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir); 
    },
    filename: function (req, file, cb) {
        const userId = req.body.fotoPerfil || 'unknown'; 
        const fileExtension = '.jpg'; 
        const uniqueSuffix = uuidv4(); 
        const fileName = `usuario-${userId}-${uniqueSuffix}${fileExtension}`; 
        cb(null, fileName); 
    }
});

const upload = multer({ storage: storage });

db.serialize(() => {
    db.run('CREATE TABLE IF NOT EXISTS animes (id INTEGER PRIMARY KEY AUTOINCREMENT, capa TEXT, titulo TEXT NOT NULL, tituloAlternativo TEXT, selo TEXT, sinopse TEXT, classificacao TEXT, status TEXT, qntd_temporadas INTEGER, anoLancamento INTEGER, dataPostagem DATE, ovas TEXT, filmes TEXT, estudio TEXT, diretor TEXT, genero TEXT, tipoMidia TEXT, visualizacoes INTEGER DEFAULT 0)');
    db.run(`
        CREATE TABLE IF NOT EXISTS episodios (
            id INTEGER PRIMARY KEY AUTOINCREMENT, temporada INTEGER, numero INTEGER, nome TEXT, link TEXT, capa_ep TEXT, anime_id INTEGER, alertanovoep INTEGER DEFAULT 0, data_lancamento TEXT,
            FOREIGN KEY (anime_id) REFERENCES animes(id) ON DELETE CASCADE
        )
    `);
    // Ensure all columns exist for episodios
    db.all("PRAGMA table_info(episodios)", (err, columns) => {
        if (err) { console.error("Error checking episodios table schema:", err); return; }
        const columnNames = columns.map(col => col.name);
        if (!columnNames.includes("alertanovoep")) db.run("ALTER TABLE episodios ADD COLUMN alertanovoep INTEGER DEFAULT 0", e => e ? console.error("Error adding alertanovoep to episodios:", e) : console.log("alertanovoep added to episodios."));
        if (!columnNames.includes("data_lancamento")) db.run("ALTER TABLE episodios ADD COLUMN data_lancamento TEXT", e => e ? console.error("Error adding data_lancamento to episodios:", e) : console.log("data_lancamento added to episodios."));
    });

    // Update usuarios table for user management features
    db.run(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            nome TEXT NOT NULL, 
            email TEXT UNIQUE NOT NULL, 
            senha TEXT NOT NULL, 
            imagem_perfil TEXT, 
            vip INTEGER DEFAULT 0, 
            admin INTEGER DEFAULT 0,
            is_banned INTEGER DEFAULT 0,      -- 0 for not banned, 1 for banned
            banned_reason TEXT,               -- Reason for ban
            admin_promotion_key_used TEXT     -- Optional: To track which key was used for promotion
        )
    `);
    // Add new columns to usuarios if they don't exist
    db.all("PRAGMA table_info(usuarios)", (err, columns) => {
        if (err) { console.error("Error checking usuarios table schema:", err); return; }
        const columnNames = columns.map(col => col.name);
        if (!columnNames.includes("vip")) db.run("ALTER TABLE usuarios ADD COLUMN vip INTEGER DEFAULT 0", e => e ? console.error("Error adding vip to usuarios:", e) : console.log("vip added to usuarios."));
        if (!columnNames.includes("admin")) db.run("ALTER TABLE usuarios ADD COLUMN admin INTEGER DEFAULT 0", e => e ? console.error("Error adding admin to usuarios:", e) : console.log("admin added to usuarios."));
        if (!columnNames.includes("is_banned")) db.run("ALTER TABLE usuarios ADD COLUMN is_banned INTEGER DEFAULT 0", e => e ? console.error("Error adding is_banned to usuarios:", e) : console.log("is_banned added to usuarios."));
        if (!columnNames.includes("banned_reason")) db.run("ALTER TABLE usuarios ADD COLUMN banned_reason TEXT", e => e ? console.error("Error adding banned_reason to usuarios:", e) : console.log("banned_reason added to usuarios."));
        if (!columnNames.includes("admin_promotion_key_used")) db.run("ALTER TABLE usuarios ADD COLUMN admin_promotion_key_used TEXT", e => e ? console.error("Error adding admin_promotion_key_used to usuarios:", e) : console.log("admin_promotion_key_used added to usuarios."));
    });


    db.run('CREATE TABLE IF NOT EXISTS progresso_animes (id INTEGER PRIMARY KEY AUTOINCREMENT, usuario_id INTEGER, anime_id INTEGER, episodio_assistido INTEGER, FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE, FOREIGN KEY (anime_id) REFERENCES animes(id) ON DELETE CASCADE)');
    db.run('CREATE TABLE IF NOT EXISTS links (id INTEGER PRIMARY KEY AUTOINCREMENT, idTemporario TEXT, linkVideo TEXT, dataExpiracao INTEGER)');
    db.run('CREATE TABLE IF NOT EXISTS avisos (id INTEGER PRIMARY KEY AUTOINCREMENT, titulo TEXT NOT NULL, conteudo TEXT NOT NULL, dataHoraPostagem DATETIME DEFAULT CURRENT_TIMESTAMP, ativo INTEGER DEFAULT 1)');
    db.run('CREATE TABLE IF NOT EXISTS estatisticas (id INTEGER PRIMARY KEY AUTOINCREMENT, total_animes INTEGER, total_episodios INTEGER, data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP)');
    db.run('CREATE TABLE IF NOT EXISTS Animes_exibir (id INTEGER PRIMARY KEY AUTOINCREMENT, anime_id INTEGER UNIQUE, titulo TEXT NOT NULL, FOREIGN KEY (anime_id) REFERENCES animes(id) ON DELETE CASCADE)');
    db.run('CREATE TABLE IF NOT EXISTS Episodios_exibir (id INTEGER PRIMARY KEY AUTOINCREMENT, anime_id INTEGER, temporada INTEGER NOT NULL, episodio INTEGER NOT NULL, descricao TEXT, link TEXT NOT NULL, link_extra_1 TEXT, link_extra_2 TEXT, link_extra_3 TEXT, capa_ep TEXT, FOREIGN KEY (anime_id) REFERENCES Animes_exibir(anime_id) ON DELETE CASCADE)');
    db.run('CREATE TABLE IF NOT EXISTS comments (id INTEGER PRIMARY KEY AUTOINCREMENT, anime_id TEXT NOT NULL, episode_number INTEGER NOT NULL, user_id INTEGER NOT NULL, user_nome TEXT NOT NULL, user_imagem_perfil TEXT, parent_comment_id INTEGER, content TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE, FOREIGN KEY (parent_comment_id) REFERENCES comments(id) ON DELETE CASCADE)');
    db.run('CREATE TABLE IF NOT EXISTS support_tickets (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, user_nome TEXT, user_email TEXT NOT NULL, subject TEXT NOT NULL, description TEXT NOT NULL, status TEXT DEFAULT \'Open\', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE SET NULL)');
    db.run('CREATE TABLE IF NOT EXISTS support_ticket_replies (id INTEGER PRIMARY KEY AUTOINCREMENT, ticket_id INTEGER NOT NULL, user_id INTEGER, admin_id INTEGER, replier_name TEXT NOT NULL, message TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE, FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE SET NULL, FOREIGN KEY (admin_id) REFERENCES usuarios(id) ON DELETE SET NULL)');
    db.run('CREATE TABLE IF NOT EXISTS stickers (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, category TEXT, image_url TEXT NOT NULL UNIQUE, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)');
    db.run('CREATE TABLE IF NOT EXISTS news_articles (id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT UNIQUE NOT NULL, title TEXT NOT NULL, cover_image_url TEXT, cover_video_url TEXT, content_html TEXT NOT NULL, author_name TEXT NOT NULL, published_at DATETIME DEFAULT CURRENT_TIMESTAMP, tags TEXT, snippet TEXT)');
    db.run('CREATE TABLE IF NOT EXISTS community_posts (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, user_name TEXT NOT NULL, user_avatar TEXT, content_text TEXT, content_image_url TEXT, sticker_url TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, likes_count INTEGER DEFAULT 0, comments_count INTEGER DEFAULT 0, FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE)');
    db.run('CREATE TABLE IF NOT EXISTS post_likes (id INTEGER PRIMARY KEY AUTOINCREMENT, post_id INTEGER NOT NULL, user_id INTEGER NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE, FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE, UNIQUE (post_id, user_id))');
    db.run('CREATE TABLE IF NOT EXISTS community_comments (id INTEGER PRIMARY KEY AUTOINCREMENT, post_id INTEGER NOT NULL, user_id INTEGER NOT NULL, user_name TEXT NOT NULL, user_avatar TEXT, content_text TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE, FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE)');
    db.run('CREATE TABLE IF NOT EXISTS user_notifications (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, message TEXT NOT NULL, type TEXT NOT NULL CHECK(type IN (\'new_episode\', \'comment_reply\', \'system_update\', \'news\', \'general\')), link TEXT, is_read INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE)');
    db.run('CREATE TABLE IF NOT EXISTS user_collections (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, anime_id INTEGER NOT NULL, status TEXT NOT NULL, added_at DATETIME DEFAULT CURRENT_TIMESTAMP, last_watched_episode TEXT, notes TEXT, FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE, FOREIGN KEY (anime_id) REFERENCES animes(id) ON DELETE CASCADE, UNIQUE (user_id, anime_id))');
    db.run('CREATE TABLE IF NOT EXISTS featured_content (id INTEGER PRIMARY KEY AUTOINCREMENT, list_name TEXT NOT NULL, anime_id INTEGER NOT NULL, display_order INTEGER DEFAULT 0, FOREIGN KEY (anime_id) REFERENCES animes(id) ON DELETE CASCADE, UNIQUE (list_name, anime_id))');
    db.run('CREATE TABLE IF NOT EXISTS user_downloads (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, anime_id INTEGER NOT NULL, episode_id INTEGER, title TEXT NOT NULL, episode_title TEXT, season_number INTEGER, episode_number INTEGER, thumbnail_url TEXT, size_mb REAL, downloaded_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE, FOREIGN KEY (anime_id) REFERENCES animes(id) ON DELETE CASCADE)');
}); 

const verifyAdminToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Token não fornecido ou mal formatado.' });
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, 'chave_secreta'); 
        if (!decoded.admin) return res.status(403).json({ error: 'Acesso negado. Requer privilégios de administrador.' });
        req.user = decoded; 
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }
};

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Token não fornecido ou mal formatado.' });
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, 'chave_secreta');
        req.user = decoded; 
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }
};

app.use('/uploads/imagens/perfil', express.static(path.join(__dirname, 'uploads/imagens/perfil')));

app.get('/categorias', (req, res) => {
    if (!req.query.categorias) return res.status(400).json({ error: 'Parâmetro "categorias" não fornecido.' });
    const categoriasSolicitadas = req.query.categorias.split(',');
    const categoriasResponse = {};
    db.all('SELECT genero FROM animes', (err, rows) => {
        if (err) return res.status(500).json({ error: 'Erro SQL.' });
        rows.forEach(row => {
            const generos = row.genero ? row.genero.split(',') : [];
            generos.forEach(genero => { if (categoriasSolicitadas.includes(genero.trim())) categoriasResponse[genero.trim()] = (categoriasResponse[genero.trim()] || 0) + 1; });
        });
        res.json(categoriasResponse);
    });
});

app.post('/upload', upload.single('file'), (req, res) => {
    const userId = req.body.fotoPerfil; 
    if (!userId) { if (req.file?.path) fs.unlinkSync(req.file.path); return res.status(400).json({ error: 'ID do usuário não fornecido.' }); }
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    db.get('SELECT * FROM usuarios WHERE id = ?', [userId], (err, user) => {
        if (err) { if (req.file?.path) fs.unlinkSync(req.file.path); return res.status(500).json({ error: 'Erro DB.' }); }
        if (!user) { if (req.file?.path) fs.unlinkSync(req.file.path); return res.status(404).json({ error: 'Usuário não encontrado.' }); }
        const imagePath = req.file.path.replace(/\\\\/g, '/');
        db.run('UPDATE usuarios SET imagem_perfil = ? WHERE id = ?', [imagePath, userId], (dbErr) => {
            if (dbErr) return res.status(500).json({ error: 'Erro ao salvar imagem.' });
            res.status(200).json({ message: 'Imagem de perfil enviada.', filePath: imagePath });
        });
    });
});

app.get('/obter-imagem-de-perfil/:userId', (req, res) => {
    const userId = req.params.userId;
    db.get('SELECT imagem_perfil FROM usuarios WHERE id = ?', [userId], (err, user) => {
      if (err) return res.status(500).json({ error: 'Erro DB.' });
      let imageUrl = (user?.imagem_perfil) ? user.imagem_perfil : 'uploads/imagens/perfil/padrao.jpg';
      const fullUrl = (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) ? imageUrl : `${vpsUrl}/${imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl}`;
      res.json({ url: fullUrl });
    });
});

app.get('/download', (req, res) => {
    const filePath = 'database.db';
    if (!fs.existsSync(filePath)) return res.status(404).send('Arquivo não existe.');
    res.download(filePath, 'database.db', (err) => { if (err) console.error('Erro download:', err); });
});

app.delete('/usuarios', verifyAdminToken, (req, res) => { 
    db.run('DELETE FROM usuarios', (err) => {
        if (err) return res.status(500).json({ error: 'Erro ao limpar usuários.' });
        db.run("DELETE FROM sqlite_sequence WHERE name='usuarios'", (resetErr) => {
            if (resetErr) console.error('Erro resetar sequência usuários:', resetErr);
            res.status(200).json({ message: 'Usuários limpos.' });
        });
    });
});

app.post('/login', (req, res) => {
    const { user, senha } = req.body;
    db.get('SELECT * FROM usuarios WHERE (email = ? OR nome = ?) AND senha = ?', [user, user, senha], (err, row) => {
        if (err) return res.status(500).json({ message: 'Erro ao fazer login' });
        if (row) {
            if (row.is_banned === 1) {
                return res.status(403).json({ message: 'Esta conta está banida.', reason: row.banned_reason || 'Motivo não especificado.' });
            }
            const token = jwt.sign({ 
                id: row.id, 
                nome: row.nome, 
                email: row.email, 
                vip: row.vip === 1, 
                admin: row.admin === 1, 
                imagem_perfil: row.imagem_perfil,
                is_banned: row.is_banned === 1 // Include ban status in JWT
            }, 'chave_secreta', { expiresIn: '30d' });
            return res.status(200).json({ message: 'Login bem-sucedido', token });
        } else {
            return res.status(401).json({ message: 'E-mail ou senha incorretos' });
        }
    });
});

app.post('/cadastro', (req, res) => {
    const { user, email, senha } = req.body;
    db.get('SELECT * FROM usuarios WHERE email = ?', [email], (err, row) => {
        if (err) return res.status(500).json({ error: 'Erro ao verificar email.' });
        if (row) return res.status(400).json({ error: 'Email já cadastrado.' });
        db.run('INSERT INTO usuarios (nome, email, senha, vip, admin, is_banned) VALUES (?, ?, ?, 0, 0, 0)', [user, email, senha], (errInsert) => {
            if (errInsert) return res.status(500).json({ error: 'Erro ao cadastrar.' });
            res.status(201).json({ message: 'Usuário cadastrado.' });
        });
    });
});

app.put('/user/update-name', verifyToken, (req, res) => {
    const { nome } = req.body;
    if (!nome || nome.trim() === '') return res.status(400).json({ message: "Nome não pode estar vazio." });
    db.run('UPDATE usuarios SET nome = ? WHERE id = ?', [nome, req.user.id], function(err) {
        if (err) return res.status(500).json({ message: "Erro ao atualizar nome.", error: err.message });
        if (this.changes === 0) return res.status(404).json({ message: "Usuário não encontrado." });
        db.get('SELECT id, nome, email, vip, admin, imagem_perfil, is_banned FROM usuarios WHERE id = ?', [req.user.id], (errU, userU) => {
            if (errU || !userU) return res.status(500).json({ message: "Erro ao buscar usuário atualizado."});
            res.json(userU);
        });
    });
});

app.put('/user/update-email', verifyToken, (req, res) => {
    const { email } = req.body;
    if (!email || !/\S+@\S+\.\S+/.test(email)) return res.status(400).json({ message: "Email inválido." });
    db.get('SELECT id FROM usuarios WHERE email = ? AND id != ?', [email, req.user.id], (err, existingUser) => {
        if (err) return res.status(500).json({ message: "Erro ao verificar email.", error: err.message });
        if (existingUser) return res.status(409).json({ message: "Email já em uso." });
        db.run('UPDATE usuarios SET email = ? WHERE id = ?', [email, req.user.id], function(updateErr) {
            if (updateErr) return res.status(500).json({ message: "Erro ao atualizar email.", error: updateErr.message });
            if (this.changes === 0) return res.status(404).json({ message: "Usuário não encontrado." });
            db.get('SELECT id, nome, email, vip, admin, imagem_perfil, is_banned FROM usuarios WHERE id = ?', [req.user.id], (errUser, updatedUser) => {
                if (errUser || !updatedUser) return res.status(500).json({ message: "Erro ao buscar usuário atualizado."});
                res.json(updatedUser);
            });
        });
    });
});

app.put('/user/update-profile-picture-url', verifyToken, (req, res) => {
    const { imagem_perfil_url } = req.body;
    db.run('UPDATE usuarios SET imagem_perfil = ? WHERE id = ?', [imagem_perfil_url, req.user.id], function(err) {
        if (err) return res.status(500).json({ message: "Erro ao atualizar foto.", error: err.message });
        if (this.changes === 0) return res.status(404).json({ message: "Usuário não encontrado." });
        db.get('SELECT id, nome, email, vip, admin, imagem_perfil, is_banned FROM usuarios WHERE id = ?', [req.user.id], (errUser, updatedUser) => {
            if (errUser || !updatedUser) return res.status(500).json({ message: "Erro ao buscar usuário atualizado."});
            res.json(updatedUser);
        });
    });
});

app.put('/user/update-password', verifyToken, (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: "Senhas são obrigatórias." });
    if (newPassword.length < 6) return res.status(400).json({ message: "Nova senha curta." });
    db.get('SELECT senha FROM usuarios WHERE id = ?', [req.user.id], (err, user) => {
        if (err || !user) return res.status(500).json({ message: "Erro ao buscar usuário." });
        if (user.senha !== currentPassword) return res.status(403).json({ message: "Senha atual incorreta." });
        db.run('UPDATE usuarios SET senha = ? WHERE id = ?', [newPassword, req.user.id], (updateErr) => {
            if (updateErr) return res.status(500).json({ message: "Erro ao atualizar senha.", error: updateErr.message });
            res.json({ message: "Senha atualizada." });
        });
    });
});


app.post('/inserirDados', verifyAdminToken, (req, res) => { 
    const animeData = req.body;
    const episodios = animeData.episodios;
    delete animeData.episodios; 

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        const queryUltimoId = 'SELECT MAX(id) as ultimoId FROM animes';
        db.get(queryUltimoId, [], (error, row) => {
            if (error) { db.run("ROLLBACK"); return res.status(500).send('Erro ao buscar ID.'); }
            const proximoId = (row.ultimoId || 0) + 1;
            const queryAnime = 'INSERT INTO animes (id, capa, titulo, tituloAlternativo, selo, sinopse, genero, classificacao, status, qntd_temporadas, anoLancamento, dataPostagem, ovas, filmes, estudio, diretor, tipoMidia) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
            db.run(queryAnime, [ proximoId, animeData.capa, animeData.titulo, animeData.tituloAlternativo, animeData.selo, animeData.sinopse, Array.isArray(animeData.genero) ? animeData.genero.join(',') : animeData.genero, animeData.classificacao, animeData.status, animeData.qntd_temporadas, animeData.anoLancamento, animeData.dataPostagem, animeData.ovas, animeData.filmes, animeData.estudio, animeData.diretor, animeData.tipoMidia ], function(animeError) {
                if (animeError) { db.run("ROLLBACK"); return res.status(500).send('Erro ao inserir anime.'); }
                const animeId = proximoId;
                if (episodios && episodios.length > 0) {
                    const queryEpisodios = 'INSERT INTO episodios (temporada, numero, nome, link, capa_ep, anime_id, data_lancamento, alertanovoep) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
                    const agora = new Date().toISOString().slice(0, 19).replace('T', ' ');
                    let episodesProcessed = 0;
                    let episodeInsertError = null;
                    episodios.forEach(ep => {
                        if (episodeInsertError) return;
                        db.run(queryEpisodios, [ ep.temporada, ep.numero, ep.nome, ep.link, ep.capa_ep, animeId, agora, ep.alertanovoep || 0 ], (epError) => {
                            if (episodeInsertError) return; 
                            if (epError) { episodeInsertError = epError; db.run("ROLLBACK"); if (!res.headersSent) res.status(500).send('Erro ao inserir episódio.'); return; }
                            episodesProcessed++;
                            if (episodesProcessed === episodios.length) { db.run("COMMIT"); if (!res.headersSent) res.status(200).json({ id: animeId, message: 'Anime e episódios inseridos com sucesso!' }); }
                        });
                    });
                } else {
                    db.run("COMMIT");
                    res.status(200).json({ id: animeId, message: 'Anime inserido com sucesso (sem episódios)!' });
                }
            });
        });
    });
});

app.put('/catalogo/:id', verifyAdminToken, (req, res) => { 
    const originalAnimeId = req.params.id; 
    const newAnimeData = req.body;
    const newAnimeId = newAnimeData.id; 
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        const updateAnimeQuery = `UPDATE animes SET id = ?, capa = ?, titulo = ?, tituloAlternativo = ?, selo = ?, sinopse = ?, genero = ?, classificacao = ?, status = ?, qntd_temporadas = ?, anoLancamento = ?, dataPostagem = ?, ovas = ?, filmes = ?, estudio = ?, diretor = ?, tipoMidia = ?, visualizacoes = ? WHERE id = ?`;
        const animeValues = [ newAnimeId, newAnimeData.capa, newAnimeData.titulo, newAnimeData.tituloAlternativo, newAnimeData.selo, newAnimeData.sinopse, Array.isArray(newAnimeData.generos) ? newAnimeData.generos.join(',') : newAnimeData.genero, newAnimeData.classificacao, newAnimeData.status, newAnimeData.qntd_temporadas, newAnimeData.anoLancamento, newAnimeData.dataPostagem, newAnimeData.ovas, newAnimeData.filmes, newAnimeData.estudio, newAnimeData.diretor, newAnimeData.tipoMidia, newAnimeData.visualizacoes || 0, originalAnimeId ];
        db.run(updateAnimeQuery, animeValues, function(animeErr) {
            if (animeErr) { db.run("ROLLBACK"); return res.status(500).send('Erro ao atualizar anime.'); }
            if (this.changes === 0) { db.run("ROLLBACK"); return res.status(404).send('Anime original não encontrado.');}
            const targetIdForEpisodes = newAnimeId || originalAnimeId;
            db.run(`DELETE FROM episodios WHERE anime_id = ?;`, [targetIdForEpisodes], (deleteErr) => {
                if (deleteErr) { db.run("ROLLBACK"); return res.status(500).send('Erro ao excluir episódios existentes.'); }
                const episodesData = newAnimeData.episodios || [];
                if (episodesData.length === 0) { db.run("COMMIT"); return res.status(200).json({ message: 'Anime atualizado (sem episódios)!' }); }
                const insertEpisodeQuery = `INSERT INTO episodios (temporada, numero, nome, link, capa_ep, anime_id, alertanovoep, data_lancamento) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`;
                const agora = new Date().toISOString().slice(0, 19).replace('T', ' ');
                let episodesProcessed = 0, episodeInsertError = null;
                episodesData.forEach(episodio => {
                    if (episodeInsertError) return;
                    const episodeValues = [ episodio.temporada, episodio.numero, episodio.nome, episodio.link, episodio.capa_ep, targetIdForEpisodes, episodio.alertanovoep || 0, agora ];
                    db.run(insertEpisodeQuery, episodeValues, (insertErr) => {
                        if (episodeInsertError) return;
                        if (insertErr) { episodeInsertError = insertErr; db.run("ROLLBACK"); if (!res.headersSent) res.status(500).send('Erro ao inserir episódio.'); return; }
                        episodesProcessed++;
                        if (episodesProcessed === episodesData.length) { db.run("COMMIT"); if (!res.headersSent) res.status(200).json({ message: 'Anime e episódios atualizados!' }); }
                    });
                });
            });
        });
    });
});

app.delete('/limparBanco', verifyAdminToken, (req, res) => { 
  const tablesToClear = [ 'episodios', 'Animes_exibir', 'Episodios_exibir', 'comments', 'support_ticket_replies', 'support_tickets', 'progresso_animes', 'links', 'avisos', 'estatisticas', 'news_articles', 'post_likes', 'community_comments', 'community_posts', 'user_notifications', 'stickers', 'user_collections', 'featured_content', 'user_downloads', 'animes' ];
  db.serialize(() => {
    db.run('BEGIN TRANSACTION'); let errorOccurred = false; let queriesCompleted = 0; const totalQueries = tablesToClear.length * 2;
    tablesToClear.forEach(table => {
        if (errorOccurred) return;
        db.run(`DELETE FROM ${table}`, (err) => {
            if (errorOccurred) return; if (err) { errorOccurred = true; console.error(`Erro ao limpar ${table}:`, err.message); return; }
            queriesCompleted++;
            db.run(`DELETE FROM sqlite_sequence WHERE name="${table}"`, (seqErr) => {
                if (errorOccurred) return;
                if (seqErr && seqErr.message.indexOf('no such table') === -1 && seqErr.message.indexOf('no such column') === -1) { errorOccurred = true; console.error(`Erro ao resetar ${table}:`, seqErr.message); return; }
                queriesCompleted++; if (queriesCompleted === totalQueries && !errorOccurred) db.run('COMMIT', () => { if (!res.headersSent) res.status(200).json({ message: 'Banco limpo (exceto usuários)!' }); });
            });
        });
    });
    if (errorOccurred) db.run('ROLLBACK', () => { if (!res.headersSent) res.status(500).json({error: `Erro ao limpar banco.`}); });
  });
});

app.delete('/excluirAnime/:id', verifyAdminToken, (req, res) => { 
    const animeId = req.params.id;
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        db.run('DELETE FROM animes WHERE id = ?', [animeId], function(err) {
            if (err) { db.run("ROLLBACK"); return res.status(500).send('Erro ao excluir anime.'); }
            if (this.changes === 0) { db.run("ROLLBACK"); return res.status(404).send('Anime não encontrado.'); }
            // Cascading delete should handle related tables like episodios, user_collections etc.
            db.run("COMMIT"); res.status(200).json({ message: 'Anime e dados relacionados excluídos!' });
        });
    });
});

app.delete('/animes_exibir/:anime_id', verifyAdminToken, (req, res) => { 
    const animeId = req.params.anime_id;
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        // First delete from Episodios_exibir due to foreign key constraint
        db.run('DELETE FROM Episodios_exibir WHERE anime_id = ?', [animeId], (errEp) => {
            if (errEp) { db.run("ROLLBACK"); return res.status(500).send('Erro ao excluir episódios de exibição.');}
            // Then delete from Animes_exibir
            db.run('DELETE FROM Animes_exibir WHERE anime_id = ?', [animeId], (errAnime) => {
                if (errAnime) { db.run("ROLLBACK"); return res.status(500).send('Erro ao excluir anime de exibição.');}
                db.run("COMMIT"); res.status(200).send('Dados de exibição excluídos!');
            });
        });
    });
});

app.post('/animes_exibir/:anime_id_param', verifyAdminToken, (req, res) => { 
    const animeIdFromParam = req.params.anime_id_param;
    const { animeId, titulo, episodios } = req.body; // animeId in body is the catalog's anime_id
    if (animeIdFromParam !== animeId.toString()) return res.status(400).send("Inconsistência no ID do anime.");
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        db.get("SELECT id FROM Animes_exibir WHERE anime_id = ?", [animeId], (err, existing) => {
            if (err) { db.run("ROLLBACK"); return res.status(500).send('Erro ao verificar anime de exibição existente.'); }
            const processAnimeRecord = (errProc) => {
                if (errProc) { db.run("ROLLBACK"); return res.status(500).send(`Erro ao processar registro de anime de exibição: ${errProc.message}`);}
                db.run("DELETE FROM Episodios_exibir WHERE anime_id = ?", [animeId], (errDel) => {
                    if (errDel) { db.run("ROLLBACK"); return res.status(500).send('Erro ao limpar episódios de exibição existentes.'); }
                    if (!episodios || episodios.length === 0) { db.run("COMMIT"); return res.status(200).send('Registro de anime de exibição processado (sem episódios).');}
                    const q = `INSERT INTO Episodios_exibir (anime_id, temporada, episodio, descricao, link, link_extra_1, link_extra_2, link_extra_3) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
                    let count = 0, epErr = null;
                    episodios.forEach(ep => {
                        if(epErr) return;
                        db.run(q, [animeId, ep.temporada, ep.episodio, ep.descricao, ep.link, ep.link_extra_1||null, ep.link_extra_2||null, ep.link_extra_3||null], (errIns) => {
                            if(epErr) return; if(errIns) { epErr=errIns; db.run("ROLLBACK"); if(!res.headersSent) res.status(500).send('Erro ao inserir episódio de exibição.'); return; }
                            count++; if (count === episodios.length) { db.run("COMMIT"); if(!res.headersSent) res.status(200).send('Dados de exibição inseridos/atualizados com sucesso.');}
                        });
                    });
                });
            };
            if (existing) db.run("UPDATE Animes_exibir SET titulo = ? WHERE anime_id = ?", [titulo, animeId], processAnimeRecord);
            else db.run("INSERT INTO Animes_exibir (anime_id, titulo) VALUES (?, ?)", [animeId, titulo], processAnimeRecord);
        });
    });
});

app.post('/animes_exibir_editar/:anime_id', verifyAdminToken, (req, res) => { 
    const animeIdFromParam = req.params.anime_id;
    const { titulo, episodios } = req.body; const animeId = animeIdFromParam; // Use animeId from param as the true ID
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        db.get("SELECT id FROM Animes_exibir WHERE anime_id = ?", [animeId], (errC, exA) => {
            if (errC) { db.run("ROLLBACK"); return res.status(500).send('Erro ao verificar Animes_exibir.'); }
            if (!exA) { db.run("ROLLBACK"); return res.status(404).send(`Anime (exibir) com ID ${animeId} não encontrado.`); }
            db.run('UPDATE Animes_exibir SET titulo = ? WHERE anime_id = ?', [titulo, animeId], (errUT) => {
                if (errUT) { db.run("ROLLBACK"); return res.status(500).send('Erro ao atualizar título em Animes_exibir.'); }
                db.run('DELETE FROM Episodios_exibir WHERE anime_id = ?', [animeId], (errDE) => {
                    if (errDE) { db.run("ROLLBACK"); return res.status(500).send('Erro ao deletar episódios existentes de Episodios_exibir.'); }
                    if (episodios && episodios.length > 0) {
                        const q = `INSERT INTO Episodios_exibir (anime_id, temporada, episodio, descricao, link, link_extra_1, link_extra_2, link_extra_3) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
                        let c=0, iE=null;
                        episodios.forEach(ep => {
                            if(iE) return;
                            db.run(q, [animeId, ep.temporada, ep.episodio, ep.descricao, ep.link, ep.link_extra_1||null, ep.link_extra_2||null, ep.link_extra_3||null], (errI) => {
                                if(iE) return; if(errI) { iE=errI; db.run("ROLLBACK"); if(!res.headersSent) res.status(500).send('Erro ao inserir episódio em Episodios_exibir.'); return; }
                                c++; if(c === episodios.length) { db.run('COMMIT'); if(!res.headersSent) res.status(200).send('Dados de exibição atualizados com sucesso!');}
                            });
                        });
                    } else { db.run('COMMIT'); if(!res.headersSent) res.status(200).send('Título em Animes_exibir atualizado, episódios limpos.');}
                });
            });
        });
    });
});

// Admin Users Management Endpoints
app.get('/admin/users', verifyAdminToken, (req, res) => {
    db.all('SELECT id, nome, email, vip, admin, is_banned, banned_reason, admin_promotion_key_used FROM usuarios ORDER BY id ASC', (err, users) => {
        if (err) return res.status(500).json({ error: 'Failed to retrieve users.' });
        // Ensure boolean fields are sent as booleans
        const formattedUsers = users.map(u => ({
            ...u,
            vip: u.vip === 1,
            admin: u.admin === 1,
            is_banned: u.is_banned === 1
        }));
        res.json(formattedUsers);
    });
});

app.put('/admin/users/:userId/ban', verifyAdminToken, (req, res) => {
    const { userId } = req.params;
    const { reason } = req.body;
    if (parseInt(userId, 10) === req.user.id) return res.status(400).json({ error: 'Você não pode banir a si mesmo.' });
    db.run('UPDATE usuarios SET is_banned = 1, banned_reason = ? WHERE id = ?', [reason || 'Motivo não especificado.', userId], function(err) {
        if (err) return res.status(500).json({ error: 'Failed to ban user.' });
        if (this.changes === 0) return res.status(404).json({ error: 'User not found.' });
        res.json({ success: true, message: `Usuário ${userId} banido.` });
    });
});

app.put('/admin/users/:userId/unban', verifyAdminToken, (req, res) => {
    const { userId } = req.params;
    if (parseInt(userId, 10) === req.user.id && req.user.is_banned) { // Admin cannot unban self if they somehow got banned
        return res.status(400).json({error: "Administradores não podem desbanir a si mesmos através desta interface."})
    }
    db.run('UPDATE usuarios SET is_banned = 0, banned_reason = NULL WHERE id = ?', [userId], function(err) {
        if (err) return res.status(500).json({ error: 'Failed to unban user.' });
        if (this.changes === 0) return res.status(404).json({ error: 'User not found.' });
        res.json({ success: true, message: `Usuário ${userId} desbanido.` });
    });
});

app.put('/admin/users/:userId/promote', verifyAdminToken, (req, res) => {
    const { userId } = req.params;
    const { masterPassword } = req.body;

    if (masterPassword !== MASTER_ADMIN_PROMOTION_PASSWORD) {
        return res.status(403).json({ error: 'Senha mestre de promoção incorreta.' });
    }
    if (parseInt(userId, 10) === req.user.id) return res.status(400).json({ error: 'Você já é um administrador.' });
    
    db.run('UPDATE usuarios SET admin = 1, admin_promotion_key_used = ? WHERE id = ?', [MASTER_ADMIN_PROMOTION_PASSWORD, userId], function(err) {
        if (err) return res.status(500).json({ error: 'Failed to promote user.' });
        if (this.changes === 0) return res.status(404).json({ error: 'User not found.' });
        res.json({ success: true, message: `Usuário ${userId} promovido a administrador.` });
    });
});

app.put('/admin/users/:userId/demote', verifyAdminToken, (req, res) => {
    const { userId } = req.params;
    const { masterPassword } = req.body;

    if (masterPassword !== MASTER_ADMIN_PROMOTION_PASSWORD) {
        return res.status(403).json({ error: 'Senha mestre incorreta para rebaixamento.' });
    }
    if (parseInt(userId, 10) === req.user.id) { 
        return res.status(400).json({ error: 'Você não pode rebaixar a si mesmo.' });
    }
    
    db.get('SELECT admin FROM usuarios WHERE id = ?', [userId], (err, userToDemote) => {
        if (err) return res.status(500).json({ error: 'Erro ao verificar usuário.'});
        if (!userToDemote) return res.status(404).json({ error: 'Usuário não encontrado.'});
        if (userToDemote.admin === 0) return res.status(400).json({ error: 'Usuário já não é um administrador.'});

        db.run('UPDATE usuarios SET admin = 0 WHERE id = ?', [userId], function(updateErr) {
            if (updateErr) return res.status(500).json({ error: 'Falha ao rebaixar usuário.' });
            if (this.changes === 0) return res.status(404).json({ error: 'Usuário não encontrado para rebaixamento.' }); 
            res.json({ success: true, message: `Usuário ${userId} rebaixado de administrador.` });
        });
    });
});


app.get('/todosAnimes/:id?', (req, res) => {
    const animeId = req.params.id;
    if (animeId) {
        const query = `SELECT a.*, e.id as episodio_db_id, e.temporada, e.numero, e.nome AS nome_episodio, e.link, e.capa_ep, e.alertanovoep, e.data_lancamento as episodio_data_lancamento FROM animes a LEFT JOIN episodios e ON a.id = e.anime_id WHERE a.id = ? ORDER BY e.temporada ASC, e.numero ASC;`;
        db.all(query, [animeId], (error, rows) => {
            if (error) return res.status(500).send('Erro ao selecionar anime.');
            if (rows.length === 0) return res.status(404).send('Anime não encontrado.');
            const anime = { ...rows[0], id: rows[0].id, generos: rows[0].genero ? rows[0].genero.split(',') : [], episodios: rows[0].episodio_db_id ? rows.map(r => ({ id: r.episodio_db_id, temporada: r.temporada, numero: r.numero, nome: r.nome_episodio, link: r.link, capa_ep: r.capa_ep, alertanovoep: r.alertanovoep, data_lancamento: r.episodio_data_lancamento })) : [] };
            ['episodio_db_id', 'temporada', 'numero', 'nome_episodio', 'link', 'capa_ep', 'alertanovoep', 'episodio_data_lancamento'].forEach(key => delete anime[key]);
            res.status(200).json(anime);
        });
    } else {
        const query = `SELECT a.* FROM animes a ORDER BY a.dataPostagem DESC, a.id DESC;`;
        db.all(query, (error, animesRows) => {
            if (error) return res.status(500).send('Erro ao selecionar animes.');
            const episodeQuery = `SELECT * FROM episodios ORDER BY anime_id ASC, temporada ASC, numero ASC;`;
            db.all(episodeQuery, (epError, episodesRows) => {
                if (epError) return res.status(500).send('Erro ao selecionar episódios.');
                const animesMap = new Map();
                animesRows.forEach(ar => animesMap.set(ar.id, { ...ar, generos: ar.genero ? ar.genero.split(',') : [], episodios: [] }));
                episodesRows.forEach(er => { if (animesMap.has(er.anime_id)) animesMap.get(er.anime_id).episodios.push(er); });
                res.status(200).json(Array.from(animesMap.values()));
            });
        });
    }
});
const RESULTS_PER_PAGE = 20; 
app.get('/animesPagina/:page?', (req, res) => {
    const page = parseInt(req.params.page) || 1; const offset = (page - 1) * RESULTS_PER_PAGE;
    db.get(`SELECT COUNT(*) AS total FROM animes`, (error, countRow) => {
        if (error) return res.status(500).send('Erro ao contar.');
        const totalRecords = countRow.total, totalPages = Math.ceil(totalRecords / RESULTS_PER_PAGE);
        db.all(`SELECT id FROM animes ORDER BY dataPostagem DESC, id DESC LIMIT ? OFFSET ?`, [RESULTS_PER_PAGE, offset], (idError, animeIdRows) => {
            if (idError) return res.status(500).send('Erro IDs paginados.');
            if (animeIdRows.length === 0) return res.json({ animes: [], totalPages, totalAnimes: totalRecords, totalEpisodios: null });
            const ids = animeIdRows.map(r => r.id);
            const query = `SELECT a.*, e.id as episodio_db_id, e.temporada, e.numero, e.nome AS nome_episodio, e.link, e.capa_ep, e.alertanovoep, e.data_lancamento as episodio_data_lancamento FROM animes a LEFT JOIN episodios e ON a.id = e.anime_id WHERE a.id IN (${ids.map(() => '?').join(',')}) ORDER BY INSTR(',${ids.join(',')},', ',' || a.id || ','), e.temporada ASC, e.numero ASC;`;
            db.all(query, ids, (dataError, rows) => {
                if (dataError) return res.status(500).send('Erro selecionar dados.');
                const animesMap = new Map();
                ids.forEach(id => { const animeData = rows.find(r => r.id === id && !animesMap.has(id)); if (animeData) animesMap.set(id, { ...animeData, generos: animeData.genero ? animeData.genero.split(',') : [], episodios: [] }); });
                rows.forEach(row => { if (row.episodio_db_id && animesMap.has(row.id)) { const currentAnime = animesMap.get(row.id); currentAnime.episodios.push({ id: row.episodio_db_id, temporada: row.temporada, numero: row.numero, nome: row.nome_episodio, link: row.link, capa_ep: row.capa_ep, alertanovoep: row.alertanovoep, data_lancamento: row.episodio_data_lancamento }); ['episodio_db_id', 'temporada', 'numero', 'nome_episodio', 'link', 'capa_ep', 'alertanovoep', 'episodio_data_lancamento'].forEach(key => delete currentAnime[key]); } });
                const sortedAnimesArray = ids.map(id => animesMap.get(id)).filter(Boolean);
                db.get('SELECT total_animes, total_episodios FROM estatisticas ORDER BY data_atualizacao DESC LIMIT 1', (statError, statistics) => res.status(200).json({ animes: sortedAnimesArray, totalPages, totalAnimes: statistics ? statistics.total_animes : totalRecords, totalEpisodios: statistics ? statistics.total_episodios : null }) );
            });
        });
    });
});
app.post('/marcar-alerta', (req, res) => {
    const { anime_id, numero } = req.body; if (!anime_id || !numero) return res.status(400).json({ error: 'Parâmetros obrigatórios.' });
    db.run(`UPDATE episodios SET alertanovoep = 0 WHERE anime_id = ? AND numero = ?`, [anime_id, numero], function (err) {
        if (err) return res.status(500).json({ error: 'Erro ao atualizar.' });
        if (this.changes === 0) return res.status(404).json({ message: 'Nenhum episódio encontrado.' });
        res.status(200).json({ message: 'Alerta marcado 0.' });
    });
});
app.put('/alterarDominio', verifyAdminToken, (req, res) => { 
    const { dominioAntigo, dominioNovo } = req.body; if (!dominioAntigo || !dominioNovo) return res.status(400).send('Domínios obrigatórios.');
    db.serialize(() => {
        db.run('BEGIN TRANSACTION'); let errorOccurred = false;
        const queries = [ { sql: 'UPDATE episodios SET link = REPLACE(link, ?, ?)', params: [dominioAntigo, dominioNovo] }, { sql: 'UPDATE animes SET capa = REPLACE(capa, ?, ?)', params: [dominioAntigo, dominioNovo] }, { sql: 'UPDATE episodios SET capa_ep = REPLACE(capa_ep, ?, ?)', params: [dominioAntigo, dominioNovo] }, { sql: 'UPDATE Episodios_exibir SET link = REPLACE(link, ?, ?)', params: [dominioAntigo, dominioNovo] }, { sql: 'UPDATE Episodios_exibir SET link_extra_1 = REPLACE(link_extra_1, ?, ?)', params: [dominioAntigo, dominioNovo] }, { sql: 'UPDATE Episodios_exibir SET link_extra_2 = REPLACE(link_extra_2, ?, ?)', params: [dominioAntigo, dominioNovo] }, { sql: 'UPDATE Episodios_exibir SET link_extra_3 = REPLACE(link_extra_3, ?, ?)', params: [dominioAntigo, dominioNovo] }, ];
        let completed = 0;
        queries.forEach(q => { if(errorOccurred) return; db.run(q.sql, q.params, (err) => { if(errorOccurred) return; if (err) { errorOccurred = true; db.run('ROLLBACK'); if (!res.headersSent) res.status(500).send('Erro atualizar links.'); return; } completed++; if (completed === queries.length && !errorOccurred) { db.run('COMMIT'); if (!res.headersSent) res.status(200).send('Links atualizados.');} }); });
    });
});
app.post('/api/gerar-link-temporario', (req, res) => {
    const { linkVideo } = req.body; const idTemporario = uuidv4(); const dataExpiracao = Date.now() + 2 * 60 * 60 * 1000; 
    db.run("INSERT INTO links (idTemporario, linkVideo, dataExpiracao) VALUES (?, ?, ?)", [idTemporario, linkVideo, dataExpiracao], (err) => { if (err) return res.status(500).json({ error: 'Erro armazenar link.' }); res.json({ temporaryLink: `${vpsUrl}/api/receber-link-temporario/${idTemporario}` }); });
});
app.get('/api/receber-link-temporario/:idTemporario', (req, res) => {
    const { idTemporario } = req.params;
    db.get("SELECT linkVideo, dataExpiracao FROM links WHERE idTemporario = ?", [idTemporario], (err, row) => {
        if (err) return res.status(500).json({ error: 'Erro recuperar link.' }); if (!row) return res.status(404).json({ error: 'Link não encontrado.' });
        if (row.dataExpiracao < Date.now()) { db.run("DELETE FROM links WHERE idTemporario = ?", [idTemporario]); return res.status(404).json({ error: 'Link expirado.' }); }
        res.redirect(row.linkVideo);
    });
});
app.get('/titulos-semelhantes/:id', (req, res) => {
    const animeId = req.params.id;
    const query = `SELECT a.id, a.titulo, a.capa, a.genero FROM animes a JOIN animes current_anime ON current_anime.id = ? WHERE INSTR(',' || a.genero || ',', ',' || REPLACE(current_anime.genero, ',', ',') || ',') > 0 AND a.id != ? ORDER BY RANDOM() LIMIT 10;`;
    db.all(query, [animeId, animeId], (error, rows) => { if (error) return res.status(500).send('Erro títulos semelhantes.'); res.status(200).json(rows.map(row => ({ ...row, generos: row.genero ? row.genero.split(',') : [], episodios: [] }))); });
});
app.get('/animes_exibir/:anime_id', (req, res) => {
    const animeId = req.params.anime_id;
    db.get(`SELECT * FROM Animes_exibir WHERE anime_id = ?`, [animeId], (err, animeRow) => {
        if (err) return res.status(500).send('Erro buscar Animes_exibir.'); if (!animeRow) return res.status(404).json({ message: 'Anime (exibir) não encontrado.' });
        db.all(`SELECT * FROM Episodios_exibir WHERE anime_id = ? ORDER BY temporada ASC, episodio ASC`, [animeId], (errEp, episodiosRows) => { if (errEp) return res.status(500).send('Erro buscar Episodios_exibir.'); res.json({ anime: animeRow, episodios: episodiosRows }); });
    });
});
app.post('/animes/:id/visualizar', (req, res) => {
    const { id } = req.params; db.run(`UPDATE animes SET visualizacoes = COALESCE(visualizacoes, 0) + 1 WHERE id = ?`, [id], (err) => { if (err) return res.status(500).json({ error: err.message }); res.json({ message: `Visualizações ${id} incrementadas.` }); });
});
app.get('/animes/:id/visualizacoes', (req, res) => {
    const { id } = req.params; db.get(`SELECT visualizacoes FROM animes WHERE id = ?`, [id], (err, row) => { if (err) return res.status(500).json({ error: err.message }); if (!row) return res.status(404).json({ error: `Anime ${id} não encontrado.` }); res.json({ id, visualizacoes: row.visualizacoes || 0 }); });
});
app.get('/generate-sitemap', verifyAdminToken, (req, res) => { 
    const baseUrl = req.query.url; const type = req.query.type; if (!baseUrl || !type || !['a', 'e', 't'].includes(type)) return res.status(400).send('URL e tipo válidos são necessários.');
    db.all("SELECT id FROM animes", [], (err, animeRows) => {
        if (err || !animeRows) return res.status(500).send('Erro consultar animes.'); if (animeRows.length === 0) return generateSitemap(res, []);
        const urls = []; let processedCount = 0; const totalAnimesToProcessForEpisodes = (type === 'e' || type === 't') ? animeRows.length : 0;
        if (totalAnimesToProcessForEpisodes === 0 && (type === 'a' || type === 't')) { animeRows.forEach(anime => urls.push({ loc: `${baseUrl}/#!/anime/${anime.id}`, changefreq: 'weekly', priority: 0.8 })); generateSitemap(res, urls); return; }
        animeRows.forEach(anime => {
            if (type === 'a' || type === 't') urls.push({ loc: `${baseUrl}/#!/anime/${anime.id}`, changefreq: 'weekly', priority: 0.8 });
            if (type === 'e' || type === 't') { db.all("SELECT numero FROM episodios WHERE anime_id = ?", [anime.id], (errEp, episodeRows) => { if (errEp) console.error('Erro sitemap:', errEp); else episodeRows.forEach(ep => urls.push({ loc: `${baseUrl}/#!/watch/${anime.id}/ep/${ep.numero}`, changefreq: 'weekly', priority: 0.7 })); processedCount++; if (processedCount === totalAnimesToProcessForEpisodes) generateSitemap(res, urls); }); }
        });
    });
});
app.get('/episodiosPagina/:id', (req, res) => {
    const animeId = req.params.id, pagina = parseInt(req.query.pagina) || 1, itensPorPagina = parseInt(req.query.itensPorPagina) || 10; if (isNaN(parseInt(animeId))) return res.status(400).send('ID inválido.'); const offset = (pagina - 1) * itensPorPagina;
    db.get(`SELECT COUNT(*) AS totalEpisodios FROM episodios WHERE anime_id = ?`, [animeId], (countError, countResult) => {
        if (countError) return res.status(500).send('Erro contar eps.'); const totalEpisodios = countResult ? countResult.totalEpisodios : 0; if (totalEpisodios === 0) return res.status(200).json({ totalEpisodios: 0, pagina, itensPorPagina, episodios: [] });
        db.all(`SELECT * FROM episodios WHERE anime_id = ? ORDER BY temporada ASC, numero ASC LIMIT ? OFFSET ?;`, [animeId, itensPorPagina, offset], (error, rows) => { if (error) return res.status(500).send('Erro selecionar eps.'); res.status(200).json({ totalEpisodios, pagina, itensPorPagina, episodios: rows }); });
    });
});
app.get('/episodio/:animeId/:numero', (req, res) => {
    const animeId = req.params.animeId, numero = parseInt(req.params.numero); if (isNaN(parseInt(animeId)) || isNaN(numero)) return res.status(400).send('ID/número inválido.');
    const query = `SELECT e.*, a.id AS anime_db_id, a.capa AS anime_capa, a.titulo AS anime_titulo, a.genero AS anime_genero FROM episodios e JOIN animes a ON e.anime_id = a.id WHERE e.anime_id = ? AND e.numero = ?;`;
    db.get(query, [animeId, numero], (error, row) => { if (error) return res.status(500).send('Erro selecionar ep.'); if (!row) return res.status(404).json({ mensagem: 'Episódio não encontrado.' }); res.status(200).json({ anime: { id: row.anime_db_id, capa: row.anime_capa, titulo: row.anime_titulo, generos: row.anime_genero ? row.anime_genero.split(',') : [] }, episodio: { id: row.id, temporada: row.temporada, numero: row.numero, nome: row.nome, capa_ep: row.capa_ep, alertanovoep: row.alertanovoep }}); });
});
function generateSitemap(res, urls) {
    const builder = new Builder({ headless: true }); const sitemapObject = { urlset: { $: { 'xmlns': 'http://www.sitemaps.org/schemas/sitemap/0.9' }, url: urls.map(u => ({ loc: u.loc, changefreq: u.changefreq, priority: u.priority.toString() }))}};
    let sitemapXml; try { sitemapXml = builder.buildObject(sitemapObject); } catch (buildError) { if(!res.headersSent) res.status(500).send("Erro XML."); return; }
    const filePath = path.join(__dirname, 'sitemap.xml');
    fs.writeFile(filePath, sitemapXml, (writeErr) => { if (writeErr) { if(!res.headersSent) res.status(500).send('Erro salvar sitemap.'); return; } res.download(filePath, 'sitemap.xml', () => { fs.unlink(filePath, (ulErr) => { if(ulErr) console.error("Error removing sitemap:", ulErr); }); }); });
}
app.get('/pesquisa/termo', (req, res) => {
    const searchTerm = req.query.term; if (!searchTerm) return res.status(400).json({ error: 'Termo obrigatório.' }); const limit = parseInt(req.query.limit) || 20;
    const query = `SELECT a.*, e.id as ep_id, e.temporada as ep_temporada, e.numero as ep_numero, e.nome as ep_nome FROM animes a LEFT JOIN episodios e ON a.id = e.anime_id WHERE (a.titulo LIKE '%' || ? || '%' OR a.tituloAlternativo LIKE '%' || ? || '%') ORDER BY a.id`;
    db.all(query, [searchTerm, searchTerm], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Erro buscar animes.' }); const animesMap = new Map();
        rows.forEach(row => { if (!animesMap.has(row.id)) { if (animesMap.size < limit) animesMap.set(row.id, { ...row, id: row.id, generos: row.genero ? row.genero.split(',') : [], episodios: [] });} if (row.ep_id && animesMap.has(row.id)) animesMap.get(row.id).episodios.push({ id: row.ep_id, temporada: row.ep_temporada, numero: row.ep_numero, nome: row.ep_nome }); });
        res.json(Array.from(animesMap.values()));
    });
});
app.get('/animesRecentes', (req, res) => {
    const query = `SELECT a.* FROM animes a ORDER BY a.dataPostagem DESC, a.id DESC LIMIT 35`;
    db.all(query, (error, animesRows) => {
        if (error) return res.status(500).send('Erro animes recentes.'); if (!animesRows || animesRows.length === 0) return res.status(200).json([]); const animeIds = animesRows.map(ar => ar.id);
        const episodeQuery = `SELECT * FROM episodios WHERE anime_id IN (${animeIds.map(()=>'?').join(',')}) ORDER BY anime_id, temporada ASC, numero ASC`;
        db.all(episodeQuery, animeIds, (epError, episodesRows) => { if (epError) return res.status(500).send('Erro buscar eps.'); const animesMap = new Map(); animesRows.forEach(ar => animesMap.set(ar.id, {...ar, generos: ar.genero ? ar.genero.split(',') : [], episodios: []})); episodesRows.forEach(er => { if (animesMap.has(er.anime_id)) animesMap.get(er.anime_id).episodios.push(er); }); res.status(200).json(Array.from(animesMap.values())); });
    });
});
app.get('/FilmesRecentes', (req, res) => {
    const query = `SELECT * FROM animes WHERE tipoMidia = 'Filme' ORDER BY dataPostagem DESC, id DESC LIMIT 20`;
    db.all(query, (error, rows) => { if (error) return res.status(500).send('Erro filmes recentes.'); res.status(200).json(rows.map(r => ({...r, generos: r.genero ? r.genero.split(',') : [], episodios:[] }))); });
});
app.get('/AnimesAleatorios', (req, res) => {
    const query = `SELECT * FROM animes ORDER BY RANDOM() LIMIT 20`;
    db.all(query, (error, rows) => { if (error) return res.status(500).send('Erro animes aleatórios.'); res.status(200).json(rows.map(r => ({...r, generos: r.genero ? r.genero.split(',') : [], episodios:[] }))); });
});
app.get('/animes_exibir/:anime_id/episodio/:episodio', (req, res) => {
    const animeId = req.params.anime_id, episodioNum = parseInt(req.params.episodio, 10); if (isNaN(episodioNum)) return res.status(400).send("Número inválido.");
    const queries = { anime: `SELECT * FROM Animes_exibir WHERE anime_id = ?`, episodio: `SELECT *, descricao AS titulo FROM Episodios_exibir WHERE anime_id = ? AND episodio = ? LIMIT 1`, prev: `SELECT episodio FROM Episodios_exibir WHERE anime_id = ? AND episodio < ? ORDER BY episodio DESC LIMIT 1`, next: `SELECT episodio FROM Episodios_exibir WHERE anime_id = ? AND episodio > ? ORDER BY episodio ASC LIMIT 1`};
    Promise.all([ new Promise((resolve, reject) => db.get(queries.anime, [animeId], (e,r) => e ? reject(e) : resolve(r))), new Promise((resolve, reject) => db.get(queries.episodio, [animeId, episodioNum], (e,r) => e ? reject(e) : resolve(r))), new Promise((resolve, reject) => db.get(queries.prev, [animeId, episodioNum], (e,r) => e ? reject(e) : resolve(r))), new Promise((resolve, reject) => db.get(queries.next, [animeId, episodioNum], (e,r) => e ? reject(e) : resolve(r)))]).then(([animeRow, episodioRow, episodioAnteriorRow, proximoEpisodioRow]) => { if (!animeRow) return res.status(404).send('Anime (exibir) não encontrado.'); if (!episodioRow) return res.status(404).send('Episódio (exibir) não encontrado.'); res.json({ anime: animeRow, episodios: [episodioRow], episodio_anterior: episodioAnteriorRow ? `/animes_exibir/${animeId}/episodio/${(episodioAnteriorRow).episodio}` : null, proximo_episodio: proximoEpisodioRow ? `/animes_exibir/${animeId}/episodio/${(proximoEpisodioRow).episodio}` : null }); }).catch(() => { if(!res.headersSent) res.status(500).send('Erro buscar dados.');});
});
app.get('/animes-lancados-hoje', (req, res) => {
    const hoje = new Date().toISOString().split('T')[0];
    const query = `SELECT e.*, a.id as anime_db_id, a.capa as anime_capa, a.titulo as anime_titulo, a.genero as anime_genero, a.tipoMidia as anime_tipoMidia FROM episodios e JOIN animes a ON e.anime_id = a.id WHERE (e.alertanovoep = 1 OR DATE(e.data_lancamento) = DATE(?)) ORDER BY e.data_lancamento DESC, a.id DESC, e.numero ASC;`;
    db.all(query, [hoje], (err, rows) => { if (err) return res.status(500).json({ error: 'Erro buscar eps hoje.' }); res.json({ episodiosNovos: rows.map(row => ({ id: row.id, temporada: row.temporada, numero: row.numero, nome: row.nome, link: row.link, capa_ep: row.capa_ep, alertanovoep: row.alertanovoep, data_lancamento: row.data_lancamento, anime: { id: row.anime_db_id, capa: row.anime_capa, titulo: row.anime_titulo, generos: row.anime_genero ? row.anime_genero.split(',') : [], tipoMidia: row.anime_tipoMidia }})) }); });
});
app.post('/enviarAviso', verifyAdminToken, (req, res) => { 
    const { titulo, conteudo } = req.body; if (!titulo || !conteudo) return res.status(400).json({ error: 'Título/conteúdo obrigatórios.' });
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        db.run("UPDATE avisos SET ativo = 0 WHERE ativo = 1", (errDeactivate) => {
            if (errDeactivate) { db.run("ROLLBACK"); return res.status(500).json({ error: 'Erro gerenciar avisos.' }); }
            db.run("INSERT INTO avisos (titulo, conteudo, ativo) VALUES (?, ?, 1)", [titulo, conteudo], function(insertError) { if (insertError) { db.run("ROLLBACK"); return res.status(500).json({ error: 'Erro inserir aviso.' }); } db.run("COMMIT"); res.json({ id: this.lastID, titulo, conteudo, message: "Aviso enviado!" }); });
        });
    });
});
app.get('/avisoAtivo', (req, res) => {
    db.get("SELECT * FROM avisos WHERE ativo = 1 ORDER BY dataHoraPostagem DESC LIMIT 1", (err, row) => { if (err) return res.status(500).json({ error: 'Erro buscar aviso.' }); if (!row) return res.status(404).json({ message: 'Nenhum aviso ativo.'}); res.json(row); });
});
const sites = { /* Scraper functions */ };
app.get('/scrape/:site/:inicio', verifyAdminToken, async (req, res) => { 
    const { site, inicio } = req.params; if (!(site in sites)) return res.status(404).json({error: 'Site não suportado'});
    try { const data = await sites[site](inicio); res.json(data); } catch (error) { res.status(500).json({error: `Erro scraper: ${error.message}`});}
});
app.get('/api/news', (req, res) => { db.all('SELECT * FROM news_articles ORDER BY published_at DESC', (err, rows) => { if (err) return res.status(500).json({ error: 'Failed to retrieve news.' }); res.json(rows.map(r => ({...r, tags: r.tags ? r.tags.split(',') : [] }))); }); });
app.get('/api/news/:slug', (req, res) => { const { slug } = req.params; db.get('SELECT * FROM news_articles WHERE slug = ?', [slug], (err, row) => { if (err) return res.status(500).json({ error: 'Failed to retrieve article.' }); if (!row) return res.status(404).json({ error: 'Article not found.' }); res.json({...row, tags: row.tags ? row.tags.split(',') : [] }); }); });
app.post('/admin/news', verifyAdminToken, (req, res) => {
    const { title, content_html, author_name, cover_image_url, cover_video_url, tags } = req.body; if (!title || !content_html || !author_name) return res.status(400).json({ error: 'Title, content, author required.' });
    const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '') + '-' + Date.now().toString().slice(-5); const snippet = content_html.replace(/<[^>]+>/g, '').substring(0, 150) + '...'; const tagsString = Array.isArray(tags) ? tags.join(',') : '';
    const query = 'INSERT INTO news_articles (slug, title, cover_image_url, cover_video_url, content_html, author_name, tags, snippet, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)';
    db.run(query, [slug, title, cover_image_url, cover_video_url, content_html, author_name, tagsString, snippet], function(err) { if (err) return res.status(500).json({ error: 'Failed to create article.' }); res.status(201).json({ id: this.lastID, slug, title, content_html, author_name, published_at: new Date().toISOString(), tags: tags || [], snippet, cover_image_url, cover_video_url }); });
});
app.put('/admin/news/:id', verifyAdminToken, (req, res) => {
    const { id } = req.params; const { title, content_html, author_name, cover_image_url, cover_video_url, tags } = req.body; if (!title || !content_html || !author_name) return res.status(400).json({ error: 'Title, content, author required.' });
    const snippet = content_html.replace(/<[^>]+>/g, '').substring(0, 150) + '...'; const tagsString = Array.isArray(tags) ? tags.join(',') : '';
    const query = 'UPDATE news_articles SET title = ?, cover_image_url = ?, cover_video_url = ?, content_html = ?, author_name = ?, tags = ?, snippet = ?, published_at = CURRENT_TIMESTAMP WHERE id = ?';
    db.run(query, [title, cover_image_url, cover_video_url, content_html, author_name, tagsString, snippet, id], function(err) { if (err) return res.status(500).json({ error: 'Failed to update article.' }); if (this.changes === 0) return res.status(404).json({ error: 'Article not found.' }); db.get('SELECT * FROM news_articles WHERE id = ?', [id], (fetchErr, updatedArticle) => { if (fetchErr || !updatedArticle) return res.status(500).json({ error: "Failed to fetch updated." }); res.json({...updatedArticle, tags: updatedArticle.tags ? updatedArticle.tags.split(',') : []}); }); });
});
app.delete('/admin/news/:id', verifyAdminToken, (req, res) => { const { id } = req.params; db.run('DELETE FROM news_articles WHERE id = ?', id, function(err) { if (err) return res.status(500).json({ error: 'Failed to delete article.' }); if (this.changes === 0) return res.status(404).json({ error: 'Article not found.'}); res.json({ success: true }); }); });
app.get('/api/community/posts', (req, res) => { db.all('SELECT * FROM community_posts ORDER BY created_at DESC', (err, rows) => { if (err) return res.status(500).json({ error: 'Failed to retrieve posts.' }); res.json(rows); }); });
app.post('/api/community/posts', verifyToken, (req, res) => {
    const { contentText, contentImageURL, sticker_url } = req.body; const userId = req.user.id;
    db.get('SELECT nome, imagem_perfil FROM usuarios WHERE id = ?', [userId], (errUser, userRow) => { if (errUser || !userRow) return res.status(500).json({ error: 'Failed to fetch user.' }); const userName = userRow.nome; const userAvatar = userRow.imagem_perfil; const query = 'INSERT INTO community_posts (user_id, user_name, user_avatar, content_text, content_image_url, sticker_url) VALUES (?, ?, ?, ?, ?, ?)'; db.run(query, [userId, userName, userAvatar, contentText, contentImageURL, sticker_url], function(err) { if (err) return res.status(500).json({ error: 'Failed to create post.' }); db.get('SELECT * FROM community_posts WHERE id = ?', [this.lastID], (fetchErr, newPost) => { if (fetchErr || !newPost) return res.status(500).json({ error: "Failed to fetch new post."}); res.status(201).json(newPost); }); }); });
});
app.post('/api/community/posts/:postId/like', verifyToken, (req, res) => {
    const postId = req.params.postId; const userId = req.user.id;
    db.get('SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?', [postId, userId], (err, like) => { if (err) return res.status(500).json({ error: 'DB error.' }); if (like) { db.run('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?', [postId, userId], () => { db.run('UPDATE community_posts SET likes_count = MAX(0, likes_count - 1) WHERE id = ?', [postId], () => { db.get('SELECT likes_count FROM community_posts WHERE id = ?', [postId], (e, r) => res.json({ success: true, liked: false, likesCount: r ? r.likes_count : 0 })); }); }); } else { db.run('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)', [postId, userId], () => { db.run('UPDATE community_posts SET likes_count = likes_count + 1 WHERE id = ?', [postId], () => { db.get('SELECT likes_count FROM community_posts WHERE id = ?', [postId], (e,r) => res.json({ success: true, liked: true, likesCount: r ? r.likes_count : 0 })); }); }); } });
});
app.get('/api/community/posts/:postId/comments', (req, res) => { const { postId } = req.params; db.all('SELECT * FROM community_comments WHERE post_id = ? ORDER BY created_at ASC', [postId], (err, rows) => { if (err) return res.status(500).json({ error: 'Failed to retrieve comments.' }); res.json(rows); }); });
app.post('/api/community/posts/:postId/comments', verifyToken, (req, res) => {
    const { postId } = req.params; const { contentText } = req.body; const userId = req.user.id;
    db.get('SELECT nome, imagem_perfil FROM usuarios WHERE id = ?', [userId], (errUser, userRow) => { if (errUser || !userRow) return res.status(500).json({ error: 'Failed to fetch user.' }); const userName = userRow.nome; const userAvatar = userRow.imagem_perfil; const query = 'INSERT INTO community_comments (post_id, user_id, user_name, user_avatar, content_text) VALUES (?, ?, ?, ?, ?)'; db.run(query, [postId, userId, userName, userAvatar, contentText], function(err) { if (err) return res.status(500).json({ error: 'Failed to add comment.' }); db.run('UPDATE community_posts SET comments_count = comments_count + 1 WHERE id = ?', [postId]); db.get('SELECT * FROM community_comments WHERE id = ?', [this.lastID], (fetchErr, newComment) => { if (fetchErr || !newComment) return res.status(500).json({error: "Failed to fetch new comment."}); res.status(201).json(newComment); }); }); });
});
app.get('/api/notifications', verifyToken, (req, res) => { const userId = req.user.id; db.all('SELECT * FROM user_notifications WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, rows) => { if (err) return res.status(500).json({ error: 'Failed to retrieve notifications.' }); res.json(rows.map(r => ({...r, is_read: r.is_read === 1}))); }); });
app.post('/api/notifications/:notificationId/read', verifyToken, (req, res) => { const { notificationId } = req.params; const userId = req.user.id; db.run('UPDATE user_notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [notificationId, userId], function(err) { if (err) return res.status(500).json({ error: 'Failed to mark as read.' }); if (this.changes === 0) return res.status(404).json({ error: 'Notification not found.'}); res.json({ success: true }); }); });
app.post('/api/notifications/read-all', verifyToken, (req, res) => { const userId = req.user.id; db.run('UPDATE user_notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0', [userId], function(err) { if (err) return res.status(500).json({ error: 'Failed to mark all as read.' }); res.json({ success: true, markedCount: this.changes }); }); });
app.delete('/admin/community/posts/:postId', verifyAdminToken, (req, res) => { const { postId } = req.params; db.run('DELETE FROM community_posts WHERE id = ?', postId, function(err) { if (err) return res.status(500).json({ error: 'Failed to delete post.' }); if (this.changes === 0) return res.status(404).json({ error: 'Post not found.'}); res.json({ success: true, message: `Post ${postId} deleted.` }); }); });
app.get('/admin/community/comments', verifyAdminToken, (req,res) => { db.all('SELECT * FROM community_comments ORDER BY created_at DESC', (err, rows) => { if (err) return res.status(500).json({ error: 'Failed to retrieve comments.' }); res.json(rows); }); });
app.delete('/admin/community/comments/:commentId', verifyAdminToken, (req, res) => {
    const { commentId } = req.params;
    db.get('SELECT post_id FROM community_comments WHERE id = ?', [commentId], (err, row) => { if (err) return res.status(500).json({ error: 'Error finding comment.' }); const postId = row ? row.post_id : null; db.run('DELETE FROM community_comments WHERE id = ?', commentId, function(deleteErr) { if (deleteErr) return res.status(500).json({ error: 'Failed to delete comment.' }); if (this.changes === 0) return res.status(404).json({ error: 'Comment not found.'}); if (postId) db.run('UPDATE community_posts SET comments_count = MAX(0, comments_count - 1) WHERE id = ?', [postId]); res.json({ success: true, message: `Comment ${commentId} deleted.` }); }); });
});
app.get('/api/stickers', (req, res) => { db.all('SELECT * FROM stickers ORDER BY category, name', (err, rows) => { if (err) return res.status(500).json({ error: 'Failed to retrieve stickers.' }); res.json(rows); }); });
app.post('/admin/stickers', verifyAdminToken, (req, res) => { const { name, category, image_url } = req.body; if (!name || !image_url) return res.status(400).json({ error: 'Name and URL required.' }); db.run('INSERT INTO stickers (name, category, image_url) VALUES (?, ?, ?)', [name, category || null, image_url], function(err) { if (err) return res.status(500).json({ error: 'Failed to add sticker.' }); res.status(201).json({ id: this.lastID, name, category, image_url, created_at: new Date().toISOString() }); }); });
app.delete('/admin/stickers/:id', verifyAdminToken, (req, res) => { const { id } = req.params; db.run('DELETE FROM stickers WHERE id = ?', id, function(err) { if (err) return res.status(500).json({ error: 'Failed to delete sticker.' }); if (this.changes === 0) return res.status(404).json({ error: 'Sticker not found.'}); res.json({ success: true, message: 'Sticker deleted.' }); }); });
app.get('/comments/anime/:animeId/episode/:episodeNumber', (req, res) => {
    const { animeId, episodeNumber } = req.params; db.all('SELECT * FROM comments WHERE anime_id = ? AND episode_number = ? ORDER BY created_at DESC', [animeId, episodeNumber], (err, rows) => { if (err) return res.status(500).json({ error: 'Erro buscar comentários.' }); const commentsMap = new Map(); const rootComments = []; rows.forEach(comment => { comment.replies = []; commentsMap.set(comment.id, comment); if (comment.parent_comment_id) { if (commentsMap.has(comment.parent_comment_id)) commentsMap.get(comment.parent_comment_id).replies.push(comment); } else rootComments.push(comment); }); res.json(rootComments); });
});
app.post('/comments', verifyToken, (req, res) => {
    const { anime_id, episode_number, content, parent_comment_id } = req.body; const user_id = req.user.id;
    db.get('SELECT nome, imagem_perfil FROM usuarios WHERE id = ?', [user_id], (errUser, userRow) => { if (errUser || !userRow) return res.status(500).json({ error: 'Usuário não encontrado.' }); const user_nome = userRow.nome; const user_imagem_perfil = userRow.imagem_perfil; const query = 'INSERT INTO comments (anime_id, episode_number, user_id, user_nome, user_imagem_perfil, parent_comment_id, content) VALUES (?, ?, ?, ?, ?, ?, ?)'; db.run(query, [anime_id, episode_number, user_id, user_nome, user_imagem_perfil, parent_comment_id, content], function(err) { if (err) return res.status(500).json({ error: 'Erro postar comentário.' }); db.get('SELECT * FROM comments WHERE id = ?', [this.lastID], (e, newComment) => res.status(201).json(newComment) ); }); });
});
app.put('/comments/:commentId', verifyToken, (req, res) => {
    const { commentId } = req.params; const { content } = req.body; const user_id = req.user.id;
    db.run('UPDATE comments SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?', [content, commentId, user_id], function(err) { if (err) return res.status(500).json({ error: 'Erro atualizar comentário.' }); if (this.changes === 0) return res.status(403).json({ error: 'Não autorizado.'}); db.get('SELECT * FROM comments WHERE id = ?', [commentId], (e, updatedComment) => res.json(updatedComment) ); });
});
app.delete('/comments/:commentId', verifyToken, (req, res) => {
    const { commentId } = req.params; const user_id = req.user.id;
    db.get('SELECT user_id FROM comments WHERE id = ?', [commentId], (err, comment) => { if (err || !comment) return res.status(404).json({ error: 'Comentário não encontrado.' }); if (comment.user_id !== user_id && !req.user.admin) return res.status(403).json({ error: 'Não autorizado.' }); db.run('DELETE FROM comments WHERE id = ?', [commentId], (delErr) => { if (delErr) return res.status(500).json({ error: 'Erro excluir comentário.' }); res.json({ success: true }); }); });
});
app.get('/admin/comments', verifyAdminToken, (req, res) => { db.all('SELECT * FROM comments ORDER BY created_at DESC', (err, rows) => { if (err) return res.status(500).json({ error: 'Erro buscar comentários.' }); res.json(rows); }); });
app.delete('/admin/comments/:commentId', verifyAdminToken, (req, res) => { const { commentId } = req.params; db.run('DELETE FROM comments WHERE id = ?', [commentId], function(err) { if (err) return res.status(500).json({ error: 'Erro excluir (admin).' }); if (this.changes === 0) return res.status(404).json({ error: 'Comentário não encontrado.'}); res.json({ success: true }); }); });
app.post('/support-tickets', verifyToken, (req, res) => {
    const { subject, description } = req.body; const user_id = req.user.id; const user_email = req.user.email; const user_nome = req.user.nome; if (!subject || !description) return res.status(400).json({ error: 'Assunto/descrição obrigatórios.' });
    db.run('INSERT INTO support_tickets (user_id, user_nome, user_email, subject, description) VALUES (?, ?, ?, ?, ?)', [user_id, user_nome, user_email, subject, description], function(err) { if (err) return res.status(500).json({ error: 'Erro criar ticket.' }); res.status(201).json({ id: this.lastID, subject, description, user_email, status: 'Open' }); });
});
app.get('/support-tickets/my-tickets', verifyToken, (req, res) => { const user_id = req.user.id; db.all('SELECT * FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC', [user_id], (err, rows) => { if (err) return res.status(500).json({ error: 'Erro buscar tickets.' }); res.json(rows); }); });
app.get('/admin/support-tickets', verifyAdminToken, (req, res) => { db.all('SELECT * FROM support_tickets ORDER BY created_at DESC', (err, rows) => { if (err) return res.status(500).json({ error: 'Erro buscar todos tickets.' }); res.json(rows); }); });
app.get('/admin/support-tickets/:ticketId', verifyAdminToken, (req, res) => {
    const { ticketId } = req.params; db.get('SELECT * FROM support_tickets WHERE id = ?', [ticketId], (err, ticket) => { if (err || !ticket) return res.status(404).json({ error: 'Ticket não encontrado.' }); db.all('SELECT * FROM support_ticket_replies WHERE ticket_id = ? ORDER BY created_at ASC', [ticketId], (errReplies, replies) => { if (errReplies) return res.status(500).json({ error: 'Erro buscar respostas.' }); res.json({ ...ticket, replies }); }); });
});
app.post('/admin/support-tickets/:ticketId/reply', verifyAdminToken, (req, res) => {
    const { ticketId } = req.params; const { message } = req.body; const admin_id = req.user.id; const replier_name = req.user.nome; if (!message) return res.status(400).json({ error: 'Mensagem obrigatória.' });
    db.run('INSERT INTO support_ticket_replies (ticket_id, admin_id, replier_name, message) VALUES (?, ?, ?, ?)', [ticketId, admin_id, replier_name, message], function(err) { if (err) return res.status(500).json({ error: 'Erro adicionar resposta.' }); db.run("UPDATE support_tickets SET status = 'Answered', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [ticketId]); db.get('SELECT * FROM support_ticket_replies WHERE id = ?', [this.lastID], (e, newReply) => res.status(201).json(newReply)); });
});
app.put('/admin/support-tickets/:ticketId/status', verifyAdminToken, (req, res) => {
    const { ticketId } = req.params; const { status } = req.body; if (!['Open', 'In Progress', 'Answered', 'Closed'].includes(status)) return res.status(400).json({ error: 'Status inválido.' });
    db.run('UPDATE support_tickets SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, ticketId], function(err) { if (err) return res.status(500).json({ error: 'Erro atualizar status.' }); if (this.changes === 0) return res.status(404).json({ error: 'Ticket não encontrado.'}); db.get('SELECT * FROM support_tickets WHERE id = ?', [ticketId], (e, updatedTicket) => res.json(updatedTicket)); });
});
app.get('/api/my-collection', verifyToken, (req, res) => {
    const userId = req.user.id; const query = ` SELECT uc.*, a.id as anime_db_id, a.capa, a.titulo, a.tituloAlternativo, a.selo, a.sinopse, a.genero as generos_str, a.classificacao, a.status as anime_status, a.qntd_temporadas, a.anoLancamento, a.dataPostagem, a.ovas, a.filmes, a.estudio, a.diretor, a.tipoMidia, a.visualizacoes FROM user_collections uc JOIN animes a ON uc.anime_id = a.id WHERE uc.user_id = ? ORDER BY uc.added_at DESC `;
    db.all(query, [userId], (err, rows) => { if (err) return res.status(500).json({ error: 'Failed to retrieve collection.' }); const collectionItems = rows.map(row => { const animeBase = { id: row.anime_db_id, capa: row.capa, titulo: row.titulo, tituloAlternativo: row.tituloAlternativo, selo: row.selo, sinopse: row.sinopse, generos: row.generos_str ? row.generos_str.split(',') : [], classificacao: row.classificacao, status: row.anime_status, qntd_temporadas: row.qntd_temporadas, anoLancamento: row.anoLancamento, dataPostagem: row.dataPostagem, ovas: row.ovas, filmes: row.filmes, estudio: row.estudio, diretor: row.diretor, tipoMidia: row.tipoMidia, visualizacoes: row.visualizacoes }; return { ...animeBase, collection_id: row.id, user_id: row.user_id, collectionStatus: row.status, addedAt: row.added_at, lastWatchedEpisode: row.last_watched_episode, notes: row.notes, }; }); res.json(collectionItems); });
});
app.post('/api/my-collection', verifyToken, (req, res) => {
    const userId = req.user.id; const { anime_id, status, last_watched_episode, notes } = req.body; if (!anime_id || !status) return res.status(400).json({ error: 'Anime ID e status são obrigatórios.' });
    const query = ` INSERT INTO user_collections (user_id, anime_id, status, last_watched_episode, notes, added_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(user_id, anime_id) DO UPDATE SET status = excluded.status, last_watched_episode = excluded.last_watched_episode, notes = excluded.notes, added_at = CASE WHEN excluded.status != user_collections.status THEN CURRENT_TIMESTAMP ELSE user_collections.added_at END RETURNING *; `; 
    db.get(query, [userId, anime_id, status, last_watched_episode, notes], function(err, row) { if (err) return res.status(500).json({ error: 'Failed to add/update item.' }); if (!row) return res.status(500).json({ error: 'Failed to retrieve item after upsert.' }); db.get(`SELECT * FROM animes WHERE id = ?`, [row.anime_id], (animeErr, animeRow) => { if (animeErr || !animeRow) return res.status(500).json({ error: 'Failed to fetch anime details.'}); const collectionItem = { ...animeRow, generos: animeRow.genero ? animeRow.genero.split(',') : [], collection_id: row.id, user_id: row.user_id, collectionStatus: row.status, addedAt: row.added_at, lastWatchedEpisode: row.last_watched_episode, notes: row.notes, }; res.status(200).json(collectionItem); }); });
});
app.delete('/api/my-collection/:animeId', verifyToken, (req, res) => { const userId = req.user.id; const animeId = req.params.animeId; db.run('DELETE FROM user_collections WHERE user_id = ? AND anime_id = ?', [userId, animeId], function(err) { if (err) return res.status(500).json({ error: 'Failed to remove item.' }); if (this.changes === 0) return res.status(404).json({ error: 'Item not found.' }); res.json({ success: true }); }); });
app.get('/api/featured-content/:listName', (req, res) => { const { listName } = req.params; const query = ` SELECT fc.anime_id, fc.display_order, a.* FROM featured_content fc JOIN animes a ON fc.anime_id = a.id WHERE fc.list_name = ? ORDER BY fc.display_order ASC, a.id DESC `; db.all(query, [listName], (err, rows) => { if (err) return res.status(500).json({ error: 'Failed to retrieve featured.' }); res.json(rows.map(r => ({...r, generos: r.genero ? r.genero.split(',') : []}))); }); });
app.get('/admin/featured-content/:listName', verifyAdminToken, (req, res) => { const { listName } = req.params; const query = ` SELECT a.*, fc.display_order FROM featured_content fc JOIN animes a ON fc.anime_id = a.id WHERE fc.list_name = ? ORDER BY fc.display_order ASC, a.id DESC `; db.all(query, [listName], (err, rows) => { if (err) return res.status(500).json({ error: 'Failed to retrieve featured (admin).' }); const mappedRows = rows.map(row => ({ ...row, generos: row.genero ? row.genero.split(',') : [] })); res.json(mappedRows); }); });
app.post('/admin/featured-content/:listName', verifyAdminToken, (req, res) => {
    const { listName } = req.params; const { anime_id } = req.body; if (!anime_id) return res.status(400).json({ error: 'Anime ID required.' });
    db.get('SELECT MAX(display_order) as max_order FROM featured_content WHERE list_name = ?', [listName], (errMax, rowMax) => { if (errMax) return res.status(500).json({ error: "Failed to get display order."}); const display_order = (rowMax && typeof rowMax.max_order === 'number') ? rowMax.max_order + 1 : 0; const query = 'INSERT INTO featured_content (list_name, anime_id, display_order) VALUES (?, ?, ?)'; db.run(query, [listName, anime_id, display_order], function(err) { if (err) return res.status(500).json({ error: 'Failed to add item. Already exists?' }); res.status(201).json({ id: this.lastID, list_name: listName, anime_id, display_order }); }); });
});
app.put('/admin/featured-content/:listName', verifyAdminToken, (req, res) => {
    const { listName } = req.params; const { ordered_anime_ids } = req.body; if (!Array.isArray(ordered_anime_ids)) return res.status(400).json({ error: 'ordered_anime_ids must be array.' });
    db.serialize(() => { db.run("BEGIN TRANSACTION"); let errorOccurred = false; ordered_anime_ids.forEach((anime_id, index) => { if(errorOccurred) return; db.run('UPDATE featured_content SET display_order = ? WHERE list_name = ? AND anime_id = ?', [index, listName, anime_id], (err) => { if (err) errorOccurred = true; }); }); if(errorOccurred){ db.run("ROLLBACK"); return res.status(500).json({ error: 'Failed to update order.' }); } db.run("COMMIT"); res.json({ success: true, message: `Order updated for ${listName}.` }); });
});
app.delete('/admin/featured-content/:listName/:animeId', verifyAdminToken, (req, res) => { const { listName, animeId } = req.params; db.run('DELETE FROM featured_content WHERE list_name = ? AND anime_id = ?', [listName, animeId], function(err) { if (err) return res.status(500).json({ error: 'Failed to remove item.' }); if (this.changes === 0) return res.status(404).json({ error: 'Item not found.' }); res.json({ success: true }); }); });
app.get('/api/my-downloads', verifyToken, (req, res) => { const userId = req.user.id; db.all('SELECT * FROM user_downloads WHERE user_id = ? ORDER BY downloaded_at DESC', [userId], (err, rows) => { if (err) return res.status(500).json({ error: 'Failed to retrieve downloads.' }); res.json(rows); }); });
app.post('/api/my-downloads', verifyToken, (req, res) => {
    const userId = req.user.id; const { anime_id, episode_id, title, episode_title, season_number, episode_number, thumbnail_url } = req.body; if (!anime_id || !title) return res.status(400).json({ error: 'Anime ID and title required.' });
    const mockSizeMb = Math.floor(Math.random() * (500 - 100 + 1) + 100); const query = ` INSERT INTO user_downloads (user_id, anime_id, episode_id, title, episode_title, season_number, episode_number, thumbnail_url, size_mb) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) `;
    db.run(query, [userId, anime_id, episode_id, title, episode_title, season_number, episode_number, thumbnail_url, mockSizeMb], function(err) { if (err) return res.status(500).json({ error: 'Failed to add download.' }); db.get('SELECT * FROM user_downloads WHERE id = ?', [this.lastID], (fetchErr, newDownload) => { if (fetchErr || !newDownload) return res.status(500).json({ error: "Failed to fetch new download."}); res.status(201).json(newDownload); }); });
});
app.delete('/api/my-downloads/:itemId', verifyToken, (req, res) => { const userId = req.user.id; const itemId = req.params.itemId; db.run('DELETE FROM user_downloads WHERE id = ? AND user_id = ?', [itemId, userId], function(err) { if (err) return res.status(500).json({ error: 'Failed to remove download.' }); if (this.changes === 0) return res.status(404).json({ error: 'Download not found.' }); res.json({ success: true }); }); });

app.listen(PORT, () => { console.log(`Servidor rodando em http://localhost:${PORT}`); });
