/**
 * Dynamically calculates a task's priority score based on multiple factors
 * @param {Object} params
 * @param {Date} params.dueDate - Deadline for the task
 * @param {String} params.complexity - 'Easy', 'Medium', 'Hard'
 * @param {Number} params.activeTasksCount - Workload of the assigned user
 * @returns {Object} { priorityScore, priorityLabel }
 */
const calculatePriority = ({ dueDate, complexity, activeTasksCount }) => {
  let score = 0;

  // 1. Complexity Weight
  // Harder tasks naturally require more attention
  if (complexity === 'Hard') score += 30;
  else if (complexity === 'Medium') score += 15;
  else if (complexity === 'Easy') score += 5;

  // 2. Workload Weight
  // If the user is overwhelmed with active tasks, we bump up the priority of this task
  // to ensure it surfaces and doesn't get lost in the backlog.
  if (activeTasksCount >= 10) score += 20;
  else if (activeTasksCount >= 5) score += 10;

  // 3. Due Date Urgency
  if (dueDate) {
    const hoursRemaining = (new Date(dueDate) - new Date()) / (1000 * 60 * 60);
    
    if (hoursRemaining < 0) {
      score += 60; // OVERDUE: Maximum penalty
    } else if (hoursRemaining <= 24) {
      score += 40; // Due in 1 day
    } else if (hoursRemaining <= 72) {
      score += 25; // Due in 3 days
    } else if (hoursRemaining <= 168) {
      score += 10; // Due in 7 days
    }
  }

  // 4. Resolve the Label
  let label = 'Low';
  if (score >= 60) label = 'Critical';
  else if (score >= 40) label = 'High';
  else if (score >= 20) label = 'Medium';

  return { priorityScore: score, priorityLabel: label };
};

module.exports = calculatePriority;
