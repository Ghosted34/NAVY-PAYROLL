const express  = require("express");
const router   = express.Router();
const pool     = require("../../config/db");
const verifyToken = require("../../middware/authentication");
const multer   = require("multer");
const path     = require("path");
const fs       = require("fs");
const { v4: uuidv4 } = require("uuid");

// ══════════════════════════════════════════════════════════
// ATTACHMENT CONFIG
// ══════════════════════════════════════════════════════════
const MAX_FILE_SIZE   = 5 * 1024 * 1024;
const MAX_ATTACHMENTS = 3;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

function getUploadDir() {
  const now  = new Date();
  const dir  = path.join(
    __dirname, "../../uploads/mail",
    String(now.getFullYear()),
    String(now.getMonth() + 1).padStart(2, "0")
  );
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, getUploadDir()),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(0, 10);
    cb(null, uuidv4() + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) =>
    ALLOWED_MIME_TYPES.has(file.mimetype)
      ? cb(null, true)
      : cb(new Error("File type not allowed")),
});

// ── Helper: physically delete a message row + its attachment files ──
async function hardDeleteMessage(msgId) {
  const [atts] = await pool.query(
    "SELECT stored_name FROM mail_attachments WHERE mail_id = ?", [msgId]
  );
  for (const att of atts) {
    const filePath = path.join(__dirname, "../../uploads/mail", att.stored_name);
    fs.unlink(filePath, () => {});
  }
  // Attachment rows cascade-delete via FK ON DELETE CASCADE
  await pool.query("DELETE FROM user_mails WHERE id = ?", [msgId]);
}

