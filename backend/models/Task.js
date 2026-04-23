const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: ['todo', 'in-progress', 'in-review', 'done'],
      default: 'todo',
    },
    complexity: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium',
    },
    priorityScore: {
      type: Number,
      default: 0,
      index: -1, // Critical for fast descending sorts
    },
    priorityLabel: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Low',
    },
    dueDate: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Task must belong to a user'],
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: [true, 'Task must belong to a workspace (personal or team)'],
    },
    board: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
    },
    list: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'List',
    },
    order: {
      type: Number,
      default: 0, // Used for drag-and-drop ordering within lists
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ── Compound Indexes (workspace-first for all multi-tenant queries) ──
// Primary compound indexes covering all workspace-scoped query patterns
taskSchema.index({ workspace: 1, status: 1 });
taskSchema.index({ workspace: 1, createdBy: 1 });
taskSchema.index({ workspace: 1, assignedTo: 1, status: 1, updatedAt: -1 });
taskSchema.index({ workspace: 1, updatedAt: -1 }); // For productivity trend aggregations

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
