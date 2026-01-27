#!/usr/bin/env osascript -l JavaScript

// List tasks from OmniFocus
// Usage: osascript -l JavaScript list_tasks.js [filter] [limit]
// Filters: inbox, available, flagged, due-soon, overdue, all
// Default: available tasks (limit 20)

function run(args) {
    const of = Application('OmniFocus');
    const doc = of.defaultDocument;
    
    const filter = args.length > 0 ? args[0] : "available";
    const limit = args.length > 1 ? parseInt(args[1]) : 20;
    
    const results = [];
    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    if (filter === "inbox") {
        const inboxTasks = doc.inboxTasks();
        const count = Math.min(inboxTasks.length, limit);
        
        for (let i = 0; i < count; i++) {
            results.push(formatTask(inboxTasks[i]));
        }
    } else {
        const allTasks = doc.flattenedTasks();
        
        for (let i = 0; i < allTasks.length && results.length < limit; i++) {
            const task = allTasks[i];
            
            if (task.completed()) {
                continue;
            }
            
            let include = false;
            
            switch(filter) {
                case "flagged":
                    include = task.flagged();
                    break;
                case "available":
                    include = !task.blocked || !task.blocked();
                    break;
                case "due-soon":
                    const dueDate = task.dueDate();
                    include = dueDate && dueDate < threeDaysFromNow && dueDate >= now;
                    break;
                case "overdue":
                    const taskDueDate = task.dueDate();
                    include = taskDueDate && taskDueDate < now;
                    break;
                case "all":
                    include = true;
                    break;
                default:
                    console.log("Unknown filter: " + filter);
                    return;
            }
            
            if (include) {
                results.push(formatTask(task));
            }
        }
    }
    
    return JSON.stringify(results, null, 2);
}

function formatTask(task) {
    const project = task.containingProject();
    const tags = task.tags();
    
    return {
        name: task.name(),
        id: task.id(),
        note: task.note() || "",
        dueDate: task.dueDate() ? task.dueDate().toISOString() : null,
        flagged: task.flagged(),
        project: project ? project.name() : "Inbox",
        tags: tags.map(t => t.name()).join(", ")
    };
}
