/**
 * A specialized queue for scheduling tasks that will be executed after a specified delay.
 * Tasks are ordered by their scheduled execution time with the earliest tasks at the top.
 */
export class ScheduledQueueTask<T> {
    private taskQueue: Task<T>[] = [];
    private taskMap: Map<string, Task<T>> = new Map();
    private processorTimer: NodeJS.Timeout | null = null;
    private isShutdown = false;

    constructor() {
        this.startTaskProcessor();
    }

    /**
     * Adds a new task to the queue if a task with the same ID does not already exist.
     */
    public add(
        id: string,
        delay: number,
        input: T,
        triggerConsumer: (input: T) => void | Promise<void>
    ): boolean {
        if (!id || delay == null || !triggerConsumer) {
            throw new Error('Id, delay, and triggerConsumer cannot be null or undefined');
        }

        if (this.taskMap.has(id)) {
            return false; // Skip if task with the same ID already exists
        }

        const task = new Task(id, delay, input, triggerConsumer);
        this.insertTask(task);
        this.taskMap.set(id, task);
        
        this.scheduleTask(task, delay);
        return true;
    }

    /**
     * Adds a new task or resets the timer for an existing task with the same ID.
     */
    public addOrResetTimer(
        id: string,
        delay: number,
        input: T,
        triggerConsumer: (input: T) => void | Promise<void>
    ): boolean {
        if (!id || delay == null || !triggerConsumer) {
            throw new Error('Id, delay, and triggerConsumer cannot be null or undefined');
        }

        if (this.taskMap.has(id)) {
            this.resetTimer(id, delay);
            const task = this.taskMap.get(id)!;
            task.updateInput(input);
            task.updateConsumer(triggerConsumer);
            return true;
        } else {
            return this.add(id, delay, input, triggerConsumer);
        }
    }

    /**
     * Adds a new task or updates an existing one.
     */
    public addOrUpdate(
        id: string,
        delay: number,
        input: T,
        triggerConsumer: (input: T) => void | Promise<void>
    ): boolean {
        if (!id || delay == null || !triggerConsumer) {
            throw new Error('Id, delay, and triggerConsumer cannot be null or undefined');
        }

        if (this.taskMap.has(id)) {
            return this.update(id, delay, input, triggerConsumer);
        } else {
            return this.add(id, delay, input, triggerConsumer);
        }
    }

    /**
     * Updates an existing task with new values.
     */
    public update(
        id: string,
        delay: number,
        input: T,
        triggerConsumer: (input: T) => void | Promise<void>
    ): boolean {
        if (!id || delay == null || !triggerConsumer) {
            throw new Error('Id, delay, and triggerConsumer cannot be null or undefined');
        }

        if (!this.taskMap.has(id)) {
            return false;
        }

        const task = this.taskMap.get(id)!;
        
        // Cancel existing scheduled task
        if (task.getTimerId()) {
            clearTimeout(task.getTimerId()!);
        }

        // Remove from queue and update
        this.removeFromQueue(task);
        task.updateTimer(delay);
        task.updateInput(input);
        task.updateConsumer(triggerConsumer);
        this.insertTask(task);

        // Schedule the task again
        this.scheduleTask(task, delay);
        
        return true;
    }

    /**
     * Resets the timer for an existing task.
     */
    public resetTimer(id: string, delay: number): boolean {
        if (!id || delay == null) {
            throw new Error('Id and delay cannot be null or undefined');
        }

        if (!this.taskMap.has(id)) {
            return false;
        }

        const task = this.taskMap.get(id)!;
        
        // Cancel existing scheduled task
        if (task.getTimerId()) {
            clearTimeout(task.getTimerId()!);
        }

        // Remove from queue and update
        this.removeFromQueue(task);
        task.updateTimer(delay);
        this.insertTask(task);

        // Schedule the task again
        this.scheduleTask(task, delay);
        
        return true;
    }

    /**
     * Removes a task from the queue.
     */
    public remove(id: string): boolean {
        if (!id) {
            throw new Error('Id cannot be null or undefined');
        }

        const task = this.taskMap.get(id);
        if (!task) {
            return false;
        }

        // Cancel scheduled execution
        if (task.getTimerId()) {
            clearTimeout(task.getTimerId()!);
        }

        this.removeFromQueue(task);
        this.taskMap.delete(id);
        return true;
    }

    /**
     * Checks if a task exists in the queue.
     */
    public contains(id: string): boolean {
        if (!id) {
            throw new Error('Id cannot be null or undefined');
        }
        
        return this.taskMap.has(id);
    }

    /**
     * Gets a task from the queue without removing it.
     */
    public get(id: string): T | null {
        if (!id) {
            throw new Error('Id cannot be null or undefined');
        }
        
        const task = this.taskMap.get(id);
        return task?.getInput() ?? null;
    }

    /**
     * Gets and removes a task from the queue.
     */
    public getAndRemove(id: string): T | null {
        const result = this.get(id);
        this.remove(id);
        return result;
    }

