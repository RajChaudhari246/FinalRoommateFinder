/**
 * Interests Controller
 * Handles expressing interest in potential roommates, viewing incoming/outgoing requests,
 * and accepting, rejecting, or withdrawing interests.
 */
const { pool } = require('../config/database');

async function expressInterest(req, res, next) {
  const senderId = req.session.userId;
  const { receiver_user_id, message } = req.body;
  const receiverId = parseInt(receiver_user_id, 10);

  if (isNaN(receiverId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid recipient user ID.'
    });
  }

  // Prevent self-interest
  if (senderId === receiverId) {
    return res.status(400).json({
      success: false,
      message: 'You cannot express interest in your own profile.'
    });
  }

  try {
    // Verify recipient exists and is active
    const [receiverRows] = await pool.query(
      'SELECT id, full_name FROM users WHERE id = ? AND account_status = "active"',
      [receiverId]
    );

    if (receiverRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'The selected user is not available or does not exist.'
      });
    }

    // Check existing active or pending interest
    const [existing] = await pool.query(
      'SELECT id, status FROM interests WHERE sender_user_id = ? AND receiver_user_id = ?',
      [senderId, receiverId]
    );

    if (existing.length > 0) {
      const currentStatus = existing[0].status;
      if (currentStatus === 'pending' || currentStatus === 'accepted') {
        return res.status(409).json({
          success: false,
          message: `You have already sent an interest request to this user (Status: ${currentStatus}).`
        });
      }

      // If previously withdrawn or rejected, re-activate as pending
      await pool.query(
        'UPDATE interests SET status = "pending", message = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [message ? message.trim() : null, existing[0].id]
      );

      return res.status(200).json({
        success: true,
        message: 'Interest request re-opened successfully.',
        interestId: existing[0].id
      });
    }

    // Insert new interest
    const [result] = await pool.query(
      'INSERT INTO interests (sender_user_id, receiver_user_id, status, message) VALUES (?, ?, "pending", ?)',
      [senderId, receiverId, message ? message.trim() : null]
    );

    res.status(201).json({
      success: true,
      message: 'Interest request sent successfully!',
      interestId: result.insertId
    });
  } catch (error) {
    next(error);
  }
}

async function getReceivedInterests(req, res, next) {
  const currentUserId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT i.id, i.sender_user_id, i.status, i.message, i.created_at, i.updated_at,
              u.full_name as sender_name, u.email as sender_email,
              p.city, p.preferred_location, p.min_budget, p.max_budget,
              p.food_preference, p.smoking_preference, p.sleeping_schedule,
              p.cleanliness_preference, p.about_me
       FROM interests i
       JOIN users u ON i.sender_user_id = u.id
       LEFT JOIN profiles p ON i.sender_user_id = p.user_id
       WHERE i.receiver_user_id = ?
       ORDER BY i.created_at DESC`,
      [currentUserId]
    );

    res.status(200).json({
      success: true,
      count: rows.length,
      interests: rows
    });
  } catch (error) {
    next(error);
  }
}

async function getSentInterests(req, res, next) {
  const currentUserId = req.session.userId;

  try {
    const [rows] = await pool.query(
      `SELECT i.id, i.receiver_user_id, i.status, i.message, i.created_at, i.updated_at,
              u.full_name as receiver_name,
              p.city, p.preferred_location, p.min_budget, p.max_budget,
              p.food_preference, p.smoking_preference, p.sleeping_schedule,
              p.cleanliness_preference, p.about_me
       FROM interests i
       JOIN users u ON i.receiver_user_id = u.id
       LEFT JOIN profiles p ON i.receiver_user_id = p.user_id
       WHERE i.sender_user_id = ?
       ORDER BY i.created_at DESC`,
      [currentUserId]
    );

    res.status(200).json({
      success: true,
      count: rows.length,
      interests: rows
    });
  } catch (error) {
    next(error);
  }
}

async function updateInterestStatus(req, res, next) {
  const currentUserId = req.session.userId;
  const interestId = parseInt(req.params.id, 10);
  const { status } = req.body;

  if (isNaN(interestId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid interest ID.'
    });
  }

  const validStatuses = ['accepted', 'rejected', 'withdrawn'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
    });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, sender_user_id, receiver_user_id, status FROM interests WHERE id = ?',
      [interestId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Interest record not found.'
      });
    }

    const interest = rows[0];

    // Authorization checks
    if (status === 'withdrawn') {
      // Only the sender can withdraw their interest
      if (interest.sender_user_id !== currentUserId) {
        return res.status(403).json({
          success: false,
          message: 'Only the sender can withdraw this interest request.'
        });
      }
    } else if (status === 'accepted' || status === 'rejected') {
      // Only the receiver can accept or reject
      if (interest.receiver_user_id !== currentUserId) {
        return res.status(403).json({
          success: false,
          message: 'Only the recipient can accept or reject this interest request.'
        });
      }
    }

    await pool.query(
      'UPDATE interests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, interestId]
    );

    res.status(200).json({
      success: true,
      message: `Interest request status updated to ${status}.`,
      status
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  expressInterest,
  getReceivedInterests,
  getSentInterests,
  updateInterestStatus
};
