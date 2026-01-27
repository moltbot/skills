#!/usr/bin/env osascript -l JavaScript

// Add a task to OmniFocus inbox
// Usage: osascript -l JavaScript add_task.js "Task name" ["Note text"] ["Due date YYYY-MM-DD"]

function run(args) {
    const of = Application('OmniFocus');
    const doc = of.defaultDocument;
    
    if (args.length === 0) {
        console.log("Error: Task name required");
        return;
    }
    
    const taskName = args[0];
    const note = args.length > 1 ? args[1] : "";
    const dueDate = args.length > 2 ? args[2] : null;
    
    const task = of.InboxTask({
        name: taskName,
        note: note
    });
    
    doc.inboxTasks.push(task);
    
    // Set due date if provided
    if (dueDate) {
        try {
            const date = new Date(dueDate);
            task.dueDate = date;
        } catch (e) {
            console.log("Warning: Could not parse due date: " + dueDate);
        }
    }
    
    console.log("Task added: " + taskName);
    return task.id();
}