    /**
     * Gets a task and resets its timer.
     */
    public getAndResetTimer(id: string, delay: number): T | null {
        const result = this.get(id);
        this.resetTimer(id, delay);
        return result;
    }

    /**
     * Removes and returns the input of the task with the earliest execution time.
     */
    public pop(): T | null {
        if (this.taskQueue.length === 0) {
            return null;
        }

        const task = this.taskQueue.shift()!;
        this.taskMap.delete(task.getId());

        // Cancel scheduled execution
        if (task.getTimerId()) {
            clearTimeout(task.getTimerId()!);
        }

        return task.getInput();
    }

    /**
     * Returns the input of the task with the earliest execution time without removing it.
     */
    public peek(): T | null {
        return this.taskQueue.length > 0 ? this.taskQueue[0].getInput() : null;
    }

    /**
     * Returns the number of tasks in the queue.
     */
    public size(): number {
        return this.taskQueue.length;
    }

    /**
     * Checks if the queue is empty.
     */
    public isEmpty(): boolean {
        return this.taskQueue.length === 0;
    }

    /**
     * Clears all tasks from the queue.
     */
    public clear(): void {
        // Cancel all scheduled tasks
        for (const task of this.taskQueue) {
            if (task.getTimerId()) {
                clearTimeout(task.getTimerId()!);
            }
        }

        this.taskQueue = [];
        this.taskMap.clear();
    }

    /**
     * Shuts down the scheduler and releases resources.
     */
    public shutdown(): void {
        this.isShutdown = true;
        
        if (this.processorTimer) {
            clearInterval(this.processorTimer);
            this.processorTimer = null;
        }

        this.clear();
    }

    private insertTask(task: Task<T>): void {
        // Insert task in sorted order (priority queue behavior)
        let insertIndex = 0;
        while (insertIndex < this.taskQueue.length && 
               this.taskQueue[insertIndex].getExecutionTime() <= task.getExecutionTime()) {
            insertIndex++;
        }
        this.taskQueue.splice(insertIndex, 0, task);
    }

    private removeFromQueue(task: Task<T>): void {
        const index = this.taskQueue.indexOf(task);
        if (index !== -1) {
            this.taskQueue.splice(index, 1);
        }
    }

    private scheduleTask(task: Task<T>, delay: number): void {
        const timerId = setTimeout(async () => {
            if (this.taskMap.has(task.getId())) {
                try {
                    await task.getTriggerConsumer()(task.getInput());
                } catch (error) {
                    console.error(`Error executing task ${task.getId()}:`, error);
                } finally {
                    // Remove the task after execution
                    this.removeFromQueue(task);
                    this.taskMap.delete(task.getId());
                }
            }
        }, delay);

        task.setTimerId(timerId);
    }

    private startTaskProcessor(): void {
        this.processorTimer = setInterval(() => {
            if (this.isShutdown) return;

            const currentTime = Date.now();
            while (this.taskQueue.length > 0 && this.taskQueue[0].getExecutionTime() <= currentTime) {
                const task = this.taskQueue.shift()!;
                this.taskMap.delete(task.getId());

                // Cancel the scheduled timeout since we're executing it now
                if (task.getTimerId()) {
                    clearTimeout(task.getTimerId()!);
                }

                // Execute the task
                (async () => {
                    try {
                        await task.getTriggerConsumer()(task.getInput());
                    } catch (error) {
                        console.error(`Error executing task ${task.getId()}:`, error);
                    }
                })();
            }
        }, 100); // Check for due tasks every 100ms
    }
}

class Task<T> {
    private id: string;
    private executionTimeMillis: number;
    private input: T;
    private triggerConsumer: (input: T) => void | Promise<void>;
    private timerId: NodeJS.Timeout | null = null;

    constructor(
        id: string,
        delay: number,
        input: T,
        triggerConsumer: (input: T) => void | Promise<void>
    ) {
        this.id = id;
        this.input = input;
        this.triggerConsumer = triggerConsumer;
        this.executionTimeMillis = Date.now() + delay;
    }

    public getId(): string {
        return this.id;
    }

    public getExecutionTime(): number {
        return this.executionTimeMillis;
    }

    public getInput(): T {
        return this.input;
    }

    public getTriggerConsumer(): (input: T) => void | Promise<void> {
        return this.triggerConsumer;
    }

    public getTimerId(): NodeJS.Timeout | null {
        return this.timerId;
    }

    public setTimerId(timerId: NodeJS.Timeout): void {
        this.timerId = timerId;
    }

    public updateTimer(delay: number): void {
        this.executionTimeMillis = Date.now() + delay;
    }

    public updateInput(input: T): void {
        this.input = input;
    }

    public updateConsumer(triggerConsumer: (input: T) => void | Promise<void>): void {
        this.triggerConsumer = triggerConsumer;
    }
}