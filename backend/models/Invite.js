const mongoose = require('mongoose');

const inviteSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      maxlength: 500,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// Prevent duplicate pending invites
inviteSchema.index({ workspace: 1, receiver: 1, status: 1 }, { unique: true, partialFilterExpression: { status: 'pending' } });
inviteSchema.index({ receiver: 1, status: 1 });
inviteSchema.index({ workspace: 1 });

module.exports = mongoose.model('Invite', inviteSchema);