// ══════════════════════════════════════════════════════════
// POST /api/messages/upload
// ══════════════════════════════════════════════════════════
router.post("/upload", verifyToken, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file received" });
  try {
    const tempToken    = uuidv4();
    const relativePath = path
      .relative(path.join(__dirname, "../../uploads/mail"), req.file.path)
      .replace(/\\/g, "/");

    await pool.query(
      `INSERT INTO mail_attachments
         (mail_id, temp_token, filename, stored_name, mime_type, file_size, uploaded_by)
       VALUES (NULL, ?, ?, ?, ?, ?, ?)`,
      [tempToken, req.file.originalname.slice(0, 255), relativePath,
       req.file.mimetype, req.file.size, req.user_id]
    );
    res.status(201).json({
      temp_token: tempToken,
      filename:   req.file.originalname,
      file_size:  req.file.size,
      mime_type:  req.file.mimetype,
    });
  } catch (err) {
    fs.unlink(req.file.path, () => {});
    console.error("❌ Upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

router.use(function (err, req, res, next) {
  if (err instanceof multer.MulterError || err.message === "File type not allowed")
    return res.status(400).json({ error: err.message });
  next(err);
});

// ══════════════════════════════════════════════════════════
// POST /api/messages — Send a message
// ══════════════════════════════════════════════════════════
router.post("/", verifyToken, async (req, res) => {
  const { to_user_id, to_name, subject, body, attachment_tokens } = req.body;
  if (!to_user_id || !subject || !body)
    return res.status(400).json({ error: "Recipient, subject and body are required" });

  const tokens = Array.isArray(attachment_tokens) ? attachment_tokens : [];
  if (tokens.length > MAX_ATTACHMENTS)
    return res.status(400).json({ error: `Maximum ${MAX_ATTACHMENTS} attachments allowed` });

  try {
    const [[sender]] = await pool.query(
      "SELECT email FROM users WHERE user_id = ? LIMIT 1", [req.user_id]
    );
    const fromEmail = sender?.email || req.email || "";

    const [result] = await pool.query(
      `INSERT INTO user_mails
         (from_user_id, from_name, from_email, to_user_id, to_name, subject, body)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user_id, req.user_fullname, fromEmail, to_user_id, to_name, subject, body]
    );
    const mailId = result.insertId;

    if (tokens.length > 0) {
      await pool.query(
        `UPDATE mail_attachments SET mail_id = ?
         WHERE temp_token IN (?) AND uploaded_by = ? AND mail_id IS NULL`,
        [mailId, tokens, req.user_id]
      );
    }
    res.status(201).json({ message: "✅ Message sent" });
  } catch (err) {
    console.error("❌ Send message error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ══════════════════════════════════════════════════════════
// GET /api/messages/inbox
// Sets delivered_at on first fetch (= delivery timestamp)
// ══════════════════════════════════════════════════════════
router.get("/inbox", verifyToken, async (req, res) => {
  const { since, page = 1, limit = 20 } = req.query;
  try {
    let rows;
    if (since) {
      [rows] = await pool.query(
        `SELECT id, from_user_id, from_name, from_email, subject, body, is_read,
                sent_at, delivered_at, read_at
         FROM user_mails
         WHERE to_user_id = ? AND sent_at > ? AND deleted_by_receiver = FALSE
         ORDER BY sent_at DESC`,
        [req.user_id, since]
      );
    } else {
      const offset = (parseInt(page) - 1) * parseInt(limit);
      [rows] = await pool.query(
        `SELECT id, from_user_id, from_name, from_email, subject, body, is_read,
                sent_at, delivered_at, read_at
         FROM user_mails
         WHERE to_user_id = ? AND deleted_by_receiver = FALSE
         ORDER BY sent_at DESC
         LIMIT ? OFFSET ?`,
        [req.user_id, parseInt(limit), offset]
      );
    }

    // Mark delivered_at for any messages that haven't been stamped yet.
    // This is the moment the receiver's client first "sees" the message.
    const undelivered = rows.filter(r => !r.delivered_at).map(r => r.id);
    if (undelivered.length > 0) {
      await pool.query(
        "UPDATE user_mails SET delivered_at = NOW() WHERE id IN (?) AND delivered_at IS NULL",
        [undelivered]
      );
      // Reflect the timestamp in what we return
      const now = new Date().toISOString();
      rows.forEach(r => { if (!r.delivered_at) r.delivered_at = now; });
    }

    const [[{ unread }]] = await pool.query(
      `SELECT COUNT(*) as unread FROM user_mails
       WHERE to_user_id = ? AND is_read = 0 AND deleted_by_receiver = FALSE`,
      [req.user_id]
    );

    res.json({
      messages: rows,
      unread,
      server_time:      new Date().toISOString(),
      // getTimezoneOffset() returns minutes BEHIND UTC (negative for east zones)
      // We negate it so: UTC=0, UTC+1=60, UTC-1=-60 — intuitive for the client
      server_tz_offset: -(new Date().getTimezoneOffset())
    });
  } catch (err) {
    console.error("❌ Inbox error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ══════════════════════════════════════════════════════════
// GET /api/messages/sent
// Includes tick status columns for the sender's list view
// ══════════════════════════════════════════════════════════
router.get("/sent", verifyToken, async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  try {
    const [rows] = await pool.query(
      `SELECT id, to_user_id, to_name, subject, body,
              sent_at, delivered_at, read_at
       FROM user_mails
       WHERE from_user_id = ? AND deleted_by_sender = FALSE AND is_notification = FALSE
       ORDER BY sent_at DESC
       LIMIT ? OFFSET ?`,
      [req.user_id, parseInt(limit), offset]
    );
    res.json({ messages: rows });
  } catch (err) {
    console.error("❌ Sent error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ══════════════════════════════════════════════════════════
// GET /api/messages/sent-item/:id
// ══════════════════════════════════════════════════════════
router.get("/sent-item/:id", verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM user_mails WHERE id = ? AND from_user_id = ?",
      [req.params.id, req.user_id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Message not found" });
    const msg = rows[0];
    const [attachments] = await pool.query(
      "SELECT id, filename, stored_name, mime_type, file_size FROM mail_attachments WHERE mail_id = ?",
      [msg.id]
    );
    msg.attachments = attachments;
    res.json(msg);
  } catch (err) {
    console.error("❌ Get sent message error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ══════════════════════════════════════════════════════════
// GET /api/messages/:id — Open inbox message
// Sets read_at on first open
// ══════════════════════════════════════════════════════════
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM user_mails WHERE id = ? AND to_user_id = ?",
      [req.params.id, req.user_id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Message not found" });

    const msg = rows[0];

    // Stamp read_at only on first open; preserve existing timestamp
    if (!msg.read_at) {
      await pool.query(
        "UPDATE user_mails SET is_read = 1, read_at = NOW() WHERE id = ?",
        [req.params.id]
      );
      msg.read_at = new Date().toISOString();
    } else {
      await pool.query("UPDATE user_mails SET is_read = 1 WHERE id = ?", [req.params.id]);
    }

    const [attachments] = await pool.query(
      "SELECT id, filename, stored_name, mime_type, file_size FROM mail_attachments WHERE mail_id = ?",
      [msg.id]
    );
    msg.attachments = attachments;
    res.json(msg);
  } catch (err) {
    console.error("❌ Get message error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ══════════════════════════════════════════════════════════
// GET /api/messages/tick/:id
// Returns tick status + timestamps for a sent message.
// Only the original sender may call this.
// ══════════════════════════════════════════════════════════
router.get("/tick/:id", verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT sent_at, delivered_at, read_at
       FROM user_mails WHERE id = ? AND from_user_id = ?`,
      [req.params.id, req.user_id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Message not found" });

    const { sent_at, delivered_at, read_at } = rows[0];

    // tick: 'sent' | 'delivered' | 'read'
    const tick = read_at ? "read" : delivered_at ? "delivered" : "sent";

    res.json({ tick, sent_at, delivered_at, read_at });
  } catch (err) {
    console.error("❌ Tick error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ══════════════════════════════════════════════════════════
// GET /api/messages/attachment/:id
// ══════════════════════════════════════════════════════════
router.get("/attachment/:id", verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.*, m.from_user_id, m.to_user_id
       FROM mail_attachments a
       JOIN user_mails m ON m.id = a.mail_id
       WHERE a.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Attachment not found" });
    const att = rows[0];
    if (att.from_user_id !== req.user_id && att.to_user_id !== req.user_id)
      return res.status(403).json({ error: "Access denied" });

    const filePath = path.join(__dirname, "../../uploads/mail", att.stored_name);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File not found on disk" });

    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(att.filename)}"`);
    res.setHeader("Content-Type", att.mime_type);
    res.sendFile(filePath);
  } catch (err) {
    console.error("❌ Attachment download error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ══════════════════════════════════════════════════════════
// DELETE /api/messages/:id
//
// SENDER "delete for all":
//   → Hard-deletes the row + files immediately
//   → Sends notification ONLY if receiver hadn't already deleted it
//
// SENDER "delete for me":
//   → Sets deleted_by_sender = TRUE (soft)
//   → If receiver had also already deleted it → hard-delete now
//
// RECEIVER "delete for me":
//   → Sets deleted_by_receiver = TRUE (soft)
//   → If sender had also already deleted it → hard-delete now
// ══════════════════════════════════════════════════════════
router.delete("/:id", verifyToken, async (req, res) => {
  const mode = req.query.mode || "me";
  try {
    const [msgs] = await pool.query(
      `SELECT from_user_id, to_user_id, from_name,
              deleted_by_sender, deleted_by_receiver,
              subject, is_notification
       FROM user_mails WHERE id = ?`,
      [req.params.id]
    );
    if (!msgs.length) return res.status(404).json({ error: "Message not found" });

    const msg        = msgs[0];
    const isSender   = msg.from_user_id === req.user_id;
    const isReceiver = msg.to_user_id   === req.user_id;

    if (!isSender && !isReceiver)
      return res.status(403).json({ error: "Not authorized" });

    // ── RECEIVER deletes ───────────────────────────────
    if (isReceiver && !isSender) {
      // "Message Deleted" notifications are ephemeral — always hard-delete,
      // no need to track soft-delete state for the sender side
      if (msg.is_notification || msg.subject === 'Message Deleted') {
        await hardDeleteMessage(req.params.id);
      } else if (msg.deleted_by_sender) {
        // Sender already soft-deleted → both sides gone → hard-delete
        await hardDeleteMessage(req.params.id);
      } else {
        await pool.query(
          "UPDATE user_mails SET deleted_by_receiver = TRUE WHERE id = ?",
          [req.params.id]
        );
      }
      return res.json({ message: "✅ Message deleted from your inbox" });
    }

    // ── SENDER deletes ─────────────────────────────────
    if (isSender) {
      if (mode === "me") {
        if (msg.deleted_by_receiver) {
          // Receiver already deleted → both sides gone → hard-delete
          await hardDeleteMessage(req.params.id);
        } else {
          await pool.query(
            "UPDATE user_mails SET deleted_by_sender = TRUE WHERE id = ?",
            [req.params.id]
          );
        }
        return res.json({ message: "✅ Message deleted from your sent folder" });
      }

      if (mode === "all") {
        // Hard-delete the original message immediately — it's gone for everyone
        const receiverHadDeleted = msg.deleted_by_receiver;
        await hardDeleteMessage(req.params.id);

        // Notify receiver only if they still had the message
        if (!receiverHadDeleted) {
          const [[toUser]] = await pool.query(
            "SELECT full_name FROM users WHERE user_id = ?", [msg.to_user_id]
          );
          await pool.query(
            `INSERT INTO user_mails
               (from_user_id, from_name, to_user_id, to_name, subject, body, is_notification)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              req.user_id,
              req.user_fullname,
              msg.to_user_id,
              toUser ? toUser.full_name : "Recipient",
              "Message Deleted",
              `${req.user_fullname} deleted a message from your conversation`,
              true,
            ]
          );
        }
        return res.json({ message: "✅ Message deleted for all" });
      }
    }
  } catch (err) {
    console.error("❌ Delete message error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ══════════════════════════════════════════════════════════
// GET /api/messages/users/search?q=
// ══════════════════════════════════════════════════════════
router.get("/users/search", verifyToken, async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2)
    return res.status(400).json({ error: "Search query must be at least 2 characters" });
  try {
    const [rows] = await pool.query(
      `SELECT user_id, full_name, email FROM users
       WHERE (full_name LIKE ? OR user_id LIKE ? OR email LIKE ?)
         AND status = 'active' AND user_id != ?
       LIMIT 20`,
      [`%${q}%`, `%${q}%`, `%${q}%`, req.user_id]
    );
    res.json({ users: rows });
  } catch (err) {
    console.error("❌ User search error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ══════════════════════════════════════════════════════════
// CLEANUP — orphaned attachments > 24h
// ══════════════════════════════════════════════════════════
async function cleanupOrphanedAttachments() {
  try {
    const [orphans] = await pool.query(
      `SELECT id, stored_name FROM mail_attachments
       WHERE mail_id IS NULL AND created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)`
    );
    for (const row of orphans) {
      fs.unlink(path.join(__dirname, "../../uploads/mail", row.stored_name), () => {});
      await pool.query("DELETE FROM mail_attachments WHERE id = ?", [row.id]);
    }
    if (orphans.length > 0) console.log(`🧹 Cleaned ${orphans.length} orphaned attachment(s)`);
  } catch (err) {
    console.error("❌ Orphan cleanup error:", err);
  }
}

module.exports = router;
module.exports.cleanupOrphanedAttachments = cleanupOrphanedAttachments;