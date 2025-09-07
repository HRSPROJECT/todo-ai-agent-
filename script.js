document.addEventListener('DOMContentLoaded', () => {
    const taskList = document.getElementById('task-list');
    const addTaskForm = document.getElementById('add-task-form');
    const taskInput = document.getElementById('task');
    const timeInput = document.getElementById('time');
    const statusInput = document.getElementById('status');
    const themeSwitcher = document.getElementById('theme-switcher');
    const body = document.body;

    const webAppUrl = 'https://script.google.com/macros/s/AKfycbxh8tLutsSIbjoVFjLy5HHnxHqcIpTXogmVIq2x77eGQ9VNHvc2TU9e_DU4C8tzvOoNNw/exec';

    // --- Theme Switcher Logic ---
    const applyTheme = (theme) => {
        body.classList.remove('dark-theme', 'light-theme');
        body.classList.add(theme);
        localStorage.setItem('theme', theme);
    };

    themeSwitcher.addEventListener('click', () => {
        const currentTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark-theme' : 'light-theme');
        const newTheme = currentTheme === 'dark-theme' ? 'light-theme' : 'dark-theme';
        applyTheme(newTheme);
    });

    // Apply initial theme
    const initializeTheme = () => {
        body.classList.add('no-transitions'); // Disable transitions on initial load
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme) {
            applyTheme(savedTheme);
        } else if (prefersDark) {
            applyTheme('dark-theme');
        } else {
            applyTheme('light-theme');
        }
        // Use a timeout to re-enable transitions after the initial render
        setTimeout(() => {
            body.classList.remove('no-transitions');
        }, 100);
    };

    initializeTheme();

    // --- End Theme Switcher Logic ---

    const renderTasks = async () => {
        taskList.innerHTML = '<p>Loading tasks...</p>';
        try {
            const response = await fetch(webAppUrl);
            const tasks = await response.json();
            taskList.innerHTML = '';
            tasks.forEach((task, index) => {
                const taskCard = document.createElement('div');
                taskCard.classList.add('task-card');
                taskCard.dataset.index = index;

                const statusClass = task.status.toLowerCase().replace(' ', '-');

                taskCard.innerHTML = `
                    <div class="task-card-header">
                        <h3>${task.task}</h3>
                        <span class="task-card-status ${statusClass}">${task.status}</span>
                    </div>
                    <p class="task-card-time">Time: ${task.time}</p>
                    <div class="task-card-actions">
                        <button class="statusBtn" data-status="Pending">Pending</button>
                        <button class="statusBtn" data-status="In Progress">In Progress</button>
                        <button class="statusBtn" data-status="Done">Done</button>
                        <button class="deleteBtn">Delete</button>
                    </div>
                `;
                taskList.appendChild(taskCard);
            });
        } catch (error) {
            taskList.innerHTML = '<p>Error loading tasks.</p>';
            console.error('Error fetching tasks:', error);
        }
    };

    const addTask = async (e) => {
        e.preventDefault();
        const taskValue = taskInput.value.trim();
        const timeValue = timeInput.value.trim();
        const statusValue = statusInput.value.trim();

        if (taskValue && timeValue) {
            const task = { action: 'add', task: taskValue, time: timeValue, status: statusValue };
            try {
                await fetch(webAppUrl, { method: 'POST', body: JSON.stringify(task) });
                renderTasks();
                addTaskForm.reset();
            } catch (error) {
                console.error('Error adding task:', error);
            }
        }
    };

    const deleteTask = async (index) => {
        const task = { action: 'delete', id: index };
        try {
            await fetch(webAppUrl, { method: 'POST', body: JSON.stringify(task) });
            renderTasks();
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    const updateStatus = async (index, newStatus) => {
        const updatedTask = { action: 'updateStatus', id: index, status: newStatus };
        try {
            await fetch(webAppUrl, { method: 'POST', body: JSON.stringify(updatedTask) });
            renderTasks();
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    addTaskForm.addEventListener('submit', addTask);

    taskList.addEventListener('click', (e) => {
        const card = e.target.closest('.task-card');
        if (!card) return;

        const index = card.dataset.index;

        if (e.target.classList.contains('deleteBtn')) {
            deleteTask(index);
        }

        if (e.target.classList.contains('statusBtn')) {
            const newStatus = e.target.dataset.status;
            updateStatus(index, newStatus);
        }
    });

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').catch(err => console.log('ServiceWorker registration failed: ', err));
        });
    }

    renderTasks();
});