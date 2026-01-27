#!/usr/bin/env osascript -l JavaScript

// Update a task in OmniFocus
// Usage: osascript -l JavaScript update_task.js "Task name" [--note "New note"] [--due "YYYY-MM-DD"] [--flag true/false]

function run(args) {
    const of = Application('OmniFocus');
    const doc = of.defaultDocument;
    
    if (args.length === 0) {
        console.log("Error: Task name required");
        return;
    }
    
    const taskName = args[0];
    let newNote = null;
    let newDueDate = null;
    let newFlagged = null;
    
    // Parse arguments
    for (let i = 1; i < args.length; i++) {
        if (args[i] === "--note" && i + 1 < args.length) {
            newNote = args[i + 1];
            i++;
        } else if (args[i] === "--due" && i + 1 < args.length) {
            newDueDate = args[i + 1];
            i++;
        } else if (args[i] === "--flag" && i + 1 < args.length) {
            newFlagged = args[i + 1] === "true";
            i++;
        }
    }
    
    // Search for task in inbox first
    const inboxTasks = doc.inboxTasks();
    for (let i = 0; i < inboxTasks.length; i++) {
        if (inboxTasks[i].name() === taskName) {
            updateTaskProperties(inboxTasks[i], newNote, newDueDate, newFlagged);
            console.log("Task updated: " + taskName);
            return true;
        }
    }
    
    // Search all tasks
    const allTasks = doc.flattenedTasks();
    for (let i = 0; i < allTasks.length; i++) {
        if (allTasks[i].name() === taskName && !allTasks[i].completed()) {
            updateTaskProperties(allTasks[i], newNote, newDueDate, newFlagged);
            console.log("Task updated: " + taskName);
            return true;
        }
    }
    
    console.log("Task not found: " + taskName);
    return false;
}

function updateTaskProperties(task, newNote, newDueDate, newFlagged) {
    if (newNote !== null) {
        task.note = newNote;
        console.log("Updated note");
    }
    
    if (newDueDate !== null) {
        try {
            task.dueDate = new Date(newDueDate);
            console.log("Updated due date to: " + newDueDate);
        } catch (e) {
            console.log("Error: Could not parse date: " + newDueDate);
        }
    }
    
    if (newFlagged !== null) {
        task.flagged = newFlagged;
        console.log("Updated flag to: " + newFlagged);
    }
}
