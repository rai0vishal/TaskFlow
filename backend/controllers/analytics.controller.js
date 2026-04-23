const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/sendResponse');
const Task = require('../models/Task');
const TaskActivity = require('../models/TaskActivity');
const Workspace = require('../models/Workspace');
const cache = require('../utils/cache');

/**
 * Helper: Validate workspaceId is a valid ObjectId and user is a member.
 */
const validateWorkspaceAccess = async (workspaceId, userId) => {
  if (!workspaceId || !mongoose.Types.ObjectId.isValid(workspaceId)) {
    return { error: 'Valid workspaceId is required' };
  }

  const workspace = await Workspace.findById(workspaceId).lean();
  if (!workspace) {
    return { error: 'Workspace not found' };
  }

  const isMember = workspace.members.some(
    (m) => m.user.toString() === userId.toString()
  );
  if (!isMember) {
    return { error: 'You are not a member of this workspace' };
  }

  return { workspace };
};

/**
 * @route   GET /api/v1/analytics/dashboard?workspaceId=xxx
 * @desc    Get dashboard metrics including stats, activity, and weekly productivity — strictly scoped to workspace
 * @access  Private
 */
const getDashboardData = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { workspaceId } = req.query;

  // Validate workspace access
  const validation = await validateWorkspaceAccess(workspaceId, userId);
  if (validation.error) {
    return res.status(400).json({ success: false, message: validation.error });
  }

  const workspaceObjectId = new mongoose.Types.ObjectId(workspaceId);

  // Check cache first
  const cacheKey = `dashboard:ws:${workspaceId}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return sendResponse(res, 200, 'Dashboard data retrieved (cached)', cached);
  }

  // Workspace-scoped filter — NO global createdBy fallback
  const filter = { workspace: workspaceObjectId };

  // 1. Stats — use countDocuments for performance instead of fetching all docs
  const [total, todo, inProgress, done] = await Promise.all([
    Task.countDocuments(filter),
    Task.countDocuments({ ...filter, status: 'todo' }),
    Task.countDocuments({ ...filter, status: 'in-progress' }),
    Task.countDocuments({ ...filter, status: 'done' }),
  ]);

  const stats = { total, todo, inProgress, done };

  // 2. Recent Activities — scoped to tasks in this workspace
  const workspaceTasks = await Task.find(filter).select('_id').lean();
  const taskIds = workspaceTasks.map((t) => t._id);

  const recentActivities = await TaskActivity.find({ task: { $in: taskIds } })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('task', 'title')
    .populate('performedBy', 'name')
    .lean();

  // Filter out activities with deleted users/tasks
  const cleanActivities = recentActivities
    .filter((a) => a.performedBy && a.task)
    .map((a) => ({
      ...a,
      performedBy: a.performedBy || { name: 'Deleted User' },
      task: a.task || { title: 'Deleted Task' },
    }));

  // 3. Weekly Productivity (Last 7 Days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setUTCHours(0, 0, 0, 0);
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);

  // Use aggregation with workspace filter early for index utilization
  const [createdByDay, completedByDay] = await Promise.all([
    Task.aggregate([
      { $match: { ...filter, createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
    ]),
    Task.aggregate([
      {
        $match: {
          ...filter,
          status: 'done',
          updatedAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const weeklyProductivity = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setUTCDate(d.getUTCDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', {
      weekday: 'short',
      timeZone: 'UTC',
    });

    weeklyProductivity.push({
      date: dayName,
      created: createdByDay.find((x) => x._id === dateStr)?.count || 0,
      completed: completedByDay.find((x) => x._id === dateStr)?.count || 0,
    });
  }

  const result = {
    stats,
    recentActivities: cleanActivities,
    weeklyProductivity,
  };

  // Cache for 5 minutes
  cache.set(cacheKey, result);

  sendResponse(res, 200, 'Dashboard data retrieved', result);
});

/**
 * @route   GET /api/v1/analytics/user/:userId?workspaceId=xxx
 * @desc    Get comprehensive user analytics (Performance vs Contribution) scoped to workspace
 * @access  Private
 */
const getUserAnalytics = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { workspaceId, days = 30 } = req.query;
  const rangeDays = parseInt(days) || 30;

  // Validate inputs
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res
      .status(400)
      .json({ success: false, message: 'Invalid userId' });
  }

  const validation = await validateWorkspaceAccess(workspaceId, req.user._id);
  if (validation.error) {
    return res.status(400).json({ success: false, message: validation.error });
  }

  // Check cache
  const cacheKey = `analytics:user:${userId}:ws:${workspaceId}:days:${rangeDays}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return sendResponse(res, 200, 'User analytics retrieved (cached)', cached);
  }

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const workspaceObjectId = new mongoose.Types.ObjectId(workspaceId);

  // Common filters — workspace-first for index utilization
  const perfFilter = { workspace: workspaceObjectId, assignedTo: userObjectId };
  const contFilter = { workspace: workspaceObjectId, createdBy: userObjectId };

  // Date ranges
  const trendStartDate = new Date();
  trendStartDate.setUTCHours(0, 0, 0, 0);
  trendStartDate.setUTCDate(trendStartDate.getUTCDate() - (rangeDays - 1));

  // 1. Performance Metrics — use aggregation for counts instead of fetching all docs
  const [perfStats] = await Task.aggregate([
    { $match: perfFilter },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] },
        },
        totalCompletionTimeMs: {
          $sum: {
            $cond: [
              { $eq: ['$status', 'done'] },
              { $subtract: ['$updatedAt', '$createdAt'] },
              0,
            ],
          },
        },
      },
    },
  ]);

  const perfTotal = perfStats?.total || 0;
  const perfCompleted = perfStats?.completed || 0;
  const totalCompletionTimeMs = perfStats?.totalCompletionTimeMs || 0;

  const performance = {
    completed: perfCompleted,
    pending: perfTotal - perfCompleted,
    completionRate: perfTotal
      ? Math.round((perfCompleted / perfTotal) * 100)
      : 0,
    avgCompletionTime: perfCompleted
      ? Math.round(
          totalCompletionTimeMs / perfCompleted / (1000 * 60 * 60 * 24)
        )
      : 0,
  };

  // 2. Contribution Metrics — use aggregation
  const [contStats] = await Task.aggregate([
    { $match: contFilter },
    {
      $group: {
        _id: null,
        created: { $sum: 1 },
        delegated: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ['$assignedTo', null] },
                  { $ne: ['$assignedTo', userObjectId] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  const contribution = {
    created: contStats?.created || 0,
    delegated: contStats?.delegated || 0,
  };

  // 3. Productivity Trend (Tasks completed per day, last 30 days)
  const productivityTrendAgg = await Task.aggregate([
    {
      $match: {
        ...perfFilter,
        status: 'done',
        updatedAt: { $gte: trendStartDate },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } },
        count: { $sum: 1 },
      },
    },
  ]);

  const productivityTrend = [];
  for (let i = 0; i < rangeDays; i++) {
    const d = new Date(trendStartDate);
    d.setUTCDate(d.getUTCDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });

    productivityTrend.push({
      date: dayName,
      rawDate: dateStr,
      completed:
        productivityTrendAgg.find((x) => x._id === dateStr)?.count || 0,
    });
  }

  // 4. Weekly Distribution (Tasks completed per weekday Mon-Sun)
  const weeklyDistAgg = await Task.aggregate([
    { $match: { ...perfFilter, status: 'done' } },
    {
      $group: {
        _id: { $dayOfWeek: '$updatedAt' }, // 1=Sun, 2=Mon, ..., 7=Sat
        count: { $sum: 1 },
      },
    },
  ]);

  const dayMap = { 2: 'Mon', 3: 'Tue', 4: 'Wed', 5: 'Thu', 6: 'Fri', 7: 'Sat', 1: 'Sun' };
  const weeklyDistribution = [2, 3, 4, 5, 6, 7, 1].map((dow) => ({
    name: dayMap[dow],
    completed: weeklyDistAgg.find((x) => x._id === dow)?.count || 0,
  }));

  // 5. Completion Rate Trend (Weekly completion % for last 4 weeks) — use aggregation
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setUTCHours(0, 0, 0, 0);
  fourWeeksAgo.setUTCDate(fourWeeksAgo.getUTCDate() - 27);

  const completionTrend = [];
  const workload = [];

  for (let w = 3; w >= 0; w--) {
    const weekStart = new Date();
    weekStart.setUTCHours(0, 0, 0, 0);
    weekStart.setUTCDate(weekStart.getUTCDate() - w * 7 - 6);

    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
    weekEnd.setUTCHours(23, 59, 59, 999);

    const [weekStats] = await Task.aggregate([
      { $match: { ...perfFilter, createdAt: { $lte: weekEnd } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completedInWeek: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'done'] },
                    { $gte: ['$updatedAt', weekStart] },
                    { $lte: ['$updatedAt', weekEnd] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          assignedInWeek: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ['$createdAt', weekStart] },
                    { $lte: ['$createdAt', weekEnd] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const weekLabel = `Week ${4 - w}`;
    const total = weekStats?.total || 0;
    const completedInWeek = weekStats?.completedInWeek || 0;
    const assignedInWeek = weekStats?.assignedInWeek || 0;

    completionTrend.push({
      week: weekLabel,
      rate: total ? Math.round((completedInWeek / total) * 100) : 0,
    });

    workload.push({
      name: weekLabel,
      assigned: assignedInWeek,
      completed: completedInWeek,
    });
  }

  // 7. Overdue & Delay Analysis — use aggregation
  const now = new Date();
  const [overdueStats] = await Task.aggregate([
    {
      $match: {
        ...perfFilter,
        status: { $ne: 'done' },
        dueDate: { $lt: now, $ne: null },
      },
    },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        totalDelayMs: { $sum: { $subtract: [now, '$dueDate'] } },
      },
    },
  ]);

  const overdueCount = overdueStats?.count || 0;
  const overdue = {
    count: overdueCount,
    avgDelayDays: overdueCount
      ? Math.round(
          overdueStats.totalDelayMs / overdueCount / (1000 * 60 * 60 * 24)
        )
      : 0,
  };

  // 8. Smart Insights Generation
  const insights = [];

  if (completionTrend.length >= 2) {
    const currWk = completionTrend[3]?.rate || 0;
    const prevWk = completionTrend[2]?.rate || 0;
    if (currWk > prevWk) {
      insights.push(
        `Completion rate improved by ${currWk - prevWk}% this week.`
      );
    } else if (currWk < prevWk) {
      insights.push(
        `Completion rate dropped by ${prevWk - currWk}% this week.`
      );
    }
  }

  const busiestDay = weeklyDistribution.reduce(
    (max, d) => (d.completed > max.completed ? d : max),
    { completed: 0, name: '' }
  );
  if (busiestDay.completed > 0) {
    insights.push(`Most active day: ${busiestDay.name}.`);
  }

  if (performance.avgCompletionTime > 0) {
    insights.push(
      `You complete tasks in an average of ${performance.avgCompletionTime} days.`
    );
  }

  if (overdue.count > 0) {
    insights.push(`Attention: You have ${overdue.count} overdue task(s).`);
  }

  if (perfCompleted === 0) {
    insights.push("You haven't completed any tasks yet. Keep going!");
  }

  const result = {
    performance,
    contribution,
    productivityTrend,
    weeklyDistribution,
    completionTrend,
    workload,
    overdue,
    insights,
  };

  // Cache for 5 minutes
  cache.set(cacheKey, result);

  sendResponse(res, 200, 'User analytics retrieved', result);
});

module.exports = { getDashboardData, getUserAnalytics };
