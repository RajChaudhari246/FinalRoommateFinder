/**
 * Roommate Discovery & Matching Controller
 * Searches candidate profiles with parameterized SQL, filtering,
 * and rule-based compatibility scoring.
 */
const { pool } = require('../config/database');
const { calculateCompatibility } = require('../services/compatibility.service');

async function getRoommates(req, res, next) {
  const currentUserId = req.session ? req.session.userId : null;
  const {
    gender,
    section,
    securityVisitorPolicy,
    securityCurfew,
    securityAmenities,
    location,
    minBudget,
    maxBudget,
    food,
    smoking,
    study,
    sleeping,
    cleanliness,
    roommateCount,
    page = 1,
    limit = 12
  } = req.query;

  try {
    // 1. Fetch current user's preferences, profile, and gender for isolation
    let userContext = null;
    let userGender = req.session ? req.session.userGender : null;
    const isAdmin = req.session ? req.session.userRole === 'admin' : false;

    if (currentUserId) {
      const [userProfRows] = await pool.query(
        'SELECT * FROM profiles WHERE user_id = ?',
        [currentUserId]
      );
      const [userPrefRows] = await pool.query(
        'SELECT * FROM preferences WHERE user_id = ?',
        [currentUserId]
      );
      userContext = {
        profile: userProfRows[0] || null,
        preferences: userPrefRows[0] || null
      };

      if (!userGender && userProfRows[0]?.gender) {
        userGender = userProfRows[0].gender;
        if (req.session) req.session.userGender = userGender;
      }
    }

    const reqGenderLower = (gender || (section === 'female' ? 'female' : section === 'male' ? 'male' : null) || '').toLowerCase();
    const isReqGirls = reqGenderLower === 'female' || reqGenderLower === 'girls';
    const isReqBoys = reqGenderLower === 'male' || reqGenderLower === 'boys';

    // Access Control Enforcement:
    // If user is unauthenticated, protected wings require sign-in
    if (!currentUserId && !isAdmin) {
      if (isReqGirls) {
        return res.status(401).json({
          success: false,
          message: 'Authentication Required: The Girls Safe Wing is strictly protected for verified female members. Please sign in or register to access.'
        });
      }
      if (isReqBoys) {
        return res.status(401).json({
          success: false,
          message: 'Authentication Required: Please sign in or register to access the Boys Living Wing.'
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Authentication Required: Please log in or register to browse verified roommate profiles in your dedicated living wing.'
      });
    }

    // Authenticated non-admin user wing isolation
    if (userGender && !isAdmin) {
      const userGenderLower = userGender.toLowerCase();

      // Male user restrictions
      if (userGenderLower === 'male') {
        if (isReqGirls) {
          return res.status(403).json({
            success: false,
            message: 'Access Denied: The Girls Safe Wing is strictly reserved for verified female members. Male accounts cannot access this section.'
          });
        }
      }

      // Female user restrictions
      if (userGenderLower === 'female') {
        if (isReqBoys) {
          return res.status(403).json({
            success: false,
            message: 'Access Denied: The Boys Living Wing is reserved for male members. Female accounts cannot access this section.'
          });
        }
      }
    }

    // 2. Build parameterized query for candidates
    let sql = `
      SELECT u.id as user_id, u.full_name, u.created_at,
             p.age, p.gender, p.city, p.preferred_location, p.college_or_workplace,
             p.min_budget, p.max_budget, p.food_preference, p.smoking_preference,
             p.drinking_preference, p.study_schedule, p.sleeping_schedule,
             p.cleanliness_preference, p.preferred_roommate_count, p.about_me,
             p.profile_photo_path, p.security_curfew, p.security_visitor_policy,
             p.security_amenities, p.security_emergency_contact, p.security_notes,
             p.is_complete
      FROM users u
      JOIN profiles p ON u.id = p.user_id
      WHERE u.account_status = 'active'
        AND p.is_complete = TRUE
    `;

    const params = [];

    // Exclude current authenticated user
    if (currentUserId) {
      sql += ' AND u.id != ?';
      params.push(currentUserId);
    }

    // Filter: Gender Section
    // For non-admin users, ALWAYS enforce their wing strictly
    if (!isAdmin && userGender) {
      const enforceGender = userGender.toLowerCase() === 'female' ? 'Female' : 'Male';
      sql += ' AND LOWER(p.gender) = LOWER(?)';
      params.push(enforceGender);
    } else {
      const targetGender = gender || (section === 'female' ? 'Female' : section === 'male' ? 'Male' : null);
      if (targetGender && targetGender !== 'all' && targetGender !== 'any') {
        sql += ' AND LOWER(p.gender) = LOWER(?)';
        params.push(targetGender);
      }
    }

    // Filter: Security Visitor Policy
    if (securityVisitorPolicy && securityVisitorPolicy !== 'any') {
      sql += ' AND (p.security_visitor_policy = ? OR p.security_visitor_policy = "open" OR p.security_visitor_policy IS NULL)';
      params.push(securityVisitorPolicy);
    }

    // Filter: Security Curfew
    if (securityCurfew && securityCurfew !== 'any') {
      sql += ' AND (p.security_curfew = ? OR p.security_curfew = "flexible" OR p.security_curfew IS NULL)';
      params.push(securityCurfew);
    }

    // Filter: Security Amenities
    if (securityAmenities && securityAmenities !== 'any') {
      sql += ' AND (p.security_amenities = ? OR p.security_amenities IS NULL)';
      params.push(securityAmenities);
    }

    // Filter: Location
    if (location && location.trim().length > 0) {
      sql += ' AND (p.city LIKE ? OR p.preferred_location LIKE ?)';
      const locPattern = `%${location.trim()}%`;
      params.push(locPattern, locPattern);
    }

    // Filter: Budget overlap
    if (minBudget && !isNaN(parseFloat(minBudget))) {
      sql += ' AND p.max_budget >= ?';
      params.push(parseFloat(minBudget));
    }
    if (maxBudget && !isNaN(parseFloat(maxBudget))) {
      sql += ' AND p.min_budget <= ?';
      params.push(parseFloat(maxBudget));
    }

    // Filter: Food
    if (food && food !== 'any') {
      sql += ' AND (p.food_preference = ? OR p.food_preference = "any")';
      params.push(food);
    }

    // Filter: Smoking
    if (smoking && smoking !== 'any') {
      sql += ' AND p.smoking_preference = ?';
      params.push(smoking);
    }

    // Filter: Study schedule
    if (study && study !== 'any' && study !== 'flexible') {
      sql += ' AND (p.study_schedule = ? OR p.study_schedule = "flexible")';
      params.push(study);
    }

    // Filter: Sleeping schedule
    if (sleeping && sleeping !== 'any' && sleeping !== 'flexible') {
      sql += ' AND (p.sleeping_schedule = ? OR p.sleeping_schedule = "flexible")';
      params.push(sleeping);
    }

    // Filter: Cleanliness
    if (cleanliness && cleanliness !== 'any') {
      sql += ' AND p.cleanliness_preference = ?';
      params.push(cleanliness);
    }

    // Filter: Roommate count
    if (roommateCount && !isNaN(parseInt(roommateCount, 10))) {
      sql += ' AND p.preferred_roommate_count = ?';
      params.push(parseInt(roommateCount, 10));
    }

    sql += ' ORDER BY p.updated_at DESC';

    const [candidates] = await pool.query(sql, params);

    // 3. Calculate compatibility scores for each candidate
    const scoredRoommates = candidates.map(candidate => {
      let compatibility = null;
      if (userContext) {
        compatibility = calculateCompatibility(userContext, candidate);
      }

      return {
        ...candidate,
        compatibility: compatibility ? {
          percentage: compatibility.percentage,
          hasSufficientData: compatibility.hasSufficientData,
          message: compatibility.message,
          highlights: compatibility.factors
            .filter(f => f.status === 'positive' || f.status === 'negative')
            .slice(0, 3)
            .map(f => f.reason)
        } : null
      };
    });

    // Sort by compatibility descending if scores exist
    if (userContext) {
      scoredRoommates.sort((a, b) => {
        const scoreA = a.compatibility?.percentage ?? -1;
        const scoreB = b.compatibility?.percentage ?? -1;
        return scoreB - scoreA;
      });
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const totalCount = scoredRoommates.length;
    const totalPages = Math.ceil(totalCount / limitNum) || 1;
    const paginatedResults = scoredRoommates.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.status(200).json({
      success: true,
      count: totalCount,
      page: pageNum,
      totalPages,
      roommates: paginatedResults
    });
  } catch (error) {
    next(error);
  }
}

async function getRoommateCompatibility(req, res, next) {
  const currentUserId = req.session ? req.session.userId : null;
  const candidateId = parseInt(req.params.id, 10);

  if (!currentUserId) {
    return res.status(401).json({
      success: false,
      message: 'Please log in to calculate detailed compatibility.'
    });
  }

  if (isNaN(candidateId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid roommate profile ID.'
    });
  }

  try {
    // Current user context
    const [userProfRows] = await pool.query('SELECT * FROM profiles WHERE user_id = ?', [currentUserId]);
    const [userPrefRows] = await pool.query('SELECT * FROM preferences WHERE user_id = ?', [currentUserId]);

    const userContext = {
      profile: userProfRows[0] || null,
      preferences: userPrefRows[0] || null
    };

    // Candidate profile
    const [candidateRows] = await pool.query(
      `SELECT u.id as user_id, u.full_name, p.*
       FROM users u
       JOIN profiles p ON u.id = p.user_id
       WHERE u.id = ? AND u.account_status = 'active'`,
      [candidateId]
    );

    if (candidateRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Roommate profile not found.'
      });
    }

    const candidate = candidateRows[0];
    const compatibility = calculateCompatibility(userContext, candidate);

    res.status(200).json({
      success: true,
      candidate: {
        user_id: candidate.user_id,
        full_name: candidate.full_name,
        city: candidate.city,
        preferred_location: candidate.preferred_location,
        min_budget: candidate.min_budget,
        max_budget: candidate.max_budget
      },
      compatibility
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getRoommates,
  getRoommateCompatibility
};
