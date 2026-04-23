const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/sendResponse');
const User = require('../models/User');
const Task = require('../models/Task');
const Workspace = require('../models/Workspace');
const TaskActivity = require('../models/TaskActivity');
const cache = require('../utils/cache');

/**
 * @route   GET /api/v1/profile/:userId
 * @desc    Get user profile overview including global stats and 90-day heatmap
 * @access  Private
 */
const getUserProfile = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ success: false, message: 'Invalid userId' });
  }

  // Check cache
  const cacheKey = `profile:user:${userId}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return sendResponse(res, 200, 'Profile data retrieved (cached)', cached);
  }

  const userObjectId = new mongoose.Types.ObjectId(userId);

  // 1. User Info
  const userInfo = await User.findById(userId).select('-password').lean();
  if (!userInfo) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  // 2. Workspaces Joined
  const workspacesFound = await Workspace.find({ 'members.user': userObjectId }).lean();
  const workspaces = workspacesFound.map(ws => {
    const memberData = ws.members.find(m => m.user.toString() === userId);
    return {
      _id: ws._id,
      name: ws.name,
      role: memberData ? memberData.role : 'member'
    };
  });

  // 3. Stats — use countDocuments for performance instead of fetching all docs
  const [assigned, completed, tasksCreated] = await Promise.all([
    Task.countDocuments({ assignedTo: userObjectId }),
    Task.countDocuments({ assignedTo: userObjectId, status: 'done' }),
    Task.countDocuments({ createdBy: userObjectId }),
  ]);
  
  const stats = {
    assigned,
    completed,
    tasksCreated,
    completionRate: assigned ? Math.round((completed / assigned) * 100) : 0
  };

  // 4. Heatmap Data (Last 90 days of Activity)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setUTCHours(0, 0, 0, 0);
  ninetyDaysAgo.setUTCDate(ninetyDaysAgo.getUTCDate() - 89);

  const heatmapAgg = await TaskActivity.aggregate([
    { 
      $match: { 
        performedBy: userObjectId, 
        createdAt: { $gte: ninetyDaysAgo } 
      } 
    },
    { 
      $group: { 
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, 
        count: { $sum: 1 } 
      } 
    }
  ]);

  // Fill in zero days
  const heatmapData = [];
  for (let i = 0; i < 90; i++) {
    const d = new Date(ninetyDaysAgo);
    d.setUTCDate(d.getUTCDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const match = heatmapAgg.find(x => x._id === dateStr);
    heatmapData.push({
      date: dateStr,
      count: match ? match.count : 0
    });
  }

  // 5. Performance Tag
  let performanceTag = "Needs Improvement";
  // average completed per week over 90 days (13 weeks)
  const completedLast90 = heatmapAgg.reduce((acc, curr) => acc + curr.count, 0);
  const tasksPerWeek = Math.round((completedLast90 / 12.8) * 10) / 10;

  if (stats.completionRate >= 70 && tasksPerWeek >= 8) {
    performanceTag = "Highly Active";
  } else if (stats.completionRate >= 50 && tasksPerWeek >= 3) {
    performanceTag = "Consistent Contributor";
  } else if (completedLast90 > 0) {
    performanceTag = "Active Member";
  }

  // 6. Workload and Weekly Chart Data (for 7 days) — use countDocuments
  const [todoCount, inProgressCount] = await Promise.all([
    Task.countDocuments({ assignedTo: userObjectId, status: 'todo' }),
    Task.countDocuments({ assignedTo: userObjectId, status: 'in-progress' }),
  ]);

  const workload = {
    todo: todoCount,
    inProgress: inProgressCount
  };

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setUTCHours(0, 0, 0, 0);
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);

  const weeklyAgg = await TaskActivity.aggregate([
    { 
      $match: { 
        performedBy: userObjectId, 
        createdAt: { $gte: sevenDaysAgo } 
      } 
    },
    { 
      $group: { 
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, 
        count: { $sum: 1 } 
      } 
    }
  ]);

  const weeklyData = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setUTCDate(d.getUTCDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
    const match = weeklyAgg.find(x => x._id === dateStr);
    weeklyData.push({
      date: dayName,
      completed: match ? match.count : 0
    });
  }

  const result = {
    userInfo,
    stats,
    heatmapData,
    weeklyData,
    workload,
    workspaces,
    performanceTag
  };

  // Cache for 5 minutes
  cache.set(cacheKey, result);

  sendResponse(res, 200, 'Profile data retrieved successfully', result);
});

module.exports = {
  getUserProfile
};
