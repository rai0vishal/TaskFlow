const mongoose = require('mongoose');

const taskActivitySchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ['created', 'updated', 'deleted'],
      required: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      description: 'Stores previous vs new state or other metadata related to the change',
    },
  },
  {
    timestamps: true,
  }
);

// Optimize query performance for retrieving logs by task, sorted by newest
taskActivitySchema.index({ task: 1, createdAt: -1 });

const TaskActivity = mongoose.model('TaskActivity', taskActivitySchema);

module.exports = TaskActivity;
