#!/usr/bin/env osascript -l JavaScript

// Complete a task in OmniFocus by name (searches inbox and all tasks)
// Usage: osascript -l JavaScript complete_task.js "Task name"

function run(args) {
    const of = Application('OmniFocus');
    const doc = of.defaultDocument;
    
    if (args.length === 0) {
        console.log("Error: Task name required");
        return;
    }
    
    const taskName = args[0];
    
    // Search inbox first
    const inboxTasks = doc.inboxTasks();
    for (let i = 0; i < inboxTasks.length; i++) {
        if (inboxTasks[i].name() === taskName && !inboxTasks[i].completed()) {
            try {
                inboxTasks[i].markComplete();
                console.log("Task completed: " + taskName);
                return true;
            } catch (e) {
                console.log("Error: " + e.message);
                return false;
            }
        }
    }
    
    // If not found, search all tasks
    const allTasks = doc.flattenedTasks();
    for (let i = 0; i < allTasks.length; i++) {
        if (allTasks[i].name() === taskName && !allTasks[i].completed()) {
            try {
                allTasks[i].markComplete();
                console.log("Task completed: " + taskName);
                return true;
            } catch (e) {
                console.log("Error: " + e.message);
                return false;
            }
        }
    }
    
    console.log("Task not found: " + taskName);
    return false;
}
