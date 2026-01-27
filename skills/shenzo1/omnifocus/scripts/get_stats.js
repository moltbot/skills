#!/usr/bin/env osascript -l JavaScript

// Get OmniFocus statistics
// Usage: osascript -l JavaScript get_stats.js

function run(args) {
    const of = Application('OmniFocus');
    const doc = of.defaultDocument;
    
    const allTasks = doc.flattenedTasks();
    const inboxTasks = doc.inboxTasks();
    
    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    let incomplete = 0;
    let flagged = 0;
    let overdue = 0;
    let dueSoon = 0;
    let available = 0;
    let blocked = 0;
    
    for (let i = 0; i < allTasks.length; i++) {
        const task = allTasks[i];
        const isComplete = task.completed();
        
        if (!isComplete) {
            incomplete++;
            
            if (task.flagged()) {
                flagged++;
            }
            
            const dueDate = task.dueDate();
            if (dueDate) {
                if (dueDate < now) {
                    overdue++;
                } else if (dueDate >= now && dueDate < threeDaysFromNow) {
                    dueSoon++;
                }
            }
            
            if (task.blocked && task.blocked()) {
                blocked++;
            } else {
                available++;
            }
        }
    }
    
    const stats = {
        total: allTasks.length,
        incomplete: incomplete,
        inbox: inboxTasks.length,
        flagged: flagged,
        overdue: overdue,
        dueSoon: dueSoon,
        available: available,
        blocked: blocked
    };
    
    return JSON.stringify(stats, null, 2);
}
