# OmniFocus JXA (JavaScript for Automation) API Reference

## Overview

OmniFocus supports automation via JavaScript for Automation (JXA), which allows direct access to the OmniFocus data model. This reference covers key objects and methods for task management.

## Key Objects

### Application & Document

```javascript
const of = Application('OmniFocus');
const doc = of.defaultDocument;
```

### Database Object

The Database is the top-level container for all OmniFocus data.

**Properties:**
- `inbox` - Inbox tasks
- `library` - All projects and folders
- `tags` - All tags
- `flattenedTasks` - Flat array of all tasks
- `flattenedProjects` - Flat array of all projects
- `flattenedTags` - Flat array of all tags

### Task Object

**Properties:**
- `name()` / `name = value` - Task name
- `note()` / `note = value` - Task note
- `completed()` / `completed = value` - Completion status (boolean)
- `completionDate()` / `completionDate = value` - Date completed
- `dueDate()` / `dueDate = value` - Due date
- `deferDate()` / `deferDate = value` - Defer until date
- `flagged()` / `flagged = value` - Flagged status (boolean)
- `estimatedMinutes()` / `estimatedMinutes = value` - Time estimate
- `blocked()` - Whether task is blocked
- `containingProject()` - Parent project
- `tags()` - Array of assigned tags
- `id()` - Unique task identifier

**Methods:**
- `markComplete()` - Mark task as complete
- `markIncomplete()` - Mark task as incomplete

### Project Object

**Properties:**
- `name()` / `name = value` - Project name
- `note()` / `note = value` - Project note
- `status()` - Project status
- `completed()` / `completed = value` - Completion status
- `dueDate()` / `dueDate = value` - Project due date
- `containsSingletonActions()` - Whether project is a single actions list
- `sequential()` / `sequential = value` - Sequential vs parallel
- `tasks()` - Array of project tasks
- `flattenedTasks()` - All tasks including nested ones

### Tag Object

**Properties:**
- `name()` / `name = value` - Tag name
- `tasks()` - Tasks with this tag

## Common Patterns

### Query Tasks

Use `whose()` to filter tasks:

```javascript
// Get incomplete tasks
const incompleteTasks = doc.flattenedTasks.whose({completed: false})();

// Get flagged tasks
const flaggedTasks = doc.flattenedTasks.whose({flagged: true})();

// Get overdue tasks
const now = new Date();
const overdueTasks = doc.flattenedTasks.whose({
    completed: false,
    dueDate: {_lessThan: now}
})();

// Get available (unblocked) tasks
const availableTasks = doc.flattenedTasks.whose({
    completed: false,
    blocked: false
})();
```

### Create Tasks

```javascript
// Create inbox task
const task = of.InboxTask({
    name: "Task name",
    note: "Task note"
});
doc.inboxTasks.push(task);

// Set properties after creation
task.dueDate = new Date("2026-01-30");
task.flagged = true;
```

### Search by Name

```javascript
// Find task by exact name
const tasks = doc.flattenedTasks.whose({name: "Task name"})();

// Find project by name
const projects = doc.flattenedProjects.whose({name: "Project name"})();

// Manual text search
const searchTerm = "keyword";
const results = [];
const allTasks = doc.flattenedTasks();

for (let i = 0; i < allTasks.length; i++) {
    const task = allTasks[i];
    if (task.name().toLowerCase().includes(searchTerm.toLowerCase())) {
        results.push(task);
    }
}
```

### Date Handling

```javascript
// Create date from string
const date = new Date("2026-01-30");

// Set due date
task.dueDate = date;

// Check if task has due date
if (task.dueDate()) {
    console.log("Due: " + task.dueDate().toISOString());
}

// Clear due date
task.dueDate = null;
```

### Iterate Tasks

```javascript
// Simple iteration
const tasks = doc.inboxTasks();
for (let i = 0; i < tasks.length; i++) {
    console.log(tasks[i].name());
}

// With filtering
doc.flattenedTasks.whose({completed: false})().forEach(task => {
    console.log(task.name());
});
```

## Return Values

JXA methods return values differently:
- Property getters: Call with `()` - e.g., `task.name()`
- Property setters: Assign directly - e.g., `task.name = "New name"`
- Arrays: Return native JavaScript arrays
- Objects: Return OmniFocus object references

## Error Handling

```javascript
try {
    // OmniFocus operations
    const task = doc.flattenedTasks.whose({name: "Task"})()[0];
    task.completed = true;
} catch (e) {
    console.log("Error: " + e.message);
}
```

## Best Practices

1. **Always check array length** before accessing elements:
   ```javascript
   const tasks = doc.inboxTasks();
   if (tasks.length > 0) {
       const task = tasks[0];
   }
   ```

2. **Use `whose()` for filtering** instead of manual loops when possible

3. **Return JSON** for script output to make it easy to parse:
   ```javascript
   return JSON.stringify(results, null, 2);
   ```

4. **Handle missing values** gracefully:
   ```javascript
   const note = task.note() || "";
   const project = task.containingProject() ? task.containingProject().name() : "Inbox";
   ```

5. **Convert dates to ISO strings** for portability:
   ```javascript
   dueDate: task.dueDate() ? task.dueDate().toISOString() : null
   ```
