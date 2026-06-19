/**
 * seedDemoData.js
 *
 * Generates a realistic demo workspace for screenshots:
 *  - 2 demo users
 *  - 1 workspace + 1 board with Todo / In Progress / In Review / Done lists
 *  - ~18 "active" tasks (recent createdAt) for a populated kanban board
 *  - ~50-70 "done" tasks spread unevenly across the last 90 days
 *    (weekday-biased, with quiet days and occasional bursts) so the
 *    profile contribution heatmap and analytics trend chart look like
 *    real usage instead of a uniform grid.
 *
 * NOTE ON TIMESTAMPS:
 * All these models use `timestamps: true`, which makes Mongoose
 * auto-overwrite createdAt/updatedAt on every .save() / .create().
 * To backdate Task timestamps reliably, we bypass Mongoose entirely
 * for Task inserts and write directly via the raw MongoDB driver
 * (Task.collection.insertMany), which runs no hooks/plugins at all.
 * User/Workspace/Board/List use normal Mongoose .create() (so the
 * User pre-save password hash hook still runs), then we patch their
 * createdAt afterward via a raw collection update so the workspace
 * doesn't look "newer" than the tasks inside it.
 *
 * USAGE:
 *   1. Place this file in backend/scripts/seedDemoData.js
 *   2. Run from the backend folder:  node scripts/seedDemoData.js
 *   3. Re-runnable: it deletes any previous demo data tied to the
 *      two demo emails before recreating it.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

const User = require('../models/User');
const Workspace = require('../models/Workspace');
const Board = require('../models/Board');
const List = require('../models/List');
const Task = require('../models/Task');
const TaskActivity = require('../models/TaskActivity');

const MONGO_URI =
  process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/taskflow';

const DEMO_USERS = [
  { name: 'Aanya Sharma', email: 'aanya.demo@taskflow.local', password: 'Demo@1234', role: 'admin' },
  { name: 'Rohan Mehta', email: 'rohan.demo@taskflow.local', password: 'Demo@1234', role: 'member' },
];

const WORKSPACE_NAME = 'Q3 Product Launch';
const BOARD_NAME = 'Product Launch Board';

const TASK_TITLES = [
  'Design onboarding flow wireframes', 'Set up CI/CD pipeline for staging',
  'Fix mobile nav overlap on Safari', 'Write API docs for /tasks endpoint',
  'Implement dark mode toggle', 'Optimize image loading on dashboard',
  'Add pagination to task list', 'Refactor auth middleware for clarity',
  'Create email templates for invites', 'Conduct user interview round 2',
  'Update README with deployment guide', 'Add unit tests for workspace service',
  'Fix drag-and-drop ordering bug', 'Integrate Stripe billing webhook',
  'Design empty states for analytics', 'Review pull request #142',
  'Set up error monitoring with Sentry', 'Migrate database indexes for performance',
  'Polish loading skeleton animations', 'Add keyboard shortcuts for task creation',
  'Write changelog for v1.2 release', 'Audit accessibility on settings page',
  'Implement workspace invite email flow', 'Add real-time typing indicator to chat',
  'Fix timezone bug in due date picker', 'Create marketing landing page copy',
  'Set up automated backups for MongoDB', 'Add rate limiting to auth endpoints',
  'Build CSV export for task reports', 'Fix memory leak in socket connection',
  'Add dark mode support to chat panel', 'Implement task priority auto-calculation',
  'Write integration tests for invite flow', 'Design 404 and error pages',
  'Add avatar upload for user profiles', 'Optimize bundle size with code splitting',
  'Fix flaky e2e test for login', 'Add search functionality to task board',
  'Create onboarding checklist for new users', 'Review security audit findings',
  'Update dependencies to patch CVEs', 'Add toast notifications for actions',
  'Implement soft-delete for workspaces', 'Polish mobile responsive layout',
  'Add loading states to chat panel', 'Write postmortem for staging incident',
  'Set up staging environment', 'Add filters to analytics dashboard',
  'Fix race condition in task reordering', 'Create demo video for landing page',
  'Tighten CORS config for production', 'Add empty-state illustration to board',
];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function priorityFromScore(score) {
  if (score >= 85) return 'Critical';
  if (score >= 60) return 'High';
  if (score >= 30) return 'Medium';
  return 'Low';
}

function randomTask(overrides = {}) {
  const score = Math.floor(Math.random() * 100);
  return {
    title: randomFrom(TASK_TITLES),
    description: '',
    complexity: randomFrom(['Easy', 'Medium', 'Hard']),
    priorityScore: score,
    priorityLabel: priorityFromScore(score),
    dueDate: Math.random() < 0.5 ? null : new Date(Date.now() + (Math.random() * 14 - 5) * 86400000),
    ...overrides,
  };
}

// Spreads "done" timestamps unevenly across the last N days: weekday-biased,
// with quiet days and occasional 3-4 task bursts, so the heatmap/trend chart
// look like real usage rather than a uniform grid.
function generateDoneDates(numDays = 90) {
  const dates = [];
  const today = new Date();
  for (let i = numDays - 1; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
    const roll = Math.random();
    let count = 0;

    if (isWeekend) {
      if (roll < 0.25) count = 1;
      else if (roll < 0.32) count = 2;
    } else {
      if (roll < 0.15) count = 0;
      else if (roll < 0.55) count = 1;
      else if (roll < 0.85) count = 2;
      else if (roll < 0.97) count = 3;
      else count = 4;
    }

    for (let t = 0; t < count; t++) {
      const completedAt = new Date(day);
      completedAt.setHours(9 + Math.floor(Math.random() * 9), Math.floor(Math.random() * 60), 0, 0);
      dates.push(completedAt);
    }
  }
  return dates;
}

async function cleanupPreviousDemoData() {
  const emails = DEMO_USERS.map((u) => u.email);
  const existingUsers = await User.find({ email: { $in: emails } }).select('_id');
  const userIds = existingUsers.map((u) => u._id);
  if (!userIds.length) return;

  const workspaces = await Workspace.find({ owner: { $in: userIds } }).select('_id');
  const workspaceIds = workspaces.map((w) => w._id);
  const boards = await Board.find({ workspace: { $in: workspaceIds } }).select('_id');
  const boardIds = boards.map((b) => b._id);

  await TaskActivity.deleteMany({ performedBy: { $in: userIds } });
  await Task.deleteMany({ workspace: { $in: workspaceIds } });
  await List.deleteMany({ board: { $in: boardIds } });
  await Board.deleteMany({ workspace: { $in: workspaceIds } });
  await Workspace.deleteMany({ _id: { $in: workspaceIds } });
  await User.deleteMany({ _id: { $in: userIds } });

  console.log(`Cleaned up previous demo data (${userIds.length} user(s)).`);
}

async function backdateCreatedAt(model, id, date) {
  await model.collection.updateOne({ _id: id }, { $set: { createdAt: date, updatedAt: date } });
}

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB.');

  await cleanupPreviousDemoData();

  // ---- Users ----
  const [owner, member] = await Promise.all(
    DEMO_USERS.map((u) => User.create({ name: u.name, email: u.email, password: u.password, role: u.role }))
  );
  const oldDate = new Date(Date.now() - 100 * 86400000);
  await backdateCreatedAt(User, owner._id, oldDate);
  await backdateCreatedAt(User, member._id, oldDate);

  // ---- Workspace ----
  const workspace = await Workspace.create({
    name: WORKSPACE_NAME,
    description: 'Cross-functional workspace for the Q3 product launch.',
    owner: owner._id,
    members: [
      { user: owner._id, role: 'admin' },
      { user: member._id, role: 'member' },
    ],
  });
  await backdateCreatedAt(Workspace, workspace._id, oldDate);

  // ---- Board ----
  const board = await Board.create({
    title: BOARD_NAME,
    workspace: workspace._id,
    description: 'Tracking everything needed to ship the launch.',
  });
  await backdateCreatedAt(Board, board._id, oldDate);

  // ---- Lists ----
  const listDefs = [
    { title: 'To Do', status: 'todo', order: 0 },
    { title: 'In Progress', status: 'in-progress', order: 1 },
    { title: 'In Review', status: 'in-review', order: 2 },
    { title: 'Done', status: 'done', order: 3 },
  ];
  const lists = {};
  for (const def of listDefs) {
    const list = await List.create({ title: def.title, board: board._id, order: def.order });
    await backdateCreatedAt(List, list._id, oldDate);
    lists[def.status] = list;
  }

  // ---- Tasks & Activities ----
  const rawTasks = [];
  const rawActivities = [];
  const orderCounters = { todo: 0, 'in-progress': 0, 'in-review': 0, done: 0 };

  function pushTask(status, createdAt) {
    const t = randomTask();
    const isDoneStatus = status === 'done';
    const taskId = mongoose.Types.ObjectId.createFromTime(Math.floor(createdAt.getTime() / 1000));
    const createdBy = Math.random() < 0.7 ? owner._id : member._id;

    rawTasks.push({
      _id: taskId,
      title: t.title,
      description: t.description,
      status,
      complexity: t.complexity,
      priorityScore: t.priorityScore,
      priorityLabel: t.priorityLabel,
      dueDate: t.dueDate,
      createdBy,
      assignedTo: Math.random() < 0.85 ? randomFrom([owner._id, member._id]) : undefined,
      workspace: workspace._id,
      board: board._id,
      list: lists[status]._id,
      order: orderCounters[status]++,
      createdAt,
      updatedAt: isDoneStatus ? createdAt : createdAt,
      __v: 0,
    });

    // Create a "created" task activity log
    const activityId = mongoose.Types.ObjectId.createFromTime(Math.floor(createdAt.getTime() / 1000));
    rawActivities.push({
      _id: activityId,
      task: taskId,
      action: 'created',
      performedBy: createdBy,
      details: { message: 'Task created' },
      createdAt,
      updatedAt: createdAt,
      __v: 0,
    });
  }

  // Active tasks for a populated kanban board (recent createdAt, last 1-10 days)
  const activeCounts = { todo: 6, 'in-progress': 6, 'in-review': 6 };
  for (const [status, count] of Object.entries(activeCounts)) {
    for (let i = 0; i < count; i++) {
      const createdAt = new Date(Date.now() - Math.random() * 10 * 86400000);
      pushTask(status, createdAt);
    }
  }

  // Done tasks spread across the last 90 days for the heatmap + trend chart
  const doneDates = generateDoneDates(90);
  for (const completedAt of doneDates) {
    // createdAt set 1-5 days before completion, for realism
    const createdAt = new Date(completedAt.getTime() - (1 + Math.random() * 4) * 86400000);
    const t = randomTask();
    const taskId = mongoose.Types.ObjectId.createFromTime(Math.floor(createdAt.getTime() / 1000));
    const createdBy = Math.random() < 0.7 ? owner._id : member._id;
    const assignedTo = randomFrom([owner._id, member._id]);

    rawTasks.push({
      _id: taskId,
      title: t.title,
      description: t.description,
      status: 'done',
      complexity: t.complexity,
      priorityScore: t.priorityScore,
      priorityLabel: t.priorityLabel,
      dueDate: null,
      createdBy,
      assignedTo,
      workspace: workspace._id,
      board: board._id,
      list: lists.done._id,
      order: orderCounters.done++,
      createdAt,
      updatedAt: completedAt,
      __v: 0,
    });

    // Create a "created" task activity log
    const activityCreatedId = mongoose.Types.ObjectId.createFromTime(Math.floor(createdAt.getTime() / 1000));
    rawActivities.push({
      _id: activityCreatedId,
      task: taskId,
      action: 'created',
      performedBy: createdBy,
      details: { message: 'Task created' },
      createdAt,
      updatedAt: createdAt,
      __v: 0,
    });

    // Create an "updated" status transition activity log at completedAt date
    const activityCompletedId = mongoose.Types.ObjectId.createFromTime(Math.floor(completedAt.getTime() / 1000));
    rawActivities.push({
      _id: activityCompletedId,
      task: taskId,
      action: 'updated',
      performedBy: assignedTo,
      details: { status: { old: 'todo', new: 'done' } },
      createdAt: completedAt,
      updatedAt: completedAt,
      __v: 0,
    });
  }

  await Task.collection.insertMany(rawTasks);
  await TaskActivity.collection.insertMany(rawActivities);

  console.log('\nDemo data created successfully.');
  console.log(`Workspace: ${WORKSPACE_NAME}`);
  console.log(`Board: ${BOARD_NAME}`);
  console.log(`Tasks: ${rawTasks.length} (${doneDates.length} done, spread over 90 days)`);
  console.log(`Task Activities: ${rawActivities.length} logs inserted.`);
  console.log('\nLogin credentials:');
  DEMO_USERS.forEach((u) => console.log(`  ${u.email} / ${u.password}  (${u.role})`));
  console.log('\nLog in as both users in two browser windows to capture the live chat typing indicator.');

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Seed script failed:', err);
  process.exit(1);
});
