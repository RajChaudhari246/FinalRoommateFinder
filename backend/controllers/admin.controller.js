/**
 * Admin Controller
 * Provides system-wide administrative capabilities:
 * - Real-time metrics and KPI dashboard
 * - New user registration tracking and user directory
 * - Account status management (active / suspended / inactive)
 * - Role management (user / admin)
 * - User deletion and cleanup
 * - Detailed profile auditing and interaction inspections
 * - Platform activity stream
 */
const { pool } = require('../config/database');

/**
 * Platform Overview & KPI Metrics
 */
async function getMetrics(req, res, next) {
  try {
    // 1. Total & New Users
    const [totalUsersRows] = await pool.query('SELECT COUNT(*) as count FROM users');
    const totalUsers = totalUsersRows[0]?.count || 0;

    // SQLite datetime functions: date('now'), datetime('now', '-7 days'), datetime('now', '-30 days')
    const [usersTodayRows] = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE date(created_at) >= date('now')"
    );
    const usersToday = usersTodayRows[0]?.count || 0;

    const [usersWeekRows] = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE created_at >= datetime('now', '-7 days')"
    );
    const usersThisWeek = usersWeekRows[0]?.count || 0;

    const [usersMonthRows] = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE created_at >= datetime('now', '-30 days')"
    );
    const usersThisMonth = usersMonthRows[0]?.count || 0;

    // 2. Status Breakdown
    const [statusRows] = await pool.query(
      'SELECT account_status, COUNT(*) as count FROM users GROUP BY account_status'
    );
    const statusCounts = { active: 0, suspended: 0, inactive: 0 };
    statusRows.forEach(r => {
      if (statusCounts.hasOwnProperty(r.account_status)) {
        statusCounts[r.account_status] = r.count;
      }
    });

    // 3. Roles Breakdown
    const [roleRows] = await pool.query(
      'SELECT role, COUNT(*) as count FROM users GROUP BY role'
    );
    const roleCounts = { user: 0, admin: 0 };
    roleRows.forEach(r => {
      if (roleCounts.hasOwnProperty(r.role)) {
        roleCounts[r.role] = r.count;
      }
    });

    // 4. Profiles & Living Wings
    const [compRows] = await pool.query(
      'SELECT COUNT(*) as count FROM profiles WHERE is_complete = 1'
    );
    const completedProfiles = compRows[0]?.count || 0;

    const [girlsRows] = await pool.query(
      "SELECT COUNT(*) as count FROM profiles WHERE gender = 'Female'"
    );
    const girlsWingCount = girlsRows[0]?.count || 0;

    const [boysRows] = await pool.query(
      "SELECT COUNT(*) as count FROM profiles WHERE gender = 'Male'"
    );
    const boysWingCount = boysRows[0]?.count || 0;

    // 5. Interests & Matches
    const [interestsTotalRows] = await pool.query('SELECT COUNT(*) as count FROM interests');
    const totalInterests = interestsTotalRows[0]?.count || 0;

    const [interestsAcceptedRows] = await pool.query(
      "SELECT COUNT(*) as count FROM interests WHERE status = 'accepted'"
    );
    const acceptedInterests = interestsAcceptedRows[0]?.count || 0;

    const [interestsPendingRows] = await pool.query(
      "SELECT COUNT(*) as count FROM interests WHERE status = 'pending'"
    );
    const pendingInterests = interestsPendingRows[0]?.count || 0;

    // 6. Top Locations
    const [topCities] = await pool.query(`
      SELECT city, COUNT(*) as count 
      FROM profiles 
      WHERE city IS NOT NULL AND city != 'Not Specified' 
      GROUP BY city 
      ORDER BY count DESC 
      LIMIT 5
    `);

    res.status(200).json({
      success: true,
      metrics: {
        users: {
          total: totalUsers,
          today: usersToday,
          this_week: usersThisWeek,
          this_month: usersThisMonth,
          by_status: statusCounts,
          by_role: roleCounts
        },
        profiles: {
          total: totalUsers,
          completed: completedProfiles,
          completion_rate: totalUsers > 0 ? Math.round((completedProfiles / totalUsers) * 100) : 0,
          girls_wing: girlsWingCount,
          boys_wing: boysWingCount,
          other_wing: Math.max(0, totalUsers - (girlsWingCount + boysWingCount))
        },
        interests: {
          total: totalInterests,
          accepted: acceptedInterests,
          pending: pendingInterests,
          match_rate: totalInterests > 0 ? Math.round((acceptedInterests / totalInterests) * 100) : 0
        },
        top_cities: topCities
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all users with search, timeframe filters (today, week, month), status, role, sorting
 */
async function getUsers(req, res, next) {
  try {
    const {
      search = '',
      timeframe = 'all', // 'today', 'week', 'month', 'all'
      status = 'all',
      role = 'all',
      gender = 'all',
      is_complete = 'all',
      sort = 'newest', // 'newest', 'oldest', 'name_asc', 'name_desc'
      limit = 100,
      offset = 0
    } = req.query;

    const conditions = [];
    const params = [];

    // Search query across name, email, city, college
    if (search.trim()) {
      const term = `%${search.trim().toLowerCase()}%`;
      conditions.push('(LOWER(u.full_name) LIKE ? OR LOWER(u.email) LIKE ? OR LOWER(p.city) LIKE ? OR LOWER(p.college_or_workplace) LIKE ?)');
      params.push(term, term, term, term);
    }

    // Timeframe filter for new users
    if (timeframe === 'today') {
      conditions.push("date(u.created_at) >= date('now')");
    } else if (timeframe === 'week') {
      conditions.push("u.created_at >= datetime('now', '-7 days')");
    } else if (timeframe === 'month') {
      conditions.push("u.created_at >= datetime('now', '-30 days')");
    }

    // Status filter
    if (status && status !== 'all') {
      conditions.push('u.account_status = ?');
      params.push(status);
    }

    // Role filter
    if (role && role !== 'all') {
      conditions.push('u.role = ?');
      params.push(role);
    }

    // Gender wing filter
    if (gender && gender !== 'all') {
      conditions.push('p.gender = ?');
      params.push(gender);
    }

    // Completion filter
    if (is_complete === '1' || is_complete === 'true') {
      conditions.push('p.is_complete = 1');
    } else if (is_complete === '0' || is_complete === 'false') {
      conditions.push('(p.is_complete = 0 OR p.is_complete IS NULL)');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Sorting
    let orderByClause = 'ORDER BY u.created_at DESC';
    if (sort === 'oldest') {
      orderByClause = 'ORDER BY u.created_at ASC';
    } else if (sort === 'name_asc') {
      orderByClause = 'ORDER BY u.full_name ASC';
    } else if (sort === 'name_desc') {
      orderByClause = 'ORDER BY u.full_name DESC';
    } else if (sort === 'updated') {
      orderByClause = 'ORDER BY u.updated_at DESC';
    }

    // Query total count
    const [countRows] = await pool.query(
      `SELECT COUNT(*) as count
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       ${whereClause}`,
      params
    );
    const totalCount = countRows[0]?.count || 0;

    // Fetch user rows with profile data and interest counts
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
    const parsedOffset = Math.max(parseInt(offset, 10) || 0, 0);

    const sql = `
      SELECT 
        u.id, u.full_name, u.email, u.role, u.account_status, u.created_at, u.updated_at,
        p.age, p.gender, p.city, p.preferred_location, p.college_or_workplace,
        p.min_budget, p.max_budget, p.food_preference, p.smoking_preference,
        p.drinking_preference, p.study_schedule, p.sleeping_schedule,
        p.cleanliness_preference, p.preferred_roommate_count, p.about_me,
        p.security_curfew, p.security_visitor_policy, p.security_amenities,
        p.security_emergency_contact, p.security_notes, p.is_complete,
        (SELECT COUNT(*) FROM interests WHERE sender_user_id = u.id) AS sent_interests_count,
        (SELECT COUNT(*) FROM interests WHERE receiver_user_id = u.id) AS received_interests_count,
        (SELECT COUNT(*) FROM interests WHERE (sender_user_id = u.id OR receiver_user_id = u.id) AND status = 'accepted') AS accepted_matches_count
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      ${whereClause}
      ${orderByClause}
      LIMIT ? OFFSET ?
    `;

    const [users] = await pool.query(sql, [...params, parsedLimit, parsedOffset]);

    // Annotate whether user is newly added (last 7 days) and relative time
    const now = Date.now();
    const formattedUsers = users.map(user => {
      const createdTime = new Date(user.created_at).getTime();
      const diffMs = now - createdTime;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      const isNew = diffDays <= 7;

      return {
        ...user,
        is_complete: Boolean(user.is_complete),
        is_new: isNew,
        age_in_days: diffDays,
        age_in_hours: diffHours
      };
    });

    res.status(200).json({
      success: true,
      total: totalCount,
      count: formattedUsers.length,
      limit: parsedLimit,
      offset: parsedOffset,
      timeframe,
      users: formattedUsers
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get comprehensive dossier on a single user
 */
async function getUserDetails(req, res, next) {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    if (!targetUserId) {
      return res.status(400).json({ success: false, message: 'Invalid user ID specified.' });
    }

    const [userRows] = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.role, u.account_status, u.created_at, u.updated_at,
              p.*
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.id = ?`,
      [targetUserId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const user = userRows[0];

    // Desired preferences
    const [prefRows] = await pool.query(
      'SELECT * FROM preferences WHERE user_id = ?',
      [targetUserId]
    );

    // Sent interests
    const [sentInterests] = await pool.query(
      `SELECT i.*, u.full_name as receiver_name, u.email as receiver_email
       FROM interests i
       JOIN users u ON i.receiver_user_id = u.id
       WHERE i.sender_user_id = ?
       ORDER BY i.created_at DESC`,
      [targetUserId]
    );

    // Received interests
    const [receivedInterests] = await pool.query(
      `SELECT i.*, u.full_name as sender_name, u.email as sender_email
       FROM interests i
       JOIN users u ON i.sender_user_id = u.id
       WHERE i.receiver_user_id = ?
       ORDER BY i.created_at DESC`,
      [targetUserId]
    );

    res.status(200).json({
      success: true,
      user: {
        ...user,
        is_complete: Boolean(user.is_complete),
        preferences: prefRows[0] || null,
        interactions: {
          sent: sentInterests,
          received: receivedInterests
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update user account status (active, suspended, inactive)
 */
async function updateUserStatus(req, res, next) {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    const { status } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ success: false, message: 'Invalid user ID.' });
    }

    if (!['active', 'suspended', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'active', 'suspended', or 'inactive'."
      });
    }

    // Safety guard: Admin cannot suspend their own active account
    if (req.session.userId === targetUserId && status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'You cannot suspend or deactivate your own administrator account.'
      });
    }

    const [userRows] = await pool.query('SELECT id, full_name, email, role FROM users WHERE id = ?', [targetUserId]);
    if (userRows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    await pool.query(
      "UPDATE users SET account_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [status, targetUserId]
    );

    res.status(200).json({
      success: true,
      message: `Account status for ${userRows[0].full_name} updated to '${status}'.`,
      user: {
        id: targetUserId,
        account_status: status
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Promote or demote user role (user / admin)
 */
async function updateUserRole(req, res, next) {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    const { role } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ success: false, message: 'Invalid user ID.' });
    }

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be 'user' or 'admin'."
      });
    }

    // Safety guard: Admin cannot demote themselves
    if (req.session.userId === targetUserId && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'You cannot revoke your own administrator privileges.'
      });
    }

    const [userRows] = await pool.query('SELECT id, full_name, email, role FROM users WHERE id = ?', [targetUserId]);
    if (userRows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    await pool.query(
      "UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [role, targetUserId]
    );

    res.status(200).json({
      success: true,
      message: `${userRows[0].full_name} is now a platform ${role === 'admin' ? 'Administrator 🛡️' : 'Standard User 👤'}.`,
      user: {
        id: targetUserId,
        role: role
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Permanently delete a user and associated records
 */
async function deleteUser(req, res, next) {
  try {
    const targetUserId = parseInt(req.params.id, 10);

    if (!targetUserId) {
      return res.status(400).json({ success: false, message: 'Invalid user ID.' });
    }

    // Safety guard: Admin cannot delete themselves
    if (req.session.userId === targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account from the administrator portal.'
      });
    }

    const [userRows] = await pool.query('SELECT id, full_name, email FROM users WHERE id = ?', [targetUserId]);
    if (userRows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const userName = userRows[0].full_name;

    // Delete related records
    await pool.query('DELETE FROM interests WHERE sender_user_id = ? OR receiver_user_id = ?', [targetUserId, targetUserId]);
    await pool.query('DELETE FROM preferences WHERE user_id = ?', [targetUserId]);
    await pool.query('DELETE FROM profiles WHERE user_id = ?', [targetUserId]);
    await pool.query('DELETE FROM users WHERE id = ?', [targetUserId]);

    res.status(200).json({
      success: true,
      message: `User '${userName}' and all associated profile, preference, and interest records have been permanently removed.`
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Real-time platform activity stream
 */
async function getActivityStream(req, res, next) {
  try {
    // 1. Latest registered users
    const [recentUsers] = await pool.query(`
      SELECT 
        u.id, u.full_name, u.email, u.role, u.created_at,
        p.city, p.gender, p.college_or_workplace
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      ORDER BY u.created_at DESC
      LIMIT 10
    `);

    // 2. Latest roommate connection interests
    const [recentInterests] = await pool.query(`
      SELECT 
        i.id, i.sender_user_id, i.receiver_user_id, i.status, i.message, i.created_at,
        u1.full_name AS sender_name, u1.email AS sender_email,
        u2.full_name AS receiver_name, u2.email AS receiver_email
      FROM interests i
      JOIN users u1 ON i.sender_user_id = u1.id
      JOIN users u2 ON i.receiver_user_id = u2.id
      ORDER BY i.created_at DESC
      LIMIT 10
    `);

    // Format events chronologically
    const events = [];

    recentUsers.forEach(u => {
      events.push({
        type: 'user_registered',
        title: 'New User Registered',
        description: `${u.full_name} (${u.email}) joined Roommate Finder`,
        details: {
          city: u.city || 'Shirpur',
          gender: u.gender || 'Not specified',
          college: u.college_or_workplace || 'General'
        },
        timestamp: u.created_at,
        icon: '👤'
      });
    });

    recentInterests.forEach(i => {
      events.push({
        type: 'interest_sent',
        title: 'Roommate Interest Request',
        description: `${i.sender_name} sent a request to ${i.receiver_name} [Status: ${i.status}]`,
        details: {
          message: i.message,
          status: i.status
        },
        timestamp: i.created_at,
        icon: '💌'
      });
    });

    // Sort combined events descending
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.status(200).json({
      success: true,
      events: events.slice(0, 20)
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin Profile Summary & Privileges
 */
async function getAdminProfile(req, res, next) {
  try {
    const adminId = req.session.userId;
    const [rows] = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.role, u.account_status, u.created_at,
              p.city, p.preferred_location, p.about_me, p.security_notes
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.id = ?`,
      [adminId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Admin profile not found.' });
    }

    const admin = rows[0];

    res.status(200).json({
      success: true,
      admin: {
        ...admin,
        privileges: [
          'Full Platform Access (Superadmin)',
          'View New & Registered Users Live Stream',
          'Search & Filter Complete User Directory',
          'Promote Users to Admin & Revoke Roles',
          'Suspend / Activate Member Accounts',
          'Permanent User & Data Deletion',
          'Inspect Dedicated Living Wing Protocols',
          'Audit Compatibility Matches & Connections',
          'System Diagnostics & Database Oversight'
        ],
        session: {
          session_id_preview: req.sessionID ? `${req.sessionID.substring(0, 8)}...` : 'Active',
          last_active: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMetrics,
  getUsers,
  getUserDetails,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getActivityStream,
  getAdminProfile
};
