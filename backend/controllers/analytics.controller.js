const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/sendResponse');
const Task = require('../models/Task');
const TaskActivity = require('../models/TaskActivity');

/**
 * @route   GET /api/v1/analytics/dashboard
 * @desc    Get dashboard metrics including stats, activity, and weekly productivity
 * @access  Private
 */
const getDashboardData = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const filter = req.user.role === 'admin' ? {} : { createdBy: userId };

  // 1. Stats
  const tasks = await Task.find(filter);
  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    done: tasks.filter(t => t.status === 'done').length,
  };

  // 2. Recent Activities
  const activityFilter = req.user.role === 'admin' ? {} : { performedBy: userId };
  const recentActivities = await TaskActivity.find(activityFilter)
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('task', 'title')
    .populate('performedBy', 'name');

  // 3. Weekly Productivity (Last 7 Days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setUTCHours(0, 0, 0, 0);
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);

  // Group task creation by date
  const createdByDay = await Task.aggregate([
    { $match: { ...filter, createdAt: { $gte: sevenDaysAgo } } },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } }
  ]);

  // Group completed tasks by date (based on updatedAt where status is done)
  const completedByDay = await Task.aggregate([
    { $match: { ...filter, status: 'done', updatedAt: { $gte: sevenDaysAgo } } },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } }, count: { $sum: 1 } } }
  ]);

  const weeklyProductivity = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setUTCDate(d.getUTCDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
    
    weeklyProductivity.push({
      date: dayName,
      created: createdByDay.find(x => x._id === dateStr)?.count || 0,
      completed: completedByDay.find(x => x._id === dateStr)?.count || 0,
    });
  }

  sendResponse(res, 200, 'Dashboard data retrieved', {
    stats,
    recentActivities,
    weeklyProductivity
  });
});

module.exports = { getDashboardData };
