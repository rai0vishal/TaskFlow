// Script to migrate legacy Tasks to Workspaces
// Handles: missing workspace, null workspace, orphan records
require('dotenv').config();
const mongoose = require('mongoose');
const Task = require('./models/Task');
const Workspace = require('./models/Workspace');
const User = require('./models/User');

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/taskflow');
    console.log('Connected to DB');

    // 1. Find tasks with no workspace or null/undefined workspace
    const orphanTasks = await Task.find({
      $or: [
        { workspace: { $exists: false } },
        { workspace: null },
      ]
    });
    console.log(`Found ${orphanTasks.length} tasks without a valid workspace...`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (let task of orphanTasks) {
      if (!task.createdBy) {
        console.warn(`  [SKIP] Task ${task._id} has no createdBy — cannot assign workspace`);
        skippedCount++;
        continue;
      }

      // Check if the user still exists
      const userExists = await User.exists({ _id: task.createdBy });
      if (!userExists) {
        console.warn(`  [SKIP] Task ${task._id} belongs to deleted user ${task.createdBy}`);
        skippedCount++;
        continue;
      }

      let workspace = await Workspace.findOne({ owner: task.createdBy, name: 'My Workspace' });
      if (!workspace) {
        workspace = await Workspace.create({
          name: 'My Workspace',
          owner: task.createdBy,
          members: [{ user: task.createdBy, role: 'admin' }]
        });
        console.log(`  [NEW] Created default workspace for user ${task.createdBy}`);
      }

      task.workspace = workspace._id;
      await task.save();
      migratedCount++;
    }

    // 2. Detect orphan tasks pointing to deleted workspaces
    const allWorkspaceIds = (await Workspace.find().select('_id').lean()).map(w => w._id.toString());
    const tasksWithWorkspace = await Task.find({ workspace: { $ne: null } }).select('_id workspace createdBy').lean();

    let orphanWorkspaceCount = 0;
    for (let task of tasksWithWorkspace) {
      if (!allWorkspaceIds.includes(task.workspace.toString())) {
        console.warn(`  [ORPHAN] Task ${task._id} references deleted workspace ${task.workspace}`);
        orphanWorkspaceCount++;

        // Re-assign to user's default workspace
        if (task.createdBy) {
          let defaultWs = await Workspace.findOne({ owner: task.createdBy, name: 'My Workspace' });
          if (!defaultWs) {
            defaultWs = await Workspace.create({
              name: 'My Workspace',
              owner: task.createdBy,
              members: [{ user: task.createdBy, role: 'admin' }]
            });
          }
          await Task.updateOne({ _id: task._id }, { workspace: defaultWs._id });
          console.log(`  [FIXED] Re-assigned task ${task._id} to default workspace`);
        }
      }
    }

    // 3. Summary
    console.log('\n═══ Migration Summary ═══');
    console.log(`  Tasks migrated:               ${migratedCount}`);
    console.log(`  Tasks skipped (no user):       ${skippedCount}`);
    console.log(`  Orphan workspace refs found:   ${orphanWorkspaceCount}`);
    console.log('═════════════════════════');
    console.log('Migration complete');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

migrate();
