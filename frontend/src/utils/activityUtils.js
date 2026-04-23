/**
 * Converts a raw activity detail into a human-readable sentence.
 */
export const formatActivityMessage = (activity) => {
  const { action, details, performedBy } = activity;
  const userName = performedBy?.name || 'Someone';

  if (action === 'created') {
    return `created this task`;
  }

  if (action === 'deleted') {
    return `deleted this task`;
  }

  if (action === 'updated' && details) {
    const fields = Object.keys(details);
    if (fields.length === 0) return `updated task fields`;

    // Handle special cases like assignment or status
    return fields.map(field => {
      let { old: oldVal, new: newVal } = details[field];
      
      // Clean up values
      const formatVal = (v) => {
        if (v === null || v === undefined || v === '') return 'empty';
        if (typeof v === 'string' && v.length > 20) return v.substring(0, 20) + '...';
        return String(v);
      };

      const fieldLabel = field.replace(/([A-Z])/g, ' $1').toLowerCase();
      
      return `changed ${fieldLabel} from "${formatVal(oldVal)}" to "${formatVal(newVal)}"`;
    }).join(', ');
  }

  return `performed an action`;
};

/**
 * Returns a list of structured changes for rendering.
 */
export const getStructuredChanges = (activity) => {
  if (activity.action !== 'updated' || !activity.details) return [];
  
  return Object.entries(activity.details).map(([field, changes]) => ({
    field: field.replace(/([A-Z])/g, ' $1').toLowerCase(),
    oldValue: changes.old,
    newValue: changes.new,
  }));
};
