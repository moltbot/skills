#!/usr/bin/env osascript -l JavaScript

// Search tasks in OmniFocus by keyword
// Usage: osascript -l JavaScript search_tasks.js "search term" [limit]

function run(args) {
    const of = Application('OmniFocus');
    const doc = of.defaultDocument;
    
    if (args.length === 0) {
        console.log("Error: Search term required");
        return;
    }
    
    const searchTerm = args[0].toLowerCase();
    const limit = args.length > 1 ? parseInt(args[1]) : 20;
    
    const allTasks = doc.flattenedTasks();
    const results = [];
    
    for (let i = 0; i < allTasks.length && results.length < limit; i++) {
        const task = allTasks[i];
        
        if (task.completed()) {
            continue;
        }
        
        const name = task.name().toLowerCase();
        const note = (task.note() || "").toLowerCase();
        
        if (name.includes(searchTerm) || note.includes(searchTerm)) {
            const project = task.containingProject();
            const tags = task.tags();
            
            results.push({
                name: task.name(),
                id: task.id(),
                note: task.note() || "",
                dueDate: task.dueDate() ? task.dueDate().toISOString() : null,
                flagged: task.flagged(),
                project: project ? project.name() : "Inbox",
                tags: tags.map(t => t.name()).join(", ")
            });
        }
    }
    
    return JSON.stringify(results, null, 2);
}
