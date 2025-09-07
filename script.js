document.addEventListener('DOMContentLoaded', () => {
    const taskList = document.getElementById('task-list');
    const addTaskForm = document.getElementById('add-task-form');
    const taskInput = document.getElementById('task');
    const timeInput = document.getElementById('time');
    const statusInput = document.getElementById('status');
    const themeSwitcher = document.getElementById('theme-switcher');
    const body = document.body;

    const webAppUrl = 'https://script.google.com/macros/s/AKfycbxh8tLutsSIbjoVFjLy5HHnxHqcIpTXogmVIq2x77eGQ9VNHvc2TU9e_DU4C8tzvOoNNw/exec';

    // --- Confirmation Modal Class ---
    class ConfirmationModal {
        constructor(modalElement) {
            this.modal = modalElement;
            this.messageElement = this.modal.querySelector('#modal-message');
            this.confirmButton = this.modal.querySelector('#modal-confirm-btn');
            this.cancelButton = this.modal.querySelector('#modal-cancel-btn');
            this.confirmCallback = null;

            this.confirmButton.addEventListener('click', () => this.confirm());
            this.cancelButton.addEventListener('click', () => this.hide());
        }

        show(message, callback) {
            this.messageElement.textContent = message;
            this.confirmCallback = callback;
            this.modal.style.display = 'flex';
        }

        hide() {
            this.modal.style.display = 'none';
            this.confirmCallback = null;
        }

        confirm() {
            if (this.confirmCallback) {
                this.confirmCallback();
            }
            this.hide();
        }
    }

    const confirmationModal = new ConfirmationModal(document.getElementById('confirmation-modal'));

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

    const initializeTheme = () => {
        body.classList.add('no-transitions');
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme) {
            applyTheme(savedTheme);
        } else if (prefersDark) {
            applyTheme('dark-theme');
        } else {
            applyTheme('light-theme');
        }
        setTimeout(() => {
            body.classList.remove('no-transitions');
        }, 100);
    };

    initializeTheme();

    // --- Task Logic ---
    const createSkeletonLoader = () => {
        return `
            <div class="skeleton-loader">
                <div class="skeleton-card">
                    <div class="skeleton-header">
                        <div class="skeleton-title"></div>
                        <div class="skeleton-status"></div>
                    </div>
                    <div class="skeleton-time"></div>
                    <div class="skeleton-actions">
                        <div class="skeleton-button"></div>
                        <div class="skeleton-button"></div>
                        <div class="skeleton-button"></div>
                        <div class="skeleton-button"></div>
                    </div>
                </div>
                <div class="skeleton-card">
                    <div class="skeleton-header">
                        <div class="skeleton-title"></div>
                        <div class="skeleton-status"></div>
                    </div>
                    <div class="skeleton-time"></div>
                    <div class="skeleton-actions">
                        <div class="skeleton-button"></div>
                        <div class="skeleton-button"></div>
                        <div class="skeleton-button"></div>
                        <div class="skeleton-button"></div>
                    </div>
                </div>
            </div>
        `;
    };

    const renderTasks = async () => {
        console.log('Starting to render tasks - showing skeleton loader');
        taskList.innerHTML = createSkeletonLoader();
        
        try {
            console.log('Fetching tasks from:', webAppUrl);
            const response = await fetch(webAppUrl);
            const tasks = await response.json();
            console.log('Tasks received:', tasks);
            
            // Add minimum loading time to see skeleton
            await new Promise(resolve => setTimeout(resolve, 800));
            
            taskList.innerHTML = '';
            
            if (tasks.length === 0) {
                taskList.innerHTML = '<p>No tasks yet. Add your first task!</p>';
                return;
            }
            
            tasks.forEach((task, index) => {
                console.log(`Rendering task ${index}:`, task);
                const taskCard = document.createElement('div');
                taskCard.classList.add('task-card');
                taskCard.dataset.index = index;

                const statusClass = task.status ? task.status.toLowerCase().replace(' ', '-') : 'pending';

                taskCard.innerHTML = `
                    <div class="task-card-header">
                        <h3>${task.task || 'Untitled Task'}</h3>
                        <span class="task-card-status ${statusClass}">${task.status || 'Pending'}</span>
                    </div>
                    <p class="task-card-time">Time: ${task.time || 'Not specified'}</p>
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
            taskList.innerHTML = '<p>Error loading tasks. Please check your connection.</p>';
            console.error('Error fetching tasks:', error);
        }
    };

    const addTask = async (e) => {
        e.preventDefault();
        const taskValue = taskInput.value.trim();
        const timeValue = timeInput.value.trim();
        const statusValue = statusInput.value.trim();

        if (taskValue && timeValue) {
            console.log('Adding task with values:', { task: taskValue, time: timeValue, status: statusValue });
            
            // Show loading state
            const addButton = document.getElementById('addTaskBtn');
            const originalText = addButton.textContent;
            addButton.textContent = 'Adding...';
            addButton.disabled = true;

            const task = { action: 'add', task: taskValue, time: timeValue, status: statusValue };
            try {
                console.log('Sending task object:', task);
                const response = await fetch(webAppUrl, { method: 'POST', body: JSON.stringify(task) });
                const result = await response.json();
                console.log('Response from server:', result);
                
                if (result.result === 'success') {
                    addTaskForm.reset();
                    await renderTasks();
                    
                    // Show success message
                    confirmationModal.show(result.message || 'Task added successfully!', () => {
                        // Optional callback after user clicks OK
                    });
                } else {
                    confirmationModal.show('Error adding task. Please try again.', () => {});
                }
            } catch (error) {
                console.error('Error adding task:', error);
                confirmationModal.show('Error adding task. Please check your connection.', () => {});
            } finally {
                // Reset button state
                addButton.textContent = originalText;
                addButton.disabled = false;
            }
        }
    };

    const deleteTask = async (index) => {
        const task = { action: 'delete', id: index };
        try {
            await fetch(webAppUrl, { method: 'POST', body: JSON.stringify(task) });
            const cardToRemove = taskList.querySelector(`[data-index="${index}"]`);
            if (cardToRemove) {
                cardToRemove.remove();
            }
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    const updateStatus = async (index, newStatus) => {
        const updatedTask = { action: 'updateStatus', id: index, status: newStatus };
        try {
            await fetch(webAppUrl, { method: 'POST', body: JSON.stringify(updatedTask) });
            const cardToUpdate = taskList.querySelector(`[data-index="${index}"]`);
            if (cardToUpdate) {
                const statusElement = cardToUpdate.querySelector('.task-card-status');
                statusElement.textContent = newStatus;
                statusElement.className = `task-card-status ${newStatus.toLowerCase().replace(' ', '-')}`;
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    addTaskForm.addEventListener('submit', addTask);

    taskList.addEventListener('click', (e) => {
        const target = e.target;
        const card = target.closest('.task-card');
        if (!card) return;

        const index = card.dataset.index;

        if (target.classList.contains('deleteBtn')) {
            confirmationModal.show('Are you sure you want to delete this task?', () => {
                deleteTask(index);
            });
        } else if (target.classList.contains('statusBtn')) {
            const newStatus = target.dataset.status;
            confirmationModal.show(`Are you sure you want to change the status to "${newStatus}"?`, () => {
                updateStatus(index, newStatus);
            });
        }
    });

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').catch(err => console.log('ServiceWorker registration failed: ', err));
        });
    }

    renderTasks();
});